// User-created collections: named groupings of moments.
// Stored at @ly:collections:v1. All functions are defensive — corrupt
// storage resolves to an empty list, never a crash.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Collection, Moment } from './types';
import { newId } from './storage';

const COLLECTIONS_KEY = '@ly:collections:v1';

function sanitize(raw: unknown): Collection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (c): c is Collection =>
        typeof c === 'object' &&
        c !== null &&
        typeof (c as Collection).id === 'string' &&
        typeof (c as Collection).name === 'string' &&
        Array.isArray((c as Collection).momentIds),
    )
    .map((c) => ({
      id: c.id,
      name: c.name,
      momentIds: c.momentIds.filter((id): id is string => typeof id === 'string'),
      createdAt:
        typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
    }));
}

export async function loadCollections(): Promise<Collection[]> {
  try {
    const raw = await AsyncStorage.getItem(COLLECTIONS_KEY);
    return raw ? sanitize(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

async function persist(collections: Collection[]): Promise<void> {
  await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

/** Create a collection and return the updated list. */
export async function createCollection(name: string): Promise<Collection[]> {
  const trimmed = name.trim();
  if (!trimmed) return loadCollections();
  const collections = await loadCollections();
  const created: Collection = {
    id: newId(),
    name: trimmed,
    momentIds: [],
    createdAt: new Date().toISOString(),
  };
  const updated = [created, ...collections];
  await persist(updated);
  return updated;
}

/** Rename a collection. */
export async function renameCollection(
  id: string,
  name: string,
): Promise<Collection[]> {
  const trimmed = name.trim();
  if (!trimmed) return loadCollections();
  const collections = await loadCollections();
  const updated = collections.map((c) =>
    c.id === id ? { ...c, name: trimmed } : c,
  );
  await persist(updated);
  return updated;
}

/** Delete a collection (moments are untouched). */
export async function deleteCollection(id: string): Promise<Collection[]> {
  const collections = await loadCollections();
  const updated = collections.filter((c) => c.id !== id);
  await persist(updated);
  return updated;
}

/** Toggle a moment's membership in a collection. Returns the updated list. */
export async function toggleMomentInCollection(
  collectionId: string,
  momentId: string,
): Promise<Collection[]> {
  const collections = await loadCollections();
  const updated = collections.map((c) => {
    if (c.id !== collectionId) return c;
    const has = c.momentIds.includes(momentId);
    return {
      ...c,
      momentIds: has
        ? c.momentIds.filter((id) => id !== momentId)
        : [momentId, ...c.momentIds],
    };
  });
  await persist(updated);
  return updated;
}

/** Resolve a collection's moments, newest first, dropping deleted ids. */
export function collectionMoments(
  collection: Collection,
  allMoments: Moment[],
): Moment[] {
  const byId = new Map(allMoments.map((m) => [m.id, m]));
  return collection.momentIds
    .map((id) => byId.get(id))
    .filter((m): m is Moment => !!m);
}

/** Cover photo: the newest moment in the collection that has a photo. */
export function collectionCover(
  collection: Collection,
  allMoments: Moment[],
): string | null {
  const moments = collectionMoments(collection, allMoments);
  const withPhoto = moments.find((m) => m.photoUri);
  return withPhoto?.photoUri ?? null;
}
