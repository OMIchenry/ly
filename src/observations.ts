// Rule-based observations about the user's memory habits.
// No network, no model — just counts and dates computed on-device.
// Rendered as the "Observations" section of the stats screen.

import type { Moment } from './types';
import { dayKey } from './calendar';

export interface Observation {
  title: string;
  sub: string;
}

const STOPWORDS = new Set(
  'a,an,the,and,or,but,if,then,so,because,as,at,by,for,from,in,into,of,off,on,out,over,to,up,with,about,after,before,between,during,through,under,again,further,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,than,too,very,can,will,just,don,should,now,was,were,are,is,be,been,being,have,has,had,having,do,does,did,doing,would,could,ought,i,me,my,myself,we,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,this,that,these,those,am,really,got,get,go,going,went,day,today,yesterday,tomorrow,time,thing,things,lot,much,many,also,back,still,even,like,im,ive,dont,cant,wont,us'.split(
    ',',
  ),
);

const WEEKDAYS = [
  'Sundays',
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
];

function daypartOf(hour: number): string {
  if (hour >= 5 && hour < 12) return 'mornings';
  if (hour >= 12 && hour < 17) return 'afternoons';
  if (hour >= 17 && hour < 21) return 'evenings';
  return 'nights';
}

/** Longest run of consecutive days present in the day set. */
export function longestStreakFromDays(days: Set<string>): number {
  const sorted = Array.from(days).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of sorted) {
    const d = new Date(`${k}T12:00:00`);
    if (prev && d.getTime() - prev.getTime() === 86_400_000) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function computeObservations(moments: Moment[]): Observation[] {
  if (moments.length < 3) return [];
  const out: Observation[] = [];
  const total = moments.length;

  // 1) Busiest weekday.
  const weekdayCounts = new Array(7).fill(0) as number[];
  for (const m of moments) weekdayCounts[new Date(m.createdAt).getDay()] += 1;
  const busiest = weekdayCounts.indexOf(Math.max(...weekdayCounts));
  const busiestShare = weekdayCounts[busiest] / total;
  if (weekdayCounts[busiest] >= 3 && busiestShare >= 0.22) {
    out.push({
      title: `You capture most moments on ${WEEKDAYS[busiest].toLowerCase()}`,
      sub: `${weekdayCounts[busiest]} of your ${total} moments happened on a ${WEEKDAYS[busiest].toLowerCase().slice(0, -1)}.`,
    });
  }

  // 2) Most-mentioned word.
  const wordCounts = new Map<string, number>();
  for (const m of moments) {
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
  const topWord = Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topWord && topWord[1] >= 3) {
    const [word, count] = topWord;
    const cap = word[0].toUpperCase() + word.slice(1);
    out.push({
      title: `${cap} appears ${count}× — your most-mentioned thing`,
      sub: 'Your recurring words are a map of what your life is about.',
    });
  }

  // 3) Longest gap without a moment.
  const days = Array.from(
    new Set(moments.map((m) => dayKey(new Date(m.createdAt)))),
  ).sort();
  let longestGap = 0;
  let gapMonth = '';
  for (let i = 1; i < days.length; i++) {
    const a = new Date(`${days[i - 1]}T12:00:00`).getTime();
    const b = new Date(`${days[i]}T12:00:00`).getTime();
    const gap = Math.round((b - a) / 86_400_000) - 1;
    if (gap > longestGap) {
      longestGap = gap;
      gapMonth = new Date(`${days[i]}T12:00:00`).toLocaleDateString('en-US', {
        month: 'long',
      });
    }
  }
  if (longestGap >= 7) {
    out.push({
      title: `Longest quiet stretch: ${longestGap} days${gapMonth ? `, ending in ${gapMonth}` : ''}`,
      sub: 'Every archive has gaps. The moments around them matter more.',
    });
  }

  // 4) Days since the last moment.
  const newest = new Date(moments[0].createdAt);
  const now = new Date();
  const daysSince = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(newest.getFullYear(), newest.getMonth(), newest.getDate()).getTime()) /
      86_400_000,
  );
  if (daysSince >= 2) {
    out.push({
      title: `It's been ${daysSince} days since your last moment`,
      sub: 'Your streak misses you. One small note brings it back.',
    });
  }

  // 5) Photo share.
  const photos = moments.filter((m) => m.photoUri).length;
  const share = Math.round((photos / total) * 100);
  if (photos >= 3 && share >= 40) {
    out.push({
      title: `${share}% of your moments have photos`,
      sub: 'You remember in pictures. Future-you says thanks.',
    });
  }

  // 6) Favorite time of day.
  const partCounts = new Map<string, number>();
  for (const m of moments) {
    const part = daypartOf(new Date(m.createdAt).getHours());
    partCounts.set(part, (partCounts.get(part) ?? 0) + 1);
  }
  const topPart = Array.from(partCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topPart && topPart[1] >= 4 && topPart[1] / total >= 0.4) {
    out.push({
      title: `You're a ${topPart[0].slice(0, -1)} person`,
      sub: `Most of your moments are captured in the ${topPart[0]}.`,
    });
  }

  // 7) Longest streak ever.
  const best = longestStreakFromDays(new Set(days));
  if (best >= 5) {
    out.push({
      title: `Your longest run: ${best} days in a row`,
      sub: 'Consistency is the whole game. You already proved you can.',
    });
  }

  return out.slice(0, 6);
}
