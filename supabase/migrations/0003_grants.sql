-- Con "Automatically expose new tables" desactivado, la Data API necesita permisos explícitos.
-- RLS (0001) sigue decidiendo qué filas ve cada usuario.
grant usage on schema public to anon, authenticated;

grant select on foods, recipes, recipe_items to anon, authenticated;
grant insert on foods to authenticated;

grant select, insert, update, delete on
  profiles, meal_logs, meal_log_items, workout_sets, water_logs, weight_logs
  to authenticated;
-- scan_usage: sin permisos; solo la Edge Function (service role).
