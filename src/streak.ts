import { dayKey } from './calendar';
import type { Moment } from './types';

/**
 * Consecutive days (ending today or yesterday) with at least one moment.
 * A missing today doesn't break the streak — it just hasn't been
 * kept warm yet.
 */
export function currentStreak(moments: Moment[]): number {
  const days = new Set(moments.map((m) => dayKey(new Date(m.createdAt))));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** 0 = no egg yet, 1 = egg, 2 = cracking, 3 = hatched. */
export type EggStage = 0 | 1 | 2 | 3;

export function eggStage(streak: number): EggStage {
  if (streak <= 0) return 0;
  if (streak <= 2) return 1;
  if (streak <= 6) return 2;
  return 3;
}

export function eggCaption(streak: number): string {
  if (streak <= 0) return 'Save a moment today to lay your egg';
  if (streak === 1) return 'Your egg is warm — keep going';
  if (streak <= 6) return "It's starting to crack…";
  return 'It hatched! What a streak';
}
