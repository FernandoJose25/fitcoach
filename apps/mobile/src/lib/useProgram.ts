import { useMemo } from 'react';
import { applySwaps, buildSession, buildTimeline, programWeek, sessionForDay, timelineSeconds } from '@fitcoach/core';
import { todayKey, useApp } from '@/store/useApp';

/** Programa de entreno de la semana en curso: días con sus ejercicios (con cambios), hechos y siguiente. */
export function useProgram() {
  const profile = useApp((s) => s.profile)!;
  const swaps = useApp((s) => s.swaps);
  const programStart = useApp((s) => s.programStart);
  const sessionsDone = useApp((s) => s.sessionsDone);
  const workoutDays = useApp((s) => s.workoutDays);

  const today = todayKey();
  const week = programWeek(programStart ?? today, today);
  const days = useMemo(
    () =>
      Array.from({ length: profile.daysPerWeek }, (_, d) => {
        const ses = sessionForDay(d, profile);
        const key = `${ses.kind}-${ses.occurrence}`;
        const base = buildSession(ses.kind, ses.occurrence, profile);
        const exercises = applySwaps(base, swaps[key] ?? {});
        return { d, key, kind: ses.kind, exercises, recommended: base.map((e) => e.name), minutes: Math.round(timelineSeconds(buildTimeline(exercises)) / 60) };
      }),
    [profile, swaps],
  );
  const doneThisWeek = sessionsDone.filter((s) => s.week === week);
  const doneDays = new Set(doneThisWeek.map((s) => s.day));
  const next = days.find((x) => !doneDays.has(x.d))?.d ?? null;
  const doneToday = doneThisWeek.find((s) => s.date === today)?.day ?? null;
  return { profile, week, days, doneDays, next, doneToday, trainedToday: workoutDays.includes(today) };
}
