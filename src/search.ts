// Natural-language search for LY.
//
// Parses queries like "beach days with mom", "photos last month",
// "coffee in 2025" into structured filters — all on-device, no backend.
//
// Facets:
//   - keywords, expanded through a synonym map ("beach" also matches
//     "shore", "sand", "ocean"...)
//   - people: matched against the user's known tagged names
//   - places: matched against the user's known location names
//   - time: "last week/month/year", "this month", named months,
//     years ("2025", "in june"), "yesterday", "today"
//   - media: "photos"/"pics" → photo moments, "voice"/"audio" → voice notes

import type { Moment } from './types';
import { displayTitle } from './titles';

export interface SearchContext {
  /** All known people tags (deduped). */
  people: string[];
  /** All known location names (deduped). */
  places: string[];
}

export interface ParsedQuery {
  /** Expanded keyword terms; a moment matches when ANY term hits. */
  terms: string[];
  /** Required people — a moment must include ALL of these. */
  people: string[];
  /** Place filter — a moment must match ONE of these. */
  places: string[];
  /** Inclusive day bounds, local-time ISO "yyyy-mm-dd". */
  from: string | null;
  to: string | null;
  timeLabel: string | null;
  media: 'photos' | 'voice' | null;
  /** Human-readable interpretation, rendered as chips. */
  chips: string[];
}

const SYNONYMS: Record<string, string[]> = {
  beach: ['beach', 'shore', 'sand', 'ocean', 'coast', 'seaside'],
  coffee: ['coffee', 'café', 'cafe', 'latte', 'espresso', 'cappuccino', 'matcha'],
  dog: ['dog', 'puppy', 'pup'],
  cat: ['cat', 'kitten', 'kitty'],
  gym: ['gym', 'workout', 'training', 'exercise'],
  run: ['run', 'running', 'jog', 'jogging', 'marathon'],
  trip: ['trip', 'travel', 'vacation', 'journey', 'getaway'],
  flight: ['flight', 'airport', 'plane'],
  food: ['food', 'dinner', 'lunch', 'brunch', 'restaurant', 'meal'],
  pizza: ['pizza'],
  movie: ['movie', 'film', 'cinema'],
  concert: ['concert', 'gig', 'show', 'performance'],
  party: ['party', 'celebration', 'birthday'],
  work: ['work', 'office', 'meeting', 'job'],
  school: ['school', 'class', 'lecture', 'campus', 'university'],
  game: ['game', 'gaming', 'xbox', 'playstation', 'nintendo'],
  snow: ['snow', 'snowy', 'snowfall'],
  rain: ['rain', 'rainy', 'drizzle', 'storm'],
  sun: ['sun', 'sunny', 'sunshine'],
  park: ['park', 'garden'],
  hike: ['hike', 'hiking', 'trail'],
  swim: ['swim', 'swimming', 'pool'],
  bike: ['bike', 'cycling', 'ride'],
  book: ['book', 'reading', 'novel', 'library'],
  music: ['music', 'song', 'album', 'playlist'],
  sleep: ['sleep', 'nap', 'dream', 'midnight'],
  love: ['love', 'date', 'anniversary'],
  money: ['money', 'paid', 'salary'],
  photo: ['photo', 'photograph', 'picture', 'selfie', 'shot'],
};

const STOPWORDS = new Set(
  'a,an,the,and,or,with,of,for,from,in,on,at,to,my,our,days,day,last,this,that,those,these,me,i,was,were,had,have,has,are,is,it,its,when,where,what,how,all,some,any,more,most,very,really,just,so,but,if,then,than,too,also,back,still,even,like,one,two,few,many,much,lot,lots'.split(
    ',',
  ),
);

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

function dayISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function shiftDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Resolve a time expression in the query to day bounds. */
function parseTime(q: string): { from: string; to: string; label: string } | null {
  const now = new Date();
  const today = dayISO(now);

  if (/\btoday\b/.test(q)) return { from: today, to: today, label: 'Today' };
  if (/\byesterday\b/.test(q)) {
    const y = dayISO(shiftDays(now, -1));
    return { from: y, to: y, label: 'Yesterday' };
  }
  if (/\blast week\b/.test(q)) {
    return {
      from: dayISO(shiftDays(now, -7)),
      to: today,
      label: 'Last 7 days',
    };
  }
  if (/\bthis week\b/.test(q)) {
    const mondayOffset = (now.getDay() + 6) % 7;
    return {
      from: dayISO(shiftDays(now, -mondayOffset)),
      to: today,
      label: 'This week',
    };
  }
  if (/\blast month\b/.test(q)) {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      from: dayISO(first),
      to: dayISO(last),
      label: first.toLocaleDateString('en-US', { month: 'long' }),
    };
  }
  if (/\bthis month\b/.test(q)) {
    return {
      from: dayISO(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: today,
      label: 'This month',
    };
  }
  if (/\blast year\b/.test(q)) {
    const y = now.getFullYear() - 1;
    return {
      from: `${y}-01-01`,
      to: `${y}-12-31`,
      label: String(y),
    };
  }
  if (/\bthis year\b/.test(q)) {
    const y = now.getFullYear();
    return { from: `${y}-01-01`, to: today, label: String(y) };
  }
  // Named month, optionally with a year: "march", "in june 2024".
  const monthMatch = q.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b(?:\s+(\d{4}))?/,
  );
  if (monthMatch) {
    const mi = MONTHS.indexOf(monthMatch[1]);
    const year = monthMatch[2] ? parseInt(monthMatch[2], 10) : now.getFullYear();
    if (Number.isFinite(year) && mi >= 0) {
      const first = new Date(year, mi, 1);
      const last = new Date(year, mi + 1, 0);
      const label =
        monthMatch[1][0].toUpperCase() + monthMatch[1].slice(1) + ` ${year}`;
      return { from: dayISO(first), to: dayISO(last), label };
    }
  }
  // Bare year: "2025", "in 2024".
  const yearMatch = q.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    return { from: `${y}-01-01`, to: `${y}-12-31`, label: String(y) };
  }
  return null;
}

/** Parse a raw query into structured filters. */
export function parseQuery(raw: string, ctx: SearchContext): ParsedQuery {
  const q = ` ${raw.toLowerCase().trim()} `;
  const chips: string[] = [];

  // Media facet.
  let media: ParsedQuery['media'] = null;
  if (/\b(photos?|pictures?|pics?|selfies?)\b/.test(q)) {
    media = 'photos';
    chips.push('With photos');
  } else if (/\b(voice|audio|recordings?)\b/.test(q)) {
    media = 'voice';
    chips.push('Voice notes');
  }

  // Time facet.
  const time = parseTime(q);
  let from: string | null = null;
  let to: string | null = null;
  let timeLabel: string | null = null;
  if (time) {
    from = time.from;
    to = time.to;
    timeLabel = time.label;
    chips.push(time.label);
  }

  // People facet: known names appearing in the query.
  const people: string[] = [];
  for (const name of ctx.people) {
    const n = name.toLowerCase();
    if (n.length > 1 && q.includes(` ${n} `)) {
      people.push(name);
      chips.push(`With ${name}`);
    }
  }

  // Places facet: known location names appearing in the query.
  const places: string[] = [];
  for (const place of ctx.places) {
    const p = place.toLowerCase();
    if (p.length > 1 && q.includes(p)) {
      places.push(place);
      chips.push(`In ${place}`);
    }
  }

  // Keyword facet: remaining words, minus stopwords and consumed tokens.
  const consumed = new Set<string>();
  for (const n of people) for (const w of n.toLowerCase().split(/\s+/)) consumed.add(w);
  for (const p of places) for (const w of p.toLowerCase().split(/[\s,]+/)) consumed.add(w);
  if (timeLabel) {
    for (const w of timeLabel.toLowerCase().split(/\s+/)) consumed.add(w);
  }
  const words = q
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !STOPWORDS.has(w) &&
        !consumed.has(w) &&
        !/^(19|20)\d{2}$/.test(w),
    );

  const terms = new Set<string>();
  for (const w of words) {
    const expanded = SYNONYMS[w];
    if (expanded) {
      for (const s of expanded) terms.add(s);
      chips.push(`“${w}”`);
    } else {
      terms.add(w);
      chips.push(`“${w}”`);
    }
  }

  return {
    terms: Array.from(terms),
    people,
    places,
    from,
    to,
    timeLabel,
    media,
    chips,
  };
}

function haystack(m: Moment): string {
  return [displayTitle(m), m.text, m.locationName ?? '', ...(m.people ?? [])]
    .join(' ')
    .toLowerCase();
}

/** True when the moment satisfies every facet of the parsed query. */
export function matchesQuery(m: Moment, pq: ParsedQuery): boolean {
  if (pq.media === 'photos' && !m.photoUri) return false;
  if (pq.media === 'voice' && !m.audioUri) return false;

  if (pq.from || pq.to) {
    const day = dayISO(new Date(m.createdAt));
    if (pq.from && day < pq.from) return false;
    if (pq.to && day > pq.to) return false;
  }

  if (pq.people.length > 0) {
    const tagged = (m.people ?? []).map((p) => p.toLowerCase());
    if (!pq.people.every((p) => tagged.includes(p.toLowerCase()))) return false;
  }

  if (pq.places.length > 0) {
    const loc = (m.locationName ?? '').toLowerCase();
    if (!pq.places.some((p) => loc.includes(p.toLowerCase()))) return false;
  }

  if (pq.terms.length > 0) {
    const hay = haystack(m);
    if (!pq.terms.some((t) => hay.includes(t))) return false;
  }

  return true;
}

/** Plain keyword fallback for queries that parse to nothing. */
export function matchesPlain(m: Moment, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  return haystack(m).includes(q);
}

/** Build the search context from the moments on disk. */
export function buildSearchContext(moments: Moment[]): SearchContext {
  const people = new Set<string>();
  const places = new Set<string>();
  for (const m of moments) {
    for (const p of m.people ?? []) {
      const t = p.trim();
      if (t) people.add(t);
    }
    const loc = (m.locationName ?? '').trim();
    if (loc) places.add(loc);
  }
  // Longest names first so "New York" matches before "York"-style overlaps.
  const byLength = (a: string, b: string) => b.length - a.length;
  return {
    people: Array.from(people).sort(byLength),
    places: Array.from(places).sort(byLength),
  };
}
