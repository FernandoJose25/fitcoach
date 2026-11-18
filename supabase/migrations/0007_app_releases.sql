-- Auto-actualización del APK (mismo patrón que eventkardex-pro): la app consulta al abrir, al volver a
-- primer plano y por Realtime la release activa más reciente; si es más nueva que la instalada, muestra
-- el modal "Nueva versión disponible" y descarga e instala el APK.
create table if not exists app_releases (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'android' check (platform in ('android')),
  version text not null,                 -- semver, p. ej. '0.10.0'
  build_number int not null,             -- versionCode de Android
  mandatory boolean not null default false,
  changelog text,
  apk_url text not null,                 -- descarga pública sin autenticación
  min_supported_version text,            -- por debajo de esta versión la actualización es obligatoria
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists app_releases_lookup on app_releases (platform, is_active, build_number desc);

-- Lectura pública (también sin sesión); la escritura queda para la service_role (sin política de insert).
alter table app_releases enable row level security;
drop policy if exists read_all on app_releases;
create policy read_all on app_releases for select using (true);
grant select on app_releases to anon, authenticated;

-- Realtime: aviso al instante cuando se publica una release.
do $$ begin
  alter publication supabase_realtime add table app_releases;
exception when duplicate_object then null;
end $$;
