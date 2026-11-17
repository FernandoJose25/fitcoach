-- Contenido: rol 'M' para platos preparados (solo registro y escáner, no entran en recetas).
-- `tag` admite varias etiquetas separadas por coma (p. ej. 'res,cebolla').
alter table foods drop constraint if exists foods_role_check;
alter table foods add constraint foods_role_check check (role in ('P','C','V','F','M'));
