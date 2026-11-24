-- Escáner: la función `scan-food` no podía leer ni escribir `scan_usage` (la Data API exige permisos explícitos
-- también para service_role), así que el límite de 30 fotos por día nunca se aplicaba.
grant select, insert, update on scan_usage to service_role;

-- Porción del producto en la base compartida (una botella de 500 ml, 1 taza de 30 g).
alter table foods add column if not exists serving_g numeric;
alter table foods add column if not exists serving_label text;
