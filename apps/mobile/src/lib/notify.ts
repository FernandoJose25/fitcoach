import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { TRAIN_DAYS } from '@fitcoach/core';
import type { Reminders } from '@/store/useApp';

/**
 * Avisos locales. Dos grupos con prefijo propio para que uno no cancele al otro:
 * - `wk-`: entreno guiado. Con la app abierta mandan la voz y la vibración; al salir se programan las
 *   transiciones que faltan (serie, descanso, fin) y al volver se cancelan.
 * - `rem-`: recordatorios diarios/semanales (comidas, agua, entreno, pesaje). Activados por defecto; se
 *   apagan uno a uno en Perfil. Son notificaciones del sistema programadas en el teléfono: llegan con la
 *   app cerrada y sin internet, sin servidor de push.
 */
const CHANNEL = 'workout';
// Android no deja subir la importancia de un canal existente: el canal nuevo (alta = aviso emergente
// con sonido, como cualquier notificación push) reemplaza al antiguo 'reminders', que se borra.
const REM_CHANNEL = 'recordatorios';
const OLD_REM_CHANNEL = 'reminders';
let channel: Promise<boolean> | null = null;
let remChannel: Promise<boolean> | null = null;
let gen = 0;

// En primer plano: los avisos del entreno guiado no se muestran (el entreno ya está en pantalla);
// los recordatorios sí, como aviso emergente, igual que con la app cerrada.
Notifications.setNotificationHandler({
  handleNotification: async (n) => {
    const rem = n.request.identifier.startsWith('rem-');
    return { shouldShowBanner: rem, shouldShowList: rem, shouldPlaySound: rem, shouldSetBadge: false };
  },
});

/** Canal con importancia alta; si el sistema lo rechaza (Expo Go) se usa el canal por defecto. */
function ensureChannel() {
  if (Platform.OS !== 'android') return Promise.resolve(false);
  channel ??= Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Entreno guiado', importance: Notifications.AndroidImportance.HIGH })
    .then(() => true)
    .catch(() => false);
  return channel;
}

function ensureRemChannel() {
  if (Platform.OS !== 'android') return Promise.resolve(false);
  remChannel ??= Notifications.setNotificationChannelAsync(REM_CHANNEL, {
    name: 'Recordatorios',
    description: 'Comidas, agua, entreno y pesaje',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
  })
    .then(() => {
      Notifications.deleteNotificationChannelAsync(OLD_REM_CHANNEL).catch(() => {});
      return true;
    })
    .catch(() => false);
  return remChannel;
}

/** Pide permiso si aún se puede. No se cachea un "no": puede concederse luego en Ajustes. */
export async function allowNotifications() {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    return cur.canAskAgain ? (await Notifications.requestPermissionsAsync()).granted : false;
  } catch {
    return false;
  }
}

const EXACT_ASKED = 'fitcoach.exactAlarmAsked';

/**
 * Android 12+: sin el permiso "Alarmas y recordatorios" el aviso de fin del descanso con la pantalla
 * bloqueada puede llegar hasta ~1 min tarde. Antes del primer entreno guiado se explica una sola vez y
 * se ofrece abrir el ajuste; se resuelve al volver (o al elegir "Ahora no"). En Expo Go no se puede
 * conceder, así que se omite. Nunca bloquea el entreno: cualquier fallo se ignora.
 */
export async function askExactAlarmsOnce(): Promise<void> {
  if (Platform.OS !== 'android' || (typeof Platform.Version === 'number' && Platform.Version < 31)) return;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  try {
    if (await AsyncStorage.getItem(EXACT_ASKED)) return;
    const cur = await Notifications.getExactAlarmPermissionsAsync();
    if (cur.granted || !cur.canAskAgain) return;
    await AsyncStorage.setItem(EXACT_ASKED, '1');
  } catch {
    return;
  }
  await new Promise<void>((resolve) =>
    Alert.alert(
      'Avisos a tiempo en el descanso',
      'Si bloqueas el teléfono durante el entreno, Android puede retrasar el aviso de fin del descanso hasta un minuto. Permite "Alarmas y recordatorios" para FitCoach y sonará justo a tiempo.',
      [
        { text: 'Ahora no', style: 'cancel', onPress: () => resolve() },
        { text: 'Permitir', onPress: () => void Notifications.requestExactAlarmPermissionsAsync().catch(() => null).finally(() => resolve()) },
      ],
      { cancelable: true, onDismiss: () => resolve() },
    ),
  );
}

async function cancelPrefix(prefix: string) {
  const all = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(all.filter((n) => n.identifier.startsWith(prefix)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})));
}

export async function scheduleAll(items: { at: number; title: string; body: string }[]) {
  const my = ++gen;
  if (!(await allowNotifications())) return;
  const own = await ensureChannel();
  for (const [i, it] of items.entries()) {
    const seconds = Math.round((it.at - Date.now()) / 1000);
    if (seconds < 1) continue;
    const id = await Notifications.scheduleNotificationAsync({
      identifier: `wk-${my}-${i}`,
      content: { title: it.title, body: it.body, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, ...(own ? { channelId: CHANNEL } : {}) },
    }).catch(() => null);
    // Si la app volvió a primer plano mientras se programaba, se descarta lo pendiente.
    if (my !== gen) {
      if (id) Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      return;
    }
  }
}

/** Cancela solo los avisos del entreno guiado (los recordatorios se mantienen). */
export function cancelAll() {
  gen++;
  cancelPrefix('wk-');
}

const MEAL_TIMES: Record<number, [number, number, string][]> = {
  3: [[8, 0, 'el desayuno'], [13, 0, 'el almuerzo'], [20, 0, 'la cena']],
  4: [[8, 0, 'el desayuno'], [13, 0, 'el almuerzo'], [16, 30, 'el snack'], [20, 0, 'la cena']],
  5: [[8, 0, 'el desayuno'], [10, 30, 'la media mañana'], [13, 0, 'el almuerzo'], [16, 30, 'el snack'], [20, 0, 'la cena']],
};

/**
 * Reprograma los recordatorios según las preferencias. Devuelve false si no hay permiso.
 * Horarios fijos y sensatos (comidas típicas en Perú; agua cada 2 h; entreno a las 18:00; pesaje el lunes).
 */
export async function syncReminders(r: Reminders, daysPerWeek: number, mealsPerDay: number) {
  await cancelPrefix('rem-');
  if (!r.meals && !r.water && !r.workout && !r.weigh) return true;
  if (!(await allowNotifications())) return false;
  const own = await ensureRemChannel();
  const ch = own ? { channelId: REM_CHANNEL } : {};
  const jobs: { id: string; title: string; body: string; trigger: Notifications.NotificationTriggerInput }[] = [];
  const daily = (hour: number, minute: number) => ({ type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, ...ch }) as const;
  // Lunes = 0 en la app; en expo-notifications 1 = domingo … 7 = sábado.
  const weekly = (day: number, hour: number, minute: number) => ({ type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: ((day + 1) % 7) + 1, hour, minute, ...ch }) as const;
  if (r.meals)
    for (const [h, m, what] of MEAL_TIMES[mealsPerDay] ?? MEAL_TIMES[4])
      jobs.push({ id: `rem-meal-${h}${m}`, title: `Hora de ${what}`, body: 'Mira qué te toca en el Menú y regístralo.', trigger: daily(h, m) });
  if (r.water)
    for (const h of [10, 12, 14, 16, 18]) jobs.push({ id: `rem-water-${h}`, title: 'Un vaso de agua', body: 'Meta del día: 8 vasos (2 L).', trigger: daily(h, 0) });
  if (r.workout)
    for (const d of TRAIN_DAYS[daysPerWeek as keyof typeof TRAIN_DAYS] ?? [])
      jobs.push({ id: `rem-train-${d}`, title: 'Hoy toca entrenar', body: 'Tu sesión guiada te espera en Entreno.', trigger: weekly(d, 18, 0) });
  if (r.weigh) jobs.push({ id: 'rem-weigh', title: 'Pesaje semanal', body: 'En ayunas y después del baño. Regístralo en Hoy.', trigger: weekly(0, 7, 30) });
  for (const j of jobs)
    await Notifications.scheduleNotificationAsync({ identifier: j.id, content: { title: j.title, body: j.body, sound: 'default' }, trigger: j.trigger }).catch(() => null);
  return true;
}

/** ¿Están permitidas las notificaciones? (Para avisar en Perfil si el usuario las bloqueó.) */
export async function notificationsAllowed() {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}
