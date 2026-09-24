-- Pedidos de la tienda web (WooCommerce) -> Pedidos de Gestión
--
-- Los pedidos online entran a la sección Pedidos (origen 'web') para que
-- alguien los levante y los arme; al armarlos se crea el remito de Aroma
-- (sin AFIP). Ver src/lib/woo-pedidos.ts.
--
-- Stock: WooCommerce YA descontó la web al recibir el pedido. En Gestión se
-- descuenta al importarlo (reserva), pero ese movimiento NO debe volver a
-- mandarse a la web por la cola de diferencias (sería doble descuento). Para
-- eso mover_stock_sin_eco() marca la transacción y el trigger que anota la
-- cola la saltea. Lo mismo al devolver stock de un pedido cancelado en la web.
--
-- Correr UNA vez en Supabase > SQL Editor.

-- 1. Columnas de pedidos para los que vienen de la web ------------------------
alter table pedidos add column if not exists origen       text not null default 'local'; -- local | web
alter table pedidos add column if not exists woo_order_id integer;
alter table pedidos add column if not exists woo_estado   text;    -- estado del pedido en WooCommerce
alter table pedidos add column if not exists pago         text;    -- pagado | pendiente (web)
alter table pedidos add column if not exists levantado_at timestamptz;
alter table pedidos add column if not exists stock_reservado boolean not null default false;
create unique index if not exists pedidos_woo_order_id_key on pedidos (woo_order_id) where woo_order_id is not null;

-- 2. Estado de la importación (desde cuándo y último chequeo) -----------------
create table if not exists app_config (
  clave      text primary key,
  valor      text,
  updated_at timestamptz not null default now()
);
-- Se importan solo pedidos creados desde que se corre este SQL ("desde hoy"):
-- los viejos ya bajaron el stock de la web hace tiempo.
insert into app_config (clave, valor) values
  ('woo_pedidos_desde', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS')),
  ('woo_pedidos_ultimo_chequeo', null)
on conflict (clave) do nothing;

-- 3. El trigger de la cola de stock web respeta la marca "sin eco" -----------
create or replace function productos_encolar_stock_woo() returns trigger
language plpgsql as $$
begin
  if coalesce(current_setting('app.sin_eco_web', true), '') = '1' then return null; end if;
  if new.empresa = 'aroma' and new.woo_product_id is not null
     and coalesce(new.stock, 0) <> coalesce(old.stock, 0) then
    insert into woo_stock_cola (producto_id, woo_product_id, delta, stock_sistema)
    values (new.id, new.woo_product_id, coalesce(new.stock, 0) - coalesce(old.stock, 0), new.stock);
  end if;
  return null;
end $$;

-- 4. Mover stock sin mandarlo a la web ----------------------------------------
-- p_items: [{"producto_id": uuid, "cantidad": n}], p_signo: -1 descuenta, +1 devuelve.
-- El gemelo de la otra empresa se actualiza solo (trigger de gemelos).
create or replace function mover_stock_sin_eco(p_items jsonb, p_signo integer, p_motivo text)
returns void language plpgsql as $$
declare it jsonb; p record; nuevo integer;
begin
  perform set_config('app.sin_eco_web', '1', true); -- solo esta transacción
  for it in select * from jsonb_array_elements(p_items) loop
    if it->>'producto_id' is null then continue; end if;
    select id, empresa, nombre, stock into p from productos where id = (it->>'producto_id')::uuid;
    if not found then continue; end if;
    nuevo := greatest(0, coalesce(p.stock, 0) + p_signo * (it->>'cantidad')::integer);
    update productos set stock = nuevo where id = p.id;
    insert into movimientos_stock (empresa, producto_id, nombre, delta, nuevo_stock, modo)
    values (p.empresa, p.id, p.nombre || ' — ' || p_motivo, nuevo - coalesce(p.stock, 0), nuevo, 'agregar');
  end loop;
  perform set_config('app.sin_eco_web', '', true);
end $$;
