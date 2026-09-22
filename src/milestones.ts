import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Moment } from './types';

const KEY = '@ly:milestones:v1';

export interface Celebration {
  title: string;
  sub: string;
}

interface MilestoneStore {
  /** Moment-count thresholds already celebrated. */
  momentMilestones: number[];
  /** Anniversary years already celebrated (1, 2, ...). */
  anniversaries: number[];
}

const MOMENT_THRESHOLDS = [1, 10, 50, 100, 250, 500, 1000];

const MOMENT_TITLES: Record<number, string> = {
  1: 'First memory!',
  10: '10 moments kept',
  50: '50 moments kept',
  100: '100 moments kept',
  250: '250 moments kept',
  500: '500 moments kept',
  1000: '1,000 moments kept',
};

async function loadStore(): Promise<MilestoneStore> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MilestoneStore>;
      return {
        momentMilestones: parsed.momentMilestones ?? [],
        anniversaries: parsed.anniversaries ?? [],
      };
    }
  } catch {
    // Corrupt store: start fresh rather than crash.
  }
  return { momentMilestones: [], anniversaries: [] };
}

async function saveStore(store: MilestoneStore): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Non-fatal.
  }
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Checks for newly-earned moment milestones. Returns at most one celebration
 * per call; anything already earned is marked so it never fires twice.
 * Call this after the streak-milestone check so only one modal appears.
 */
export async function checkMomentMilestones(
  moments: Moment[],
): Promise<Celebration | null> {
  if (moments.length === 0) return null;
  const store = await loadStore();
  let dirty = false;

  // Moment-count thresholds: celebrate the highest newly-reached one.
  const newlyReached = MOMENT_THRESHOLDS.filter(
    (t) => moments.length >= t && !store.momentMilestones.includes(t),
  );
  if (newlyReached.length > 0) {
    const highest = newlyReached[newlyReached.length - 1];
    store.momentMilestones = Array.from(
      new Set([...store.momentMilestones, ...newlyReached]),
    );
    dirty = true;
    await saveStore(store);
    const title = MOMENT_TITLES[highest] ?? `${highest} moments kept`;
    return {
      title,
      sub:
        highest === 1
          ? 'You started LY. This is where your archive begins.'
          : "You've kept pieces of your life. Keep going.",
    };
  }

  // Anniversary of the very first moment.
  const first = moments[moments.length - 1];
  if (first) {
    const firstDay = startOfDay(new Date(first.createdAt));
    const today = startOfDay(new Date());
    const years = today.getFullYear() - firstDay.getFullYear();
    const anniversaryPassed =
      years >= 1 &&
      (today.getMonth() > firstDay.getMonth() ||
        (today.getMonth() === firstDay.getMonth() &&
          today.getDate() >= firstDay.getDate()));
    if (anniversaryPassed && !store.anniversaries.includes(years)) {
      store.anniversaries.push(years);
      dirty = true;
      await saveStore(store);
      return {
        title: years === 1 ? 'One year of LY' : `${years} years of LY`,
        sub: 'A whole year of your life, kept. Look how far it goes.',
      };
    }
  }

  if (dirty) await saveStore(store);
  return null;
}
