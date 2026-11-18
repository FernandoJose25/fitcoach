import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { Directory, File, Paths } from 'expo-file-system';
import { updateFor, type AppRelease, type AppUpdate } from '@fitcoach/core';
import { supabase } from './supabase';

/**
 * Auto-actualización del APK (mismo patrón que eventkardex-pro): la release activa más reciente de
 * `app_releases` (Supabase) contra la versión instalada. Se revisa apenas abre la app, al volver a primer
 * plano y al instante por Realtime cuando se publica una release. Si hay una más nueva, `UpdateModal`
 * muestra "Nueva versión disponible", descarga el APK con progreso y abre el instalador de Android.
 * En Expo Go no aplica (la versión instalada es la de Expo Go y no se puede instalar un APK encima).
 */
interface UpdaterState {
  update: AppUpdate | null;
  /** Versión que el usuario pospuso con "Ahora no" (vuelve a aparecer en la próxima revisión). */
  dismissed: string | null;
  downloading: boolean;
  progress: number;
  error: string | null;
}

export const useUpdater = create<UpdaterState>()(() => ({ update: null, dismissed: null, downloading: false, progress: 0, error: null }));

const enabled = Platform.OS === 'android' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && !!supabase;
const installedVersion = () => Application.nativeApplicationVersion ?? '0.0.0';
const installedBuild = () => parseInt(Application.nativeBuildVersion ?? '0', 10) || 0;

/** Consulta la última release activa; ante un error de red no hace nada (se reintenta en la próxima revisión). */
export async function checkForUpdate() {
  if (!enabled || useUpdater.getState().downloading) return;
  try {
    const { data, error } = await supabase!
      .from('app_releases')
      .select('version, build_number, mandatory, changelog, apk_url, min_supported_version')
      .eq('platform', 'android')
      .eq('is_active', true)
      .order('build_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const update = updateFor(data as AppRelease | null, installedVersion(), installedBuild());
    // Cada revisión vuelve a mostrar el aviso aunque se haya pospuesto antes.
    useUpdater.setState({ update, dismissed: null });
  } catch (e) {
    console.warn('[updater] no se pudo revisar si hay una versión nueva', e);
  }
}

/** Disparadores: al abrir (sin esperar), al volver a primer plano y por Realtime. Montar una vez en la raíz. */
export function useUpdateChecks() {
  useEffect(() => {
    if (!enabled) return;
    checkForUpdate();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && checkForUpdate());
    const channel = supabase!
      .channel('app_releases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_releases' }, () => checkForUpdate())
      .subscribe();
    return () => {
      sub.remove();
      supabase!.removeChannel(channel);
    };
  }, []);
}

export function dismissUpdate() {
  const { update } = useUpdater.getState();
  if (update && !update.mandatory) useUpdater.setState({ dismissed: update.version });
}

/** Descarga el APK a la caché (con progreso) y abre el instalador de Android. */
export async function installUpdate() {
  const { update } = useUpdater.getState();
  if (!update || useUpdater.getState().downloading) return;
  useUpdater.setState({ downloading: true, progress: 0, error: null });
  try {
    const dir = new Directory(Paths.cache, 'updates');
    if (!dir.exists) dir.create({ intermediates: true });
    const dest = new File(dir, 'fitcoach-update.apk');
    if (dest.exists) dest.delete();
    const task = File.createDownloadTask(update.apkUrl, dest, {
      onProgress: ({ bytesWritten, totalBytes }) => {
        if (totalBytes > 0) useUpdater.setState({ progress: Math.round((bytesWritten / totalBytes) * 100) });
      },
    });
    const file = await task.downloadAsync();
    if (!file) throw new Error('La descarga se canceló.');
    useUpdater.setState({ progress: 100 });
    // Android 7+ exige un content:// (FileProvider) para que el instalador lea el archivo.
    const { getContentUriAsync } = await import('expo-file-system/legacy');
    const uri = await getContentUriAsync(file.uri);
    await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
      data: uri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    });
  } catch (e) {
    useUpdater.setState({ error: e instanceof Error ? e.message : String(e) });
  } finally {
    useUpdater.setState({ downloading: false });
  }
}

/** Android 8+: permiso "Instalar apps desconocidas" para FitCoach (si el instalador lo bloqueó). */
export function openInstallPermission() {
  const pkg = Application.applicationId;
  IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES, pkg ? { data: `package:${pkg}` } : {}).catch(() => {});
}
