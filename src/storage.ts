import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Moment } from './types';

const MOMENTS_KEY = '@ly:moments:v1';
const TRASH_KEY = '@ly:trash:v1';
/** Trashed moments are kept this long before being purged for good. */
export const TRASH_RETENTION_DAYS = 30;

export interface TrashedMoment extends Moment {
  /** ISO 8601 timestamp of when the moment was deleted. */
  deletedAt: string;
}

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

/** Replace a moment by id with a patched copy. Returns the updated list. */
export async function updateMoment(
  id: string,
  patch: Partial<Moment>,
): Promise<Moment[]> {
  const moments = await loadMoments();
  const updated = moments.map((m) => (m.id === id ? { ...m, ...patch } : m));
  await AsyncStorage.setItem(MOMENTS_KEY, JSON.stringify(updated));
  return updated;
}

/** Remove a moment by id — moves it to Recently Deleted, not gone for good.
    Returns the updated moments list. */
export async function deleteMoment(id: string): Promise<Moment[]> {
  const moments = await loadMoments();
  const target = moments.find((m) => m.id === id);
  const updated = moments.filter((m) => m.id !== id);
  await AsyncStorage.setItem(MOMENTS_KEY, JSON.stringify(updated));
  if (target) {
    const trash = await loadTrashRaw();
    const trashed: TrashedMoment = {
      ...target,
      deletedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(
      TRASH_KEY,
      JSON.stringify([trashed, ...trash]),
    );
  }
  return updated;
}

async function loadTrashRaw(): Promise<TrashedMoment[]> {
  try {
    const raw = await AsyncStorage.getItem(TRASH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrashedMoment[]) : [];
  } catch {
    return [];
  }
}

/** Load trashed moments, newest-deleted first. Purges anything older than
    TRASH_RETENTION_DAYS on the way through. */
export async function loadTrash(): Promise<TrashedMoment[]> {
  const cutoff = Date.now() - TRASH_RETENTION_DAYS * 86_400_000;
  const trash = await loadTrashRaw();
  const kept = trash.filter((t) => {
    const when = new Date(t.deletedAt).getTime();
    return Number.isFinite(when) && when >= cutoff;
  });
  if (kept.length !== trash.length) {
    try {
      await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(kept));
    } catch {
      // Non-fatal; the purge just retries next load.
    }
  }
  return kept;
}

/** Restore a trashed moment back to the top of the moments list. */
export async function restoreMoment(id: string): Promise<void> {
  const trash = await loadTrashRaw();
  const target = trash.find((t) => t.id === id);
  if (!target) return;
  const { deletedAt: _deletedAt, ...moment } = target;
  const moments = await loadMoments();
  await AsyncStorage.setItem(
    MOMENTS_KEY,
    JSON.stringify([moment, ...moments]),
  );
  await AsyncStorage.setItem(
    TRASH_KEY,
    JSON.stringify(trash.filter((t) => t.id !== id)),
  );
}

/** Permanently remove one trashed moment. Cannot be undone. */
export async function deleteForever(id: string): Promise<TrashedMoment[]> {
  const trash = await loadTrashRaw();
  const kept = trash.filter((t) => t.id !== id);
  await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(kept));
  return kept;
}

/** Permanently remove everything in the trash. Cannot be undone. */
export async function emptyTrash(): Promise<void> {
  await AsyncStorage.setItem(TRASH_KEY, JSON.stringify([]));
}

/** Simple unique id — good enough for local-only data. */
export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}
