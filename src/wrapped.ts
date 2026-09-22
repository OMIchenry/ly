// LY Wrapped: the year in review, computed on-device.
// One WrappedData per calendar year that has at least one moment.

import type { Moment } from './types';
import { dayKey } from './calendar';
import { longestStreakFromDays } from './observations';

export interface WrappedData {
  year: number;
  total: number;
  photos: number;
  voiceNotes: number;
  months: { label: string; short: string; count: number }[];
  topPeople: { name: string; count: number }[];
  topPlaces: { name: string; count: number }[];
  topWords: { word: string; count: number }[];
  longestStreak: number;
  firstMoment: Moment | null;
  latestMoment: Moment | null;
  firstPhoto: Moment | null;
  latestPhoto: Moment | null;
}

const STOPWORDS = new Set(
  'a,an,the,and,or,but,if,then,so,because,as,at,by,for,from,in,into,of,off,on,out,over,to,up,with,about,after,before,between,during,through,under,again,further,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,than,too,very,can,will,just,don,should,now,was,were,are,is,be,been,being,have,has,had,having,do,does,did,doing,would,could,ought,i,me,my,myself,we,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,this,that,these,those,am,really,got,get,go,going,went,day,today,yesterday,tomorrow,time,thing,things,lot,much,many,also,back,still,even,like,im,ive,dont,cant,wont,us'.split(
    ',',
  ),
);

/** Years with at least one moment, newest first. */
export function wrappedYears(moments: Moment[]): number[] {
  const years = new Set<number>();
  for (const m of moments) years.add(new Date(m.createdAt).getFullYear());
  return Array.from(years).sort((a, b) => b - a);
}

export function computeWrapped(moments: Moment[], year: number): WrappedData {
  const inYear = moments.filter(
    (m) => new Date(m.createdAt).getFullYear() === year,
  );

  const monthCounts = new Array(12).fill(0) as number[];
  const peopleCounts = new Map<string, number>();
  const placeCounts = new Map<string, number>();
  const wordCounts = new Map<string, number>();
  let photos = 0;
  let voiceNotes = 0;

  for (const m of inYear) {
    const d = new Date(m.createdAt);
    monthCounts[d.getMonth()] += 1;
    if (m.photoUri) photos += 1;
    if (m.audioUri) voiceNotes += 1;
    const place = (m.locationName ?? '').trim();
    if (place) placeCounts.set(place, (placeCounts.get(place) ?? 0) + 1);
    for (const p of m.people ?? []) {
      const name = p.trim();
      if (name) peopleCounts.set(name, (peopleCounts.get(name) ?? 0) + 1);
    }
    const words = `${m.title ?? ''} ${m.text}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w));
    const seen = new Set<string>();
    for (const w of words) {
      if (seen.has(w)) continue;
      seen.add(w);
      wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
    }
  }

  const top = (map: Map<string, number>, n: number) =>
    Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);

  const months = monthCounts.map((count, i) => {
    const d = new Date(year, i, 1);
    return {
      label: d.toLocaleDateString('en-US', { month: 'long' }),
      short: d.toLocaleDateString('en-US', { month: 'short' }),
      count,
    };
  });

  const days = new Set(inYear.map((m) => dayKey(new Date(m.createdAt))));
  const withPhotos = inYear.filter((m) => m.photoUri);

  return {
    year,
    total: inYear.length,
    photos,
    voiceNotes,
    months,
    topPeople: top(peopleCounts, 5),
    topPlaces: top(placeCounts, 5),
    topWords: top(wordCounts, 8).map(({ name, count }) => ({
      word: name,
      count,
    })),
    longestStreak: longestStreakFromDays(days),
    firstMoment: inYear.length > 0 ? inYear[inYear.length - 1] : null,
    latestMoment: inYear.length > 0 ? inYear[0] : null,
    firstPhoto: withPhotos.length > 0 ? withPhotos[withPhotos.length - 1] : null,
    latestPhoto: withPhotos.length > 0 ? withPhotos[0] : null,
  };
}
