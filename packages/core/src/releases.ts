/** Fila de `app_releases` (Supabase): una versión publicada del APK. */
export interface AppRelease {
  version: string;
  build_number: number;
  mandatory: boolean;
  changelog: string | null;
  apk_url: string;
  min_supported_version: string | null;
}

export interface AppUpdate {
  version: string;
  changelog: string | null;
  apkUrl: string;
  mandatory: boolean;
}

const parse = (v: string) => {
  const p = v.trim().replace(/^v/, '').split(/[-+]/)[0].split('.').map((x) => parseInt(x, 10));
  return [p[0] || 0, p[1] || 0, p[2] || 0];
};

/** -1 si a < b, 0 si son iguales, 1 si a > b (semver MAJOR.MINOR.PATCH, sin sufijos). */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  }
  return 0;
}

/**
 * Actualización aplicable a la app instalada, o `null`. Es más nueva si sube el versionCode o la versión
 * (defensa por si se olvidó subir uno de los dos). Obligatoria si la release lo marca o si la versión
 * instalada quedó por debajo del mínimo soportado.
 */
export function updateFor(release: AppRelease | null, currentVersion: string, currentBuild: number): AppUpdate | null {
  if (!release?.apk_url?.trim()) return null;
  if (release.build_number <= currentBuild && compareVersions(release.version, currentVersion) <= 0) return null;
  const below = !!release.min_supported_version && compareVersions(currentVersion, release.min_supported_version) < 0;
  return { version: release.version, changelog: release.changelog, apkUrl: release.apk_url.trim(), mandatory: release.mandatory || below };
}
