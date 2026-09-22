import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { loadMoments } from '../../storage';
import { computeObservations } from '../../observations';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';
import type { Moment } from '../../types';

interface Stats {
  total: number;
  photos: number;
  voiceNotes: number;
  places: number;
  people: number;
  topPlaces: { name: string; count: number }[];
  topPeople: { name: string; count: number }[];
  topWords: { word: string; count: number }[];
  months: { label: string; count: number }[];
  firstDate: string | null;
}

// Common words that carry no signal — filtered out of "patterns".
const STOPWORDS = new Set(
  'a,an,the,and,or,but,if,then,so,because,as,at,by,for,from,in,into,of,off,on,out,over,to,up,with,about,after,before,between,during,through,under,again,further,once,here,there,when,where,why,how,all,any,both,each,few,more,most,other,some,such,no,nor,not,only,own,same,than,too,very,can,will,just,don,should,now,was,were,are,is,be,been,being,have,has,had,having,do,does,did,doing,would,could,ought,i,me,my,myself,we,our,ours,ourselves,you,your,yours,yourself,yourselves,he,him,his,himself,she,her,hers,herself,it,its,itself,they,them,their,theirs,themselves,what,which,who,whom,this,that,these,those,am,very,really,got,get,go,going,went,day,today,yesterday,tomorrow,time,thing,things,lot,much,many,also,back,still,even,also,like,im,ive,dont,cant,wont,us'.split(
    ',',
  ),
);

function computeStats(moments: Moment[]): Stats {
  const placeCounts = new Map<string, number>();
  const peopleCounts = new Map<string, number>();
  const wordCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();
  let photos = 0;
  let voiceNotes = 0;

  for (const m of moments) {
    if (m.photoUri) photos += 1;
    if (m.audioUri) voiceNotes += 1;
    const place = (m.locationName ?? '').trim();
    if (place) placeCounts.set(place, (placeCounts.get(place) ?? 0) + 1);
    for (const p of m.people ?? []) {
      const name = p.trim();
      if (name) peopleCounts.set(name, (peopleCounts.get(name) ?? 0) + 1);
    }
    // Word patterns: lowercase tokens from title + text, minus stopwords.
    const words = `${m.title ?? ''} ${m.text}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w));
    const seenThisMoment = new Set<string>();
    for (const w of words) {
      if (seenThisMoment.has(w)) continue; // count once per moment
      seenThisMoment.add(w);
      wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
    }
    const d = new Date(m.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }

  const top = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

  // Last 12 months, oldest first.
  const months: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      count: monthCounts.get(key) ?? 0,
    });
  }

  return {
    total: moments.length,
    photos,
    voiceNotes,
    places: placeCounts.size,
    people: peopleCounts.size,
    topPlaces: top(placeCounts),
    topPeople: top(peopleCounts),
    topWords: top(wordCounts).map(({ name, count }) => ({ word: name, count })),
    months,
    firstDate: moments.length > 0 ? moments[moments.length - 1].createdAt : null,
  };
}

function Kicker({ children, theme }: { children: string; theme: Theme }) {
  return (
    <View style={styles.kickerRow}>
      <View style={[styles.kickerLine, { backgroundColor: theme.separator }]} />
      <Text style={[styles.kicker, { color: theme.secondaryText }]}>
        {children}
      </Text>
      <View style={[styles.kickerLine, { backgroundColor: theme.separator }]} />
    </View>
  );
}

function BigNumber({
  value,
  label,
  theme,
}: {
  value: number;
  label: string;
  theme: Theme;
}) {
  return (
    <View style={styles.bigNumber}>
      <Text
        style={[styles.bigValue, { color: theme.text, fontFamily: theme.serif }]}
      >
        {value}
      </Text>
      <Text style={[styles.bigLabel, { color: theme.secondaryText }]}>
        {label}
      </Text>
    </View>
  );
}

function RankRow({
  rank,
  name,
  count,
  unit,
  theme,
}: {
  rank: number;
  name: string;
  count: number;
  unit: string;
  theme: Theme;
}) {
  return (
    <View style={styles.rankRow}>
      <Text
        style={[styles.rankNum, { color: theme.secondaryText, fontFamily: theme.serif }]}
      >
        {rank}
      </Text>
      <Text style={[styles.rankName, { color: theme.text }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.rankCount, { color: theme.secondaryText }]}>
        {count} {unit}
      </Text>
    </View>
  );
}

export default function StatsScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);

  useEffect(() => {
    loadMoments().then(setMoments);
  }, []);

  const stats = useMemo(() => computeStats(moments), [moments]);
  const observations = useMemo(() => computeObservations(moments), [moments]);
  const maxMonth = Math.max(1, ...stats.months.map((m) => m.count));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <View style={styles.back} />
        <Text
          style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}
        >
          Your life in LY
        </Text>
        <Pressable
          onPress={() => router.push('/wrapped')}
          hitSlop={12}
          style={styles.wrapped}
        >
          <Text style={[styles.wrappedText, { color: theme.text }]}>Wrapped</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {stats.firstDate ? (
          <Text style={[styles.since, { color: theme.secondaryText }]}>
            Keeping moments since{' '}
            {new Date(stats.firstDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        ) : null}

        <Kicker theme={theme}>Totals</Kicker>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.bigRow}>
            <BigNumber value={stats.total} label="moments" theme={theme} />
            <BigNumber value={stats.photos} label="photos" theme={theme} />
            <BigNumber value={stats.voiceNotes} label="voice notes" theme={theme} />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.separator }]} />
          <View style={styles.bigRow}>
            <BigNumber value={stats.places} label="places" theme={theme} />
            <BigNumber value={stats.people} label="people" theme={theme} />
          </View>
        </View>

        {observations.length > 0 ? (
          <>
            <Kicker theme={theme}>Observations</Kicker>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              {observations.map((o, i) => (
                <View key={i}>
                  <Text
                    style={[
                      styles.obsTitle,
                      { color: theme.text, fontFamily: theme.serif },
                    ]}
                  >
                    {o.title}
                  </Text>
                  <Text style={[styles.obsSub, { color: theme.secondaryText }]}>
                    {o.sub}
                  </Text>
                  {i < observations.length - 1 ? (
                    <View
                      style={[styles.obsDivider, { backgroundColor: theme.separator }]}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Kicker theme={theme}>Activity</Kicker>        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.bars}>
            {stats.months.map((m) => (
              <View key={m.label} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: theme.text,
                        height: `${Math.max(4, (m.count / maxMonth) * 100)}%`,
                        opacity: m.count > 0 ? 1 : 0.15,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: theme.secondaryText }]}>
                  {m.label[0]}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.barCaption, { color: theme.secondaryText }]}>
            Moments per month, last 12 months
          </Text>
        </View>

        {stats.topPlaces.length > 0 ? (
          <>
            <Kicker theme={theme}>Most remembered places</Kicker>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              {stats.topPlaces.map((p, i) => (
                <RankRow
                  key={p.name}
                  rank={i + 1}
                  name={p.name}
                  count={p.count}
                  unit={p.count === 1 ? 'moment' : 'moments'}
                  theme={theme}
                />
              ))}
            </View>
          </>
        ) : null}

        {stats.topPeople.length > 0 ? (
          <>
            <Kicker theme={theme}>Most mentioned people</Kicker>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              {stats.topPeople.map((p, i) => (
                <RankRow
                  key={p.name}
                  rank={i + 1}
                  name={p.name}
                  count={p.count}
                  unit={p.count === 1 ? 'mention' : 'mentions'}
                  theme={theme}
                />
              ))}
            </View>
          </>
        ) : null}

        {stats.topWords.length > 0 ? (
          <>
            <Kicker theme={theme}>Patterns</Kicker>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.patternsLede, { color: theme.secondaryText }]}>
                Words that keep showing up in your moments
              </Text>
              <View style={styles.wordCloud}>
                {stats.topWords.map((w) => (
                  <View
                    key={w.word}
                    style={[styles.wordPill, { borderColor: theme.separator }]}
                  >
                    <Text style={[styles.wordText, { color: theme.text }]}>
                      {w.word}
                    </Text>
                    <Text
                      style={[styles.wordCount, { color: theme.secondaryText }]}
                    >
                      ×{w.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {stats.total === 0 ? (
          <Text style={[styles.emptyNote, { color: theme.secondaryText }]}>
            Save your first moment and your statistics will grow here.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { width: 60, height: 44 },
  title: { fontSize: 24, letterSpacing: 0.3 },
  wrapped: {
    minWidth: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrappedText: { fontSize: 15, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 48 },
  since: {
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  kickerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  kicker: { fontSize: 12, letterSpacing: 2.5, textTransform: 'uppercase' },
  card: {
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  bigRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  bigNumber: { alignItems: 'center', minWidth: 80 },
  bigValue: { fontSize: 38, lineHeight: 44 },
  bigLabel: {
    marginTop: 4,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 8,
  },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barTrack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barFill: { width: 10, borderRadius: 5, minHeight: 4 },
  barLabel: { marginTop: 8, fontSize: 10, letterSpacing: 1 },
  barCaption: {
    marginTop: 12,
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 14,
  },
  rankNum: { fontSize: 20, width: 24, textAlign: 'center' },
  rankName: { flex: 1, fontSize: 16, letterSpacing: 0.2 },
  rankCount: { fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  patternsLede: {
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: 14,
    textAlign: 'center',
  },
  wordCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  wordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  wordText: { fontSize: 15, letterSpacing: 0.2 },
  wordCount: { fontSize: 12, letterSpacing: 0.5 },
  obsTitle: {
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  obsSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.2,
  },
  obsDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  emptyNote: {
    marginTop: 32,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
