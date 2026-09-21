import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayKey } from './calendar';
import type { Moment } from './types';

/**
 * Consecutive days (ending today or yesterday) with at least one moment.
 * A missing today doesn't break the streak — it just hasn't been
 * kept warm yet.
 */
export function currentStreak(moments: Moment[]): number {
  return currentStreakDetailed(moments, false).count;
}

export interface StreakResult {
  count: number;
  /** True when the weekly freeze bridged a single missed day. */
  freezeUsed: boolean;
}

/**
 * Streak with one safety net: if exactly one day in the chain is missing
 * and a freeze is available, the streak survives that gap and the freeze
 * is reported as used.
 */
export function currentStreakDetailed(
  moments: Moment[],
  freezeAvailable: boolean,
): StreakResult {
  const days = new Set(moments.map((m) => dayKey(new Date(m.createdAt))));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  if (!days.has(dayKey(cursor))) return { count: 0, freezeUsed: false };

  let count = 0;
  let freezeUsed = false;
  for (;;) {
    count += 1;
    const prev = new Date(cursor);
    prev.setDate(prev.getDate() - 1);
    if (days.has(dayKey(prev))) {
      cursor.setTime(prev.getTime());
      continue;
    }
    // A single missed day: burn the freeze if it bridges to an active day.
    if (freezeAvailable && !freezeUsed) {
      const prev2 = new Date(prev);
      prev2.setDate(prev2.getDate() - 1);
      if (days.has(dayKey(prev2))) {
        freezeUsed = true;
        cursor.setTime(prev2.getTime());
        continue;
      }
    }
    break;
  }
  return { count, freezeUsed };
}

const FREEZE_KEY = '@ly:streak-freeze:v1';

export interface FreezeState {
  week: string;
  used: boolean;
}

/** Monday-based week key, e.g. "2026-09-21". */
export function weekKey(date: Date = new Date()): string {
  const d = new Date(date);
  const mondayOffset = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - mondayOffset);
  return dayKey(d);
}

export async function loadFreezeState(): Promise<FreezeState> {
  try {
    const raw = await AsyncStorage.getItem(FREEZE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FreezeState>;
      if (typeof parsed.week === 'string') {
        return { week: parsed.week, used: parsed.used === true };
      }
    }
  } catch {
    // Corrupt value — treat as fresh.
  }
  return { week: '', used: false };
}

export async function saveFreezeState(state: FreezeState): Promise<void> {
  try {
    await AsyncStorage.setItem(FREEZE_KEY, JSON.stringify(state));
  } catch {
    // Never break the app over freeze bookkeeping.
  }
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
