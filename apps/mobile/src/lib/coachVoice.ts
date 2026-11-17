import * as Speech from 'expo-speech';

/**
 * Voz del coach: elige la mejor voz en español del dispositivo (latinoamericana y "mejorada"
 * primero) y arma frases de instructor variadas, para que no suene a lectura de pantalla.
 */

let voice: { id?: string; lang: string } | null = null;
let picking: Promise<void> | null = null;

const LATAM = /^es[-_](us|mx|419|pe|co|ar|cl)/i;

/** Ordena: español latino > otros español; calidad mejorada > normal; local > red (funciona sin internet). */
function score(v: Speech.Voice) {
  const id = `${v.identifier} ${v.name}`.toLowerCase();
  return (LATAM.test(v.language) ? 100 : 0) + (v.quality === Speech.VoiceQuality.Enhanced ? 20 : 0) + (id.includes('local') ? 5 : 0) - (id.includes('network') ? 3 : 0);
}

/** Precarga la voz (llamar al abrir el entreno; la primera frase espera a que termine). */
export function prepareVoice() {
  picking ??= Speech.getAvailableVoicesAsync()
    .then((all) => {
      const es = all.filter((v) => /^es/i.test(v.language)).sort((a, b) => score(b) - score(a));
      voice = es[0] ? { id: es[0].identifier, lang: es[0].language } : { lang: 'es-US' };
    })
    .catch(() => {
      voice = { lang: 'es-US' };
    });
  return picking;
}

/** Habla cortando lo anterior. Los paréntesis del catálogo ("si tienes barra") no se leen. */
export async function speak(text: string) {
  await prepareVoice();
  Speech.stop();
  Speech.speak(text.replace(/\s*\([^)]*\)/g, ''), { language: voice?.lang ?? 'es-US', voice: voice?.id, rate: 1.04, pitch: 0.98 });
}

export const stopVoice = () => Speech.stop();

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
/** El nombre de vez en cuando: siempre resulta forzado. */
const withName = (name: string | undefined, p = 0.35) => (name && Math.random() < p ? `, ${name}` : '');

/** Consejo técnico corto por grupo muscular, para la mitad de la serie. */
const TECHNIQUE: Record<string, string[]> = {
  pierna: ['Empuja con los talones.', 'Rodillas hacia afuera, pecho arriba.', 'Baja controlado, sube con fuerza.'],
  pecho: ['Baja lento, controla el movimiento.', 'Codos a cuarenta y cinco grados.', 'Aprieta el pecho al subir.'],
  espalda: ['Lleva los codos atrás.', 'Junta las escápulas, aprieta la espalda.', 'Sin impulso, tira con la espalda.'],
  hombro: ['Abdomen firme, no arquees la espalda.', 'Sube controlado, sin encoger los hombros.'],
  biceps: ['Codos pegados al cuerpo.', 'Baja completo, sin balancearte.'],
  triceps: ['Codos quietos, extiende completo.', 'Controla la bajada.'],
  core: ['Abdomen apretado, respira.', 'Mantén la espalda neutra.', 'No contengas la respiración.'],
};
const KEEP_GOING = ['¡Eso es, buen ritmo!', '¡Bien hecho, sigue así!', '¡Vas muy bien!'];

export const cue = {
  start: (exercise: string, target: string, name?: string) =>
    pick([
      `¡Arrancamos${withName(name, 0.8)}! Primer ejercicio: ${exercise}. ${target}. Ponte en posición.`,
      `¡Hora de entrenar${withName(name, 0.8)}! Empezamos con ${exercise}. ${target}. Colócate.`,
    ]),
  work: (set: number, sets: number, target: string, name?: string) =>
    set === sets && sets > 1
      ? pick([`¡Última serie${withName(name, 0.6)}! ${target}. ¡Dalo todo!`, `¡Última! ${target}. ¡Termina fuerte!`])
      : set === 1
        ? pick([`¡Vamos! Serie uno de ${sets}. ${target}.`, `Serie uno. ${target}. ¡Con todo${withName(name)}!`])
        : pick([`¡Vamos! Serie ${set} de ${sets}. ${target}.`, `Serie ${set}. ${target}. ¡Tú puedes${withName(name)}!`, `¡Otra más! Serie ${set}, ${target}.`]),
  midSet: (muscle: string) => (Math.random() < 0.7 ? pick(TECHNIQUE[muscle] ?? KEEP_GOING) : pick(KEEP_GOING)),
  rest: (secs: number, nextExercise: string | null, name?: string) =>
    nextExercise
      ? pick([`¡Ejercicio terminado${withName(name)}! Descansa ${secs} segundos. Lo que sigue: ${nextExercise}.`, `¡Excelente! Recupera ${secs} segundos. Ahora viene ${nextExercise}.`])
      : pick([`¡Buena serie! Descansa ${secs} segundos.`, `¡Muy bien${withName(name)}! Recupera, ${secs} segundos.`, `¡Eso es! Respira, ${secs} segundos de descanso.`]),
  restEnding: (set: number, nextExercise: string | null) => (nextExercise ? `Diez segundos. Prepárate para ${nextExercise}.` : `Diez segundos. Prepárate para la serie ${set}.`),
  timeUp: () => pick(['¡Tiempo!', '¡Listo, tiempo!']),
  resume: () => pick(['¡Seguimos!', '¡Vamos de nuevo!']),
  done: (name?: string) => pick([`¡Entreno completado${withName(name, 0.8)}! Gran trabajo hoy.`, `¡Lo lograste${withName(name, 0.8)}! Entreno terminado, excelente trabajo.`]),
};
