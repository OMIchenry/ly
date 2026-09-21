// Auto-titles for moments.
//
// MODEL SEAM: generateTitle is currently a smart heuristic — no network, no
// keys, works fully offline. When an on-device model is available (dev build +
// Apple Foundation Models), replace the body of generateTitle with a model
// call. Every caller goes through displayTitle, so nothing else has to change.

import type { Moment, MomentWeather } from './types';

export interface TitleInput {
  text?: string | null;
  createdAt: string;
  locationName?: string | null;
  weather?: MomentWeather | null;
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function daypart(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function weatherAdjective(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes('thunder') || l.includes('lightning') || l.includes('storm'))
    return 'Stormy';
  if (l.includes('drizzle')) return 'Drizzly';
  if (l.includes('rain')) return 'Rainy';
  if (l.includes('snow')) return 'Snowy';
  if (l.includes('fog') || l.includes('mist') || l.includes('haze')) return 'Misty';
  if (l.includes('clear') || l.includes('sun')) return 'Sunny';
  if (l.includes('cloud') || l.includes('overcast')) return 'Cloudy';
  if (l.includes('wind')) return 'Windy';
  return null;
}

function shortPlace(name: string): string {
  return name.split(',')[0].trim();
}

/**
 * Build a title from whatever context we have. The user's own words win when
 * they're short enough to be a title; otherwise we compose time + place +
 * weather, e.g. "Rainy Saturday evening in Scarborough".
 */
export function generateTitle(input: TitleInput): string {
  const firstLine = (input.text ?? '').split('\n')[0].trim();
  if (firstLine.length > 0 && firstLine.length <= 42) return firstLine;

  const date = new Date(input.createdAt);
  const parts: string[] = [];
  const wx = input.weather?.label
    ? weatherAdjective(input.weather.label)
    : null;
  if (wx) parts.push(wx);
  parts.push(WEEKDAYS[date.getDay()] ?? '');
  parts.push(daypart(date.getHours()));

  let title = parts.filter(Boolean).join(' ');
  const place = (input.locationName ?? '').trim();
  if (place) title += ` in ${shortPlace(place)}`;
  return title || 'Untitled moment';
}

/** The title to show: the user's custom title, or a generated fallback. */
export function displayTitle(moment: Moment): string {
  const custom = (moment.title ?? '').trim();
  if (custom) return custom;
  return generateTitle(moment);
}
