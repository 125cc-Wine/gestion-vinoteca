-- Productos gemelos Aroma <-> La Vid (depósito compartido)
--
-- Cada vino existe como 2 filas en `productos` (una por empresa). Hasta
-- ahora se mantenían iguales "por convención" desde la app (buscando la
-- contraparte por nombre exacto) y se desalineaban con el uso: stock,
-- precios y vínculos web distintos entre las dos filas del mismo vino.
--
-- Esta migración:
--   1. Respalda las tablas que toca (bk_20260922_*).
--   2. Fusiona vinos cargados DOS VECES dentro de la misma empresa
--      (errores de tipeo: Conejo/Consejo Verde, Via Blanca/Iaccarini Via
--      Blanca, etc.): pasa ventas/compras/pedidos/consignaciones/movimientos
--      /historial/añadas/listas de la fila duplicada a la que queda y
--      desactiva la duplicada (queda con sufijo " [fusionado]").
--   3. Agrega productos.gemelo_id (1 a 1 entre aroma y lavid), empareja por
--      nombre y deja los dos gemelos con los mismos valores (stock = el
--      mayor de los dos; el resto = el de la fila editada más recientemente;
--      vínculo web = el de aroma, que es el que usa el sync). Lo que cambió
--      queda registrado en productos_gemelos_reconciliacion.
--   4. Triggers: todo cambio en una fila se copia a su gemelo, y dar de alta
--      un producto crea (o vincula) su gemelo automáticamente.

-- 1. Respaldo ---------------------------------------------------------------
create table bk_20260922_productos            as select * from productos;
create table bk_20260922_ventas_items         as select id, items from ventas;
create table bk_20260922_compras_items        as select id, items from compras;
create table bk_20260922_pedidos_items        as select id, items from pedidos;
create table bk_20260922_consignaciones_items as select id, items from consignaciones;
create table bk_20260922_movimientos_stock    as select id, producto_id from movimientos_stock;
create table bk_20260922_historial_precios    as select id, producto_id from historial_precios;
create table bk_20260922_anada_items          as select id, producto_id from anada_items;
create table bk_20260922_listas_precio        as select id, producto_ids from listas_precio;

-- 2. Fusión de duplicados dentro de la misma empresa -------------------------
create temp table fusiones (empresa text, perdedor text, ganador text);
insert into fusiones values
  -- aroma
  ('aroma','a847b029','56c60754'), -- Caballero de la Cepa
  ('aroma','427fde15','709fca94'), -- Consejo -> Conejo Verde Brut Rose
  ('aroma','8a323cf6','78aa5b1d'), -- Humbero/Humbeto Canale
  ('aroma','014aafee','a7f86795'), -- Nomad Whisky
  ('aroma','a5eaf228','d3eb0df4'), -- Taymente Malbec (Huarpe)
  ('aroma','24558896','1e37a0cb'), -- Via Blanca Bonarda
  ('aroma','c7b0e6c1','c829b57b'), -- Via Blanca Cab. Sauvignon
  ('aroma','5a63815b','d5ac0554'), -- Via Blanca Malbec
  ('aroma','ce914089','f44ed70f'), -- Via Blanca Syrah
  ('aroma','5a500c33','93b0d36d'), -- Solou -> Zolo Zero Malbec Rosé
  -- lavid (mismos vinos)
  ('lavid','aa71ad4c','1176d357'),
  ('lavid','ec078eab','5f46ef5e'),
  ('lavid','55efcc13','98456175'),
  ('lavid','2f17eff1','3c722b78'),
  ('lavid','01633b33','9a8063cd'),
  ('lavid','11c96469','9f3f3a61'),
  ('lavid','128133f5','606c63bf'),
  ('lavid','844c2953','ff88f794'),
  ('lavid','a15212dc','f5830b6a'),
  ('lavid','59f3a7ca','f7540fab'); -- El Reventón N° 17 (nombre mal codificado)

create temp table fusion_ids as
select f.empresa,
  (select id from productos p where p.empresa=f.empresa and left(p.id::text,8)=f.perdedor) perdedor,
  (select id from productos p where p.empresa=f.empresa and left(p.id::text,8)=f.ganador)  ganador
from fusiones f;

do $$
begin
  if exists (select 1 from fusion_ids where perdedor is null or ganador is null) then
    raise exception 'fusión: id no encontrado';
  end if;
end $$;

update movimientos_stock m set producto_id=f.ganador from fusion_ids f where m.producto_id=f.perdedor;
update historial_precios m set producto_id=f.ganador from fusion_ids f where m.producto_id=f.perdedor;
update anada_items       m set producto_id=f.ganador from fusion_ids f where m.producto_id=f.perdedor;

-- listas de precio: reemplaza y saca repetidos, manteniendo el orden
update listas_precio l set producto_ids = (
  select array_agg(y order by ord) from (
    select coalesce(f.ganador, u.x) y, min(u.o) ord
    from unnest(l.producto_ids) with ordinality u(x, o)
    left join fusion_ids f on f.perdedor = u.x
    group by 1) s)
where l.producto_ids && (select array_agg(perdedor) from fusion_ids);

-- ítems JSON (ventas, compras, pedidos, consignaciones): producto_id -> ganador
create function pg_temp.remap_items(items jsonb) returns jsonb language sql as $$
  select coalesce(jsonb_agg(
    case when f.ganador is not null then jsonb_set(a.e, '{producto_id}', to_jsonb(f.ganador::text)) else a.e end
    order by a.o), '[]'::jsonb)
  from jsonb_array_elements(items) with ordinality a(e, o)
  left join fusion_ids f on f.perdedor::text = a.e->>'producto_id'
$$;
create temp table perdedores_txt as select perdedor::text p from fusion_ids;
update ventas         set items = pg_temp.remap_items(items) where exists (select 1 from jsonb_array_elements(items) e join perdedores_txt on p = e->>'producto_id');
update compras        set items = pg_temp.remap_items(items) where exists (select 1 from jsonb_array_elements(items) e join perdedores_txt on p = e->>'producto_id');
update pedidos        set items = pg_temp.remap_items(items) where exists (select 1 from jsonb_array_elements(items) e join perdedores_txt on p = e->>'producto_id');
update consignaciones set items = pg_temp.remap_items(items) where exists (select 1 from jsonb_array_elements(items) e join perdedores_txt on p = e->>'producto_id');

-- el que queda toma datos que solo tenía el duplicado
update productos set nombre='Finca Flichman Caballero de la Cepa Malbec', stock=12
  where left(id::text,8) in ('56c60754','1176d357');
update productos set nombre='Humberto Canale Estate Malbec'
  where left(id::text,8) in ('78aa5b1d','98456175');
update productos set stock=1                       where left(id::text,8) in ('a7f86795','317082e2'); -- Nomad: 1 en las filas editadas más recientes
update productos set stock=18, precio_costo=7875   where left(id::text,8) in ('93b0d36d','f5830b6a'); -- Zolo 15 + Solou 3
update productos set woo_product_id=12318          where left(id::text,8)='f7540fab';

-- el duplicado queda desactivado y sin vínculo web
update productos p set activo=false, woo_product_id=null, stock=0,
  nombre = p.nombre || ' [fusionado]'
from fusion_ids f where p.id=f.perdedor;

-- 3. Gemelos ------------------------------------------------------------------
alter table productos add column gemelo_id uuid references productos(id) on delete set null;
create unique index productos_gemelo_id_key on productos(gemelo_id) where gemelo_id is not null;

create temp table pares as
with r as (
  select id, empresa, nombre,
    row_number() over (partition by empresa, nombre order by activo desc, updated_at desc, id) rn
  from productos)
select a.id aroma_id, l.id lavid_id
from r a join r l on a.empresa='aroma' and l.empresa='lavid' and a.nombre=l.nombre and a.rn=l.rn;

update productos p set gemelo_id=x.lavid_id from pares x where p.id=x.aroma_id;
update productos p set gemelo_id=x.aroma_id from pares x where p.id=x.lavid_id;

-- registro de lo que se igualó
create table productos_gemelos_reconciliacion as
select a.id aroma_id, l.id lavid_id, a.nombre,
  a.stock aroma_stock, l.stock lavid_stock,
  a.precio_venta aroma_precio, l.precio_venta lavid_precio,
  a.precio_costo aroma_costo, l.precio_costo lavid_costo,
  a.activo aroma_activo, l.activo lavid_activo,
  a.woo_product_id aroma_woo, l.woo_product_id lavid_woo,
  case when l.updated_at > a.updated_at then 'lavid' else 'aroma' end gana,
  now() fecha
from pares x join productos a on a.id=x.aroma_id join productos l on l.id=x.lavid_id
where (a.stock, a.precio_venta, a.precio_costo, a.precio_mayorista, a.activo, a.woo_product_id, a.sku,
       a.codigo_barras, a.categoria, a.varietal, a.bodega, a.region, a.anada, a.stock_minimo, a.unidad_medida,
       a.proveedor_nombre, a.precios_escala::text, a.bodega_id)
  is distinct from
      (l.stock, l.precio_venta, l.precio_costo, l.precio_mayorista, l.activo, l.woo_product_id, l.sku,
       l.codigo_barras, l.categoria, l.varietal, l.bodega, l.region, l.anada, l.stock_minimo, l.unidad_medida,
       l.proveedor_nombre, l.precios_escala::text, l.bodega_id);

-- igualar: valores de la fila más reciente, stock = el mayor, woo = el de aroma
create temp table valores as
select x.aroma_id, x.lavid_id,
  n.sku, n.codigo_barras, n.bodega, n.bodega_id, n.varietal, n.categoria, n.anada, n.region,
  n.precio_venta, n.precio_costo, n.precio_mayorista, n.precios_escala, n.stock_minimo,
  n.unidad_medida, n.proveedor_nombre, n.activo,
  greatest(coalesce(a.stock,0), coalesce(l.stock,0)) stock_final,
  coalesce(a.woo_product_id, l.woo_product_id) woo_final
from pares x
join productos a on a.id=x.aroma_id
join productos l on l.id=x.lavid_id
join productos n on n.id = case when l.updated_at > a.updated_at then l.id else a.id end;

update productos p set
  sku=v.sku, codigo_barras=v.codigo_barras, bodega=v.bodega, bodega_id=v.bodega_id, varietal=v.varietal,
  categoria=v.categoria, anada=v.anada, region=v.region, precio_venta=v.precio_venta, precio_costo=v.precio_costo,
  precio_mayorista=v.precio_mayorista, precios_escala=v.precios_escala, stock_minimo=v.stock_minimo,
  unidad_medida=v.unidad_medida, proveedor_nombre=v.proveedor_nombre, activo=v.activo,
  stock=v.stock_final, woo_product_id=v.woo_final
from valores v
where p.id in (v.aroma_id, v.lavid_id);

-- productos activos sin gemelo: se les crea
do $$
declare r record; g uuid;
begin
  for r in select * from productos where activo and gemelo_id is null loop
    insert into productos (empresa, nombre, sku, codigo_barras, bodega, bodega_id, varietal, categoria, anada, region,
      precio_venta, precio_costo, precio_mayorista, precios_escala, stock, stock_minimo, unidad_medida,
      proveedor_nombre, activo, woo_product_id, gemelo_id)
    values (case r.empresa when 'aroma' then 'lavid' else 'aroma' end, r.nombre, r.sku, r.codigo_barras, r.bodega,
      r.bodega_id, r.varietal, r.categoria, r.anada, r.region, r.precio_venta, r.precio_costo, r.precio_mayorista,
      r.precios_escala, r.stock, r.stock_minimo, r.unidad_medida, r.proveedor_nombre, r.activo, r.woo_product_id, r.id)
    returning id into g;
    update productos set gemelo_id=g where id=r.id;
  end loop;
end $$;

-- 4. Triggers -----------------------------------------------------------------
create or replace function productos_espejar_gemelo() returns trigger
language plpgsql as $$
begin
  -- depth > 1: la escritura viene de otro trigger (el propio espejo) -> no rebotar
  if pg_trigger_depth() > 1 or new.gemelo_id is null then return null; end if;
  update productos t set
    nombre=new.nombre, sku=new.sku, codigo_barras=new.codigo_barras, bodega=new.bodega, bodega_id=new.bodega_id,
    varietal=new.varietal, categoria=new.categoria, anada=new.anada, region=new.region,
    precio_venta=new.precio_venta, precio_costo=new.precio_costo, precio_mayorista=new.precio_mayorista,
    precios_escala=new.precios_escala, stock=new.stock, stock_minimo=new.stock_minimo,
    unidad_medida=new.unidad_medida, proveedor_nombre=new.proveedor_nombre, activo=new.activo,
    woo_product_id=new.woo_product_id
  where t.id=new.gemelo_id
    and (t.nombre, t.sku, t.codigo_barras, t.bodega, t.bodega_id, t.varietal, t.categoria, t.anada, t.region,
         t.precio_venta, t.precio_costo, t.precio_mayorista, t.precios_escala::text, t.stock, t.stock_minimo,
         t.unidad_medida, t.proveedor_nombre, t.activo, t.woo_product_id)
    is distinct from
        (new.nombre, new.sku, new.codigo_barras, new.bodega, new.bodega_id, new.varietal, new.categoria, new.anada, new.region,
         new.precio_venta, new.precio_costo, new.precio_mayorista, new.precios_escala::text, new.stock, new.stock_minimo,
         new.unidad_medida, new.proveedor_nombre, new.activo, new.woo_product_id);
  return null;
end $$;

create or replace function productos_crear_gemelo() returns trigger
language plpgsql as $$
declare g uuid; otra text;
begin
  if pg_trigger_depth() > 1 then return null; end if;
  -- se relee la fila: en un insert de varias filas (aroma + lavid juntas),
  -- la primera ya pudo haber vinculado a esta
  if (select gemelo_id from productos where id=new.id) is not null then return null; end if;
  otra := case new.empresa when 'aroma' then 'lavid' else 'aroma' end;
  select id into g from productos
    where empresa=otra and nombre=new.nombre and gemelo_id is null
    order by activo desc, updated_at desc limit 1;
  if g is null then
    insert into productos (empresa, nombre, sku, codigo_barras, bodega, bodega_id, varietal, categoria, anada, region,
      precio_venta, precio_costo, precio_mayorista, precios_escala, stock, stock_minimo, unidad_medida,
      proveedor_nombre, activo, woo_product_id, gemelo_id)
    values (otra, new.nombre, new.sku, new.codigo_barras, new.bodega, new.bodega_id, new.varietal, new.categoria,
      new.anada, new.region, new.precio_venta, new.precio_costo, new.precio_mayorista, new.precios_escala, new.stock,
      new.stock_minimo, new.unidad_medida, new.proveedor_nombre, new.activo, new.woo_product_id, new.id)
    returning id into g;
  else
    update productos set gemelo_id=new.id where id=g;
  end if;
  update productos set gemelo_id=g where id=new.id;
  return null;
end $$;

create trigger productos_espejar_gemelo after update on productos
  for each row execute function productos_espejar_gemelo();
create trigger productos_crear_gemelo after insert on productos
  for each row execute function productos_crear_gemelo();
