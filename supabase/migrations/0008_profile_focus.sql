-- Zona prioritaria del entreno (pecho, espalda, hombro, brazos, core, pierna; máx. 2).
-- null = el usuario aún no la eligió (perfiles anteriores); '{}' = plan equilibrado.
alter table profiles add column if not exists focus text[];
