-- Alimentos propios: productos con código de barras que no están en Open Food Facts (id `bc_<código>`),
-- platos escritos a mano (`usr_…`) y estimaciones de la IA (`ai_…`). Se suben al registrarlos para que
-- meal_log_items pueda referenciarlos; los `bc_` sirven además a cualquier usuario que escanee ese código.
-- El código va en el id (no en `barcode`) para no chocar con la caché `off_` del mismo producto.
alter table foods drop constraint if exists foods_source_check;
drop policy if exists insert_off on foods;
create policy insert_custom on foods for insert to authenticated with check (source in ('off', 'user', 'ai'));
