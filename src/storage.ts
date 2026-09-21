import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Moment } from './types';

const MOMENTS_KEY = '@ly:moments:v1';

/** Load all saved moments, newest first. Returns [] when nothing is stored yet. */
export async function loadMoments(): Promise<Moment[]> {
  try {
    const raw = await AsyncStorage.getItem(MOMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Moment[]) : [];
  } catch {
    // Corrupt storage should never crash the app — start fresh.
    return [];
  }
}

/** Prepend a new moment and persist. Returns the updated list, newest first. */
export async function saveMoment(moment: Moment): Promise<Moment[]> {
  const moments = await loadMoments();
  const updated = [moment, ...moments];
  await AsyncStorage.setItem(MOMENTS_KEY, JSON.stringify(updated));
  return updated;
}

/** Simple unique id — good enough for local-only data. */
export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}
