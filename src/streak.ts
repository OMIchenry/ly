import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayKey } from './calendar';
import type { Moment } from './types';

/**
 * The complete egg system.
 *
 * Inspired by the best streak systems in the wild (Duolingo's is the
 * reference): a daily streak, a freeze inventory that auto-protects missed
 * days, a repair window instead of an instant reset, milestone celebrations
 * that evolve the egg, and a history strip as proof of consistency.
 *
 * Stages: 0 = empty nest, 1 = egg, 2 = cracking, 3 = hatching,
 *          4 = chick, 5 = fledgling, 6 = soaring.
 */
export type EggStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function eggStage(streak: number): EggStage {
  if (streak <= 0) return 0;
  if (streak <= 2) return 1;
  if (streak <= 6) return 2;
  if (streak <= 13) return 3;
  if (streak <= 29) return 4;
  if (streak <= 99) return 5;
  return 6;
}

export function eggCaption(streak: number): string {
  if (streak <= 0) return 'Save a moment today to lay your egg';
  if (streak <= 2) return 'Your egg is warm — keep going';
  if (streak <= 6) return "It's starting to crack…";
  if (streak <= 13) return "It's hatching!";
  if (streak <= 29) return 'A chick! Keep it alive';
  if (streak <= 99) return 'Your fledgling is growing';
  return 'Soaring. Legendary.';
}

/** Streak lengths that evolve the egg and earn a freeze. */
export const MILESTONES = [7, 14, 30, 60, 100, 365];
/** Nobody hoards more than this many freezes. */
export const MAX_FREEZES = 5;
/** New users start with two, like Duolingo's onboarding. */
const START_FREEZES = 2;

const EGG_KEY = '@ly:egg:v1';

export interface EggState {
  /** Freeze inventory. One auto-burns per missed day. */
  freezes: number;
  /** Milestones already celebrated (shown once each). */
  celebrated: number[];
  /** Monday-keyed week of the last repair, for the weekly repair limit. */
  repairWeek: string;
  repairUsed: boolean;
  /** When set, the streak is paused: this dayKey was missed with no freeze,
      and the streak is held at pausedStreak until today gets a moment. */
  pausedDay: string | null;
  pausedStreak: number;
}

const DEFAULT_STATE: EggState = {
  freezes: START_FREEZES,
  celebrated: [],
  repairWeek: '',
  repairUsed: false,
  pausedDay: null,
  pausedStreak: 0,
};

export async function loadEggState(): Promise<EggState> {
  try {
    const raw = await AsyncStorage.getItem(EGG_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<EggState>;
      return {
        freezes: Math.min(
          MAX_FREEZES,
          Math.max(0, typeof p.freezes === 'number' ? p.freezes : START_FREEZES),
        ),
        celebrated: Array.isArray(p.celebrated)
          ? p.celebrated.filter((n): n is number => typeof n === 'number')
          : [],
        repairWeek: typeof p.repairWeek === 'string' ? p.repairWeek : '',
        repairUsed: p.repairUsed === true,
        pausedDay: typeof p.pausedDay === 'string' ? p.pausedDay : null,
        pausedStreak:
          typeof p.pausedStreak === 'number' && p.pausedStreak > 0
            ? Math.floor(p.pausedStreak)
            : 0,
      };
    }
  } catch {
    // Corrupt value — start fresh, never break the app.
  }
  return { ...DEFAULT_STATE };
}

async function saveEggState(state: EggState): Promise<void> {
  try {
    await AsyncStorage.setItem(EGG_KEY, JSON.stringify(state));
  } catch {
    // Never break the app over egg bookkeeping.
  }
}

/** Monday-based week key, e.g. "2026-09-21". */
export function weekKey(date: Date = new Date()): string {
  const d = new Date(date);
  const mondayOffset = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - mondayOffset);
  return dayKey(d);
}

export interface EggResult {
  /** Live streak count (held steady while paused or frozen). */
  count: number;
  stage: EggStage;
  freezes: number;
  /** True when yesterday was missed with no freeze: save a moment today
      to repair the streak instead of losing it. */
  paused: boolean;
  /** A freeze auto-burned to cover a recent missed day. */
  freezeBurned: boolean;
  /** A repair was just consumed — the streak was restored today. */
  repaired: boolean;
  /** Milestones reached since the last refresh (celebrate once each). */
  newMilestones: number[];
  /** Next milestone above the current count, if any. */
  nextMilestone: number | null;
  /** Last 30 days, oldest → newest. True = a moment was saved. */
  history: boolean[];
}

function shift(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/**
 * Recompute the whole egg system from the moments on disk. Persists freeze
 * burns, pause/resume, repairs, and milestone rewards. Call on every Home
 * focus — it is the single source of truth for the streak.
 */
export async function refreshEgg(moments: Moment[]): Promise<EggResult> {
  const state = await loadEggState();
  const days = new Set(moments.map((m) => dayKey(new Date(m.createdAt))));
  const now = new Date();
  const todayK = dayKey(now);
  const yesterdayK = dayKey(shift(now, -1));
  const has = (k: string) => days.has(k);
  const hasToday = has(todayK);
  const wk = weekKey(now);
  const repairAvailable = state.repairWeek !== wk || !state.repairUsed;

  let freezes = state.freezes;
  let freezeBurned = false;
  let repaired = false;
  let paused = false;
  let count = 0;
  let resolved = false;

  // 1) Resolve a pause set on a previous refresh.
  if (state.pausedDay) {
    if (state.pausedDay === yesterdayK) {
      if (hasToday) {
        if (repairAvailable) {
          repaired = true;
          state.repairUsed = true;
          state.repairWeek = wk;
          count = state.pausedStreak + 1;
        } else {
          // No repair left — today starts a brand-new streak.
          count = 1;
        }
        state.pausedDay = null;
        state.pausedStreak = 0;
        resolved = true;
      } else {
        // Still waiting on today — keep holding the streak.
        paused = true;
        count = state.pausedStreak;
        resolved = true;
      }
    } else {
      // The missed day is older than yesterday: the pause expired,
      // the streak is gone.
      state.pausedDay = null;
      state.pausedStreak = 0;
    }
  }

  // 2) Walk back from today, bridging missed days with freezes.
  if (!resolved) {
    let cursor = new Date(now);
    if (has(dayKey(cursor))) count = 1;
    cursor = shift(cursor, -1); // yesterday
    for (;;) {
      const k = dayKey(cursor);
      if (has(k)) {
        count += 1;
        cursor = shift(cursor, -1);
        continue;
      }
      if (freezes > 0) {
        freezes -= 1;
        freezeBurned = true;
        cursor = shift(cursor, -1);
        continue;
      }
      break;
    }
    // Died exactly yesterday with a repair to spend? Pause instead of reset.
    if (count === 0 && dayKey(cursor) === yesterdayK && repairAvailable) {
      const before = shift(cursor, -1);
      if (has(dayKey(before))) {
        let dead = 0;
        let c2 = new Date(before);
        while (has(dayKey(c2))) {
          dead += 1;
          c2 = shift(c2, -1);
        }
        if (dead > 0) {
          paused = true;
          count = dead;
          state.pausedDay = yesterdayK;
          state.pausedStreak = dead;
        }
      }
    }
  }

  // 3) Milestones: celebrate once each, earn a freeze per milestone.
  const newMilestones: number[] = [];
  if (!paused) {
    for (const m of MILESTONES) {
      if (count >= m && !state.celebrated.includes(m)) {
        state.celebrated.push(m);
        newMilestones.push(m);
        freezes = Math.min(MAX_FREEZES, freezes + 1);
      }
    }
  }
  state.freezes = freezes;
  await saveEggState(state);

  // 4) 30-day history strip, oldest → newest.
  const history: boolean[] = [];
  for (let i = 29; i >= 0; i--) {
    history.push(has(dayKey(shift(now, -i))));
  }

  return {
    count,
    stage: eggStage(count),
    freezes,
    paused,
    freezeBurned,
    repaired,
    newMilestones,
    nextMilestone: MILESTONES.find((m) => m > count) ?? null,
    history,
  };
}
