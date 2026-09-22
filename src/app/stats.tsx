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
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import type { Theme } from '../theme';
import type { Moment } from '../types';

interface Stats {
  total: number;
  photos: number;
  voiceNotes: number;
  places: number;
  people: number;
  topPlaces: { name: string; count: number }[];
  topPeople: { name: string; count: number }[];
  months: { label: string; count: number }[];
  firstDate: string | null;
}

function computeStats(moments: Moment[]): Stats {
  const placeCounts = new Map<string, number>();
  const peopleCounts = new Map<string, number>();
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
  const maxMonth = Math.max(1, ...stats.months.map((m) => m.count));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text
          style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}
        >
          Your life in LY
        </Text>
        <View style={styles.back} />
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

        <Kicker theme={theme}>Activity</Kicker>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
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
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 30, fontWeight: '300', marginTop: -2 },
  title: { fontSize: 24, letterSpacing: 0.3 },
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
  emptyNote: {
    marginTop: 32,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
