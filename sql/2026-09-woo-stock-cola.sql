-- Sync de stock a la web INDIVIDUAL por producto (cola de diferencias)
--
-- Cada cambio de stock de un producto vinculado a WooCommerce anota en
-- woo_stock_cola la DIFERENCIA (+6, -2...), no el valor final. La app
-- (src/lib/woo-stock-cola.ts) procesa la cola después de cada guardado:
-- lee el stock actual en la web solo de esos productos y le aplica la
-- diferencia. Se manda la diferencia y no el valor absoluto porque las
-- ventas online NO se cargan en Gestión Vinoteca: pisar la web con el stock
-- del sistema borraría esas ventas y podría sobrevender.
--
-- Solo se anota la fila de aroma (la que usa el sync con la web). Si se
-- edita la fila de lavid, el trigger de gemelos copia el stock a aroma y
-- este trigger lo anota igual, una sola vez.
--
-- Correr UNA vez en Supabase > SQL Editor.

create table if not exists woo_stock_cola (
  id              bigint generated always as identity primary key,
  producto_id     uuid not null references productos(id) on delete cascade,
  woo_product_id  integer not null,
  delta           integer not null,
  stock_sistema   integer,
  estado          text not null default 'pendiente', -- pendiente | procesando | ok | error | conflicto
  error           text,
  stock_web_antes integer,
  stock_web_despues integer,
  created_at      timestamptz not null default now(),
  procesado_at    timestamptz
);
create index if not exists woo_stock_cola_estado on woo_stock_cola (estado, created_at);

create or replace function productos_encolar_stock_woo() returns trigger
language plpgsql as $$
begin
  if new.empresa = 'aroma' and new.woo_product_id is not null
     and coalesce(new.stock, 0) <> coalesce(old.stock, 0) then
    insert into woo_stock_cola (producto_id, woo_product_id, delta, stock_sistema)
    values (new.id, new.woo_product_id, coalesce(new.stock, 0) - coalesce(old.stock, 0), new.stock);
  end if;
  return null;
end $$;

drop trigger if exists productos_encolar_stock_woo on productos;
create trigger productos_encolar_stock_woo after update of stock on productos
  for each row execute function productos_encolar_stock_woo();
