import { useEffect } from 'react';
import { AppState } from 'react-native';
import type { Profile, SetLog } from '@fitcoach/core';
import { supabase } from './supabase';
import { allFoods } from './usePlan';
import { useApp, type LogItem, type Via } from '@/store/useApp';

/**
 * Offline primero: el store local manda. Cada cambio marca su día en `dirtyDays`; aquí se sube el día
 * completo (borrar + insertar, idempotente). Si falla la red el día queda marcado y se reintenta
 * en el siguiente cambio o al volver a la app.
 */
const ok = <T extends { error: unknown }>(r: T) => {
  if (r.error) throw r.error;
  return r;
};

/** Sesión de Supabase (anónima si no hay); devuelve el id del usuario. */
export async function userId() {
  const { data } = await supabase!.auth.getSession();
  if (data.session) return data.session.user.id;
  return ok(await supabase!.auth.signInAnonymously()).data.user!.id;
}

async function pushProfile(uid: string) {
  const { profile: p, targets: t } = useApp.getState();
  if (!p || !t) return;
  useApp.setState({ profileDirty: false });
  try {
    ok(
      await supabase!.from('profiles').upsert({
        user_id: uid,
        name: p.name,
        sex: p.sex,
        age: p.age,
        weight_kg: p.weightKg,
        height_cm: p.heightCm,
        goal: p.goal,
        pace: p.pace,
        activity: p.activity,
        level: p.level,
        place: p.where,
        days_per_week: p.daysPerWeek,
        meals_per_day: p.mealsPerDay,
        allergies: p.allergies,
        avoid: p.avoid,
        kcal: Math.round(t.kcal),
        protein: Math.round(t.protein),
        carbs: Math.round(t.carbs),
        fat: Math.round(t.fat),
        tdee: Math.round(t.tdee),
        updated_at: new Date().toISOString(),
      }),
    );
  } catch (e) {
    useApp.setState({ profileDirty: true });
    throw e;
  }
}

async function pushDay(uid: string, day: string) {
  const s = useApp.getState();
  const logs = s.logs[day] ?? [];
  // Se desmarca antes de subir: un cambio hecho durante la subida vuelve a marcar el día.
  useApp.setState({ dirtyDays: s.dirtyDays.filter((d) => d !== day) });
  try {
    const off = [...new Set(logs.map((l) => l.foodId))].flatMap((id) => (s.customFoods[id] ? [s.customFoods[id]] : []));
    if (off.length) {
      ok(
        await supabase!.from('foods').upsert(
          off.map((f) => ({ id: f.id, name_es: f.name, emoji: f.emoji, kcal: f.kcal, p: f.p, c: f.c, f: f.f, role: f.role, barcode: f.id.slice(4), source: 'off' })),
          { onConflict: 'id', ignoreDuplicates: true },
        ),
      );
    }
    ok(await supabase!.from('meal_logs').delete().eq('user_id', uid).eq('day', day));
    const slots = [...new Set(logs.map((l) => l.slot))];
    if (slots.length) {
      const { data } = ok(
        await supabase!
          .from('meal_logs')
          .insert(slots.map((slot) => ({ user_id: uid, day, slot: String(slot) })))
          .select('id, slot'),
      );
      const idOf = Object.fromEntries((data ?? []).map((r) => [r.slot, r.id]));
      ok(await supabase!.from('meal_log_items').insert(logs.map((l) => ({ log_id: idOf[String(l.slot)], food_id: l.foodId, grams: l.grams, via: l.via }))));
    }
    ok(await supabase!.from('water_logs').upsert({ user_id: uid, day, glasses: s.water[day] ?? 0 }));
    const sets = s.sets[day] ?? [];
    ok(await supabase!.from('workout_sets').delete().eq('user_id', uid).eq('day', day));
    if (sets.length) {
      ok(await supabase!.from('workout_sets').insert(sets.map((x) => ({ user_id: uid, day, exercise: x.exercise, set_no: x.setNo, reps: x.reps, weight_kg: x.weightKg }))));
    }
  } catch (e) {
    const now = useApp.getState().dirtyDays;
    if (!now.includes(day)) useApp.setState({ dirtyDays: [...now, day] });
    throw e;
  }
}

/** Sin perfil local pero con datos en la nube (misma cuenta): recupera perfil, registros, agua y series. */
async function pull(uid: string) {
  const { data: row } = ok(await supabase!.from('profiles').select('*').eq('user_id', uid).maybeSingle());
  if (!row) return;
  const profile: Profile = {
    name: row.name,
    sex: row.sex,
    age: row.age,
    weightKg: Number(row.weight_kg),
    heightCm: Number(row.height_cm),
    goal: row.goal,
    pace: row.pace,
    activity: row.activity,
    level: row.level,
    where: row.place,
    daysPerWeek: row.days_per_week,
    mealsPerDay: row.meals_per_day,
    allergies: row.allergies,
    avoid: row.avoid,
  };
  const { data: meals } = ok(await supabase!.from('meal_logs').select('day, slot, meal_log_items(food_id, grams, via)').eq('user_id', uid));
  const { data: water } = ok(await supabase!.from('water_logs').select('day, glasses').eq('user_id', uid));
  const { data: wsets } = ok(await supabase!.from('workout_sets').select('day, exercise, set_no, reps, weight_kg').eq('user_id', uid));
  const offIds = [...new Set((meals ?? []).flatMap((m) => m.meal_log_items.map((i) => i.food_id as string)))].filter((id) => id.startsWith('off_'));
  const { data: off } = offIds.length ? ok(await supabase!.from('foods').select('id, name_es, emoji, kcal, p, c, f, role').in('id', offIds)) : { data: [] };

  for (const f of off ?? []) {
    useApp.getState().addFood({ id: f.id, name: f.name_es, emoji: f.emoji ?? '🏷️', kcal: Number(f.kcal), p: Number(f.p), c: Number(f.c), f: Number(f.f), role: f.role });
  }
  const known = allFoods();
  const logs: Record<string, LogItem[]> = {};
  for (const m of meals ?? []) {
    for (const i of m.meal_log_items) {
      if (known[i.food_id]) (logs[m.day] ??= []).push({ foodId: i.food_id, grams: Number(i.grams), slot: Number(m.slot), via: i.via as Via });
    }
  }
  const sets: Record<string, SetLog[]> = {};
  for (const w of wsets ?? []) (sets[w.day] ??= []).push({ exercise: w.exercise, setNo: w.set_no, reps: w.reps ?? 0, weightKg: Number(w.weight_kg ?? 0) });
  useApp.getState().commitProfile(profile);
  useApp.setState({
    logs,
    water: Object.fromEntries((water ?? []).map((w) => [w.day, w.glasses])),
    sets,
    workoutDays: Object.keys(sets), // aproximación: un día con series cuenta como entreno hecho
    dirtyDays: [],
    profileDirty: false,
  });
}

let running = false;
let profileSent = false;

export async function syncNow() {
  if (!supabase || running) return;
  running = true;
  try {
    const uid = await userId();
    if (!useApp.getState().profile) return await pull(uid);
    // Una vez por sesión aunque no haya cambios: cubre perfiles creados antes de activar la sincronización.
    if (!profileSent || useApp.getState().profileDirty) {
      await pushProfile(uid);
      profileSent = true;
    }
    for (const day of [...useApp.getState().dirtyDays]) await pushDay(uid, day);
  } catch {
    // Sin red o servidor caído: los pendientes siguen marcados y se reintenta después.
  } finally {
    running = false;
  }
}

/** Sincroniza al abrir, al volver a la app y 2 s después de cada cambio pendiente. */
export function useSync() {
  useEffect(() => {
    if (!supabase) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    syncNow();
    const unsub = useApp.subscribe((s, prev) => {
      if (s.dirtyDays === prev.dirtyDays && s.profileDirty === prev.profileDirty) return;
      if (!s.dirtyDays.length && !s.profileDirty) return;
      clearTimeout(timer);
      timer = setTimeout(syncNow, 2000);
    });
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') syncNow();
    });
    return () => {
      clearTimeout(timer);
      unsub();
      sub.remove();
    };
  }, []);
}
