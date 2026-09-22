import type { Moment } from './types';

export interface WorldObject {
  id: string;
  /** Editorial label shown on the tile. */
  label: string;
  /** Lowercase keywords; a moment unlocks this when any match. */
  keywords: string[];
}

export interface UnlockedObject extends WorldObject {
  /** How many moments mention it. */
  count: number;
}

// The cabinet of curiosities: objects your life unlocks as you record it.
export const WORLD_OBJECTS: WorldObject[] = [
  { id: 'coffee', label: 'Coffee cup', keywords: ['coffee', 'café', 'cafe', 'latte', 'espresso', 'starbucks', 'tim hortons'] },
  { id: 'book', label: 'Book', keywords: ['book', 'read', 'reading', 'library', 'novel'] },
  { id: 'dumbbell', label: 'Dumbbell', keywords: ['gym', 'workout', 'lift', 'running', 'run ', 'jog', 'marathon'] },
  { id: 'backpack', label: 'Backpack', keywords: ['school', 'class', 'university', 'lecture', 'campus', 'exam', 'study'] },
  { id: 'airplane', label: 'Airplane', keywords: ['flight', 'trip', 'travel', 'vacation', 'airport', 'montreal', 'ottawa', 'vancouver'] },
  { id: 'camera', label: 'Camera', keywords: ['photo', 'photograph', 'shoot', 'photography'] },
  { id: 'music', label: 'Vinyl record', keywords: ['concert', 'music', 'song', 'album', 'gig', 'spotify'] },
  { id: 'pizza', label: 'Pizza slice', keywords: ['pizza', 'dinner', 'lunch', 'restaurant', 'food', 'brunch', 'ramen', 'sushi'] },
  { id: 'controller', label: 'Game controller', keywords: ['game', 'gaming', 'xbox', 'playstation', 'nintendo', 'steam'] },
  { id: 'moon', label: 'Moon', keywords: ['sleep', 'dream', 'midnight', 'insomnia', 'nap'] },
  { id: 'tent', label: 'Tent', keywords: ['camp', 'hike', 'hiking', 'trail', 'cottage', 'lake'] },
  { id: 'beach', label: 'Beach umbrella', keywords: ['beach', 'swim', 'pool', 'ocean', 'lake'] },
  { id: 'snow', label: 'Snowflake', keywords: ['snow', 'winter', 'ski', 'skating', 'christmas'] },
  { id: 'flower', label: 'Flower', keywords: ['flower', 'garden', 'park', 'spring', 'blossom', 'picnic'] },
  { id: 'briefcase', label: 'Briefcase', keywords: ['work', 'office', 'meeting', 'internship', 'interview', 'job'] },
  { id: 'gift', label: 'Gift box', keywords: ['birthday', 'gift', 'party', 'celebrat', 'anniversary'] },
  { id: 'film', label: 'Film reel', keywords: ['movie', 'film', 'cinema', 'theatre', 'theater', 'netflix'] },
  { id: 'dollar', label: 'Coin', keywords: ['money', 'paid', 'bought', 'salary', 'flip', 'sold'] },
  { id: 'heart', label: 'Heart', keywords: ['love', 'date', 'crush', 'valentine', 'anniversary'] },
  { id: 'bike', label: 'Bicycle', keywords: ['bike', 'cycling', 'ride'] },
  { id: 'paw', label: 'Paw print', keywords: ['dog', 'cat', 'pet', 'puppy', 'kitten'] },
  { id: 'grad', label: 'Grad cap', keywords: ['graduat', 'degree', 'convocation'] },
  { id: 'code', label: 'Terminal', keywords: ['code', 'coding', 'app', 'program', 'hackathon', 'github'] },
  { id: 'tea', label: 'Teacup', keywords: ['tea', 'boba', 'bubble tea', 'matcha'] },
];

function haystack(m: Moment): string {
  return [
    m.text,
    m.title ?? '',
    m.locationName ?? '',
    ...(m.people ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

/** Which objects the user's moments have unlocked, with mention counts. */
export function unlockedObjects(moments: Moment[]): UnlockedObject[] {
  const found = new Map<string, number>();
  for (const m of moments) {
    const hay = haystack(m);
    for (const obj of WORLD_OBJECTS) {
      if (obj.keywords.some((k) => hay.includes(k))) {
        found.set(obj.id, (found.get(obj.id) ?? 0) + 1);
      }
    }
  }
  return WORLD_OBJECTS.filter((o) => found.has(o.id)).map((o) => ({
    ...o,
    count: found.get(o.id) ?? 0,
  }));
}

/** Objects not yet unlocked. */
export function lockedObjects(moments: Moment[]): WorldObject[] {
  const unlockedIds = new Set(unlockedObjects(moments).map((o) => o.id));
  return WORLD_OBJECTS.filter((o) => !unlockedIds.has(o.id));
}
