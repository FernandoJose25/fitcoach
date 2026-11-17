-- F3: la app guarda como caché los productos leídos por código de barras (Open Food Facts).
create policy insert_off on foods for insert to authenticated with check (source = 'off');
