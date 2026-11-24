/* eslint-disable @typescript-eslint/no-require-imports -- Metro resuelve assets locales con require */
import type { Focus, Goal } from '@fitcoach/core';

/**
 * Fotos de referencia del onboarding y del selector de zona (480 px, ~25 KB cada una, van en el APK para
 * verse sin internet). Origen: free-exercise-db (github.com/yuhonas/free-exercise-db), dominio público.
 */
export const GOAL_IMAGE: Record<Goal, number> = {
  gain: require('../../assets/ref/gain.jpg'),
  lose: require('../../assets/ref/lose.jpg'),
  maintain: require('../../assets/ref/maintain.jpg'),
};

export const FOCUS_IMAGE: Record<Focus, number> = {
  pecho: require('../../assets/ref/pecho.jpg'),
  espalda: require('../../assets/ref/espalda.jpg'),
  hombro: require('../../assets/ref/hombro.jpg'),
  brazos: require('../../assets/ref/brazos.jpg'),
  core: require('../../assets/ref/core.jpg'),
  pierna: require('../../assets/ref/pierna.jpg'),
};
