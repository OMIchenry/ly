// LY Wrapped: a vertical snap-scroll story of your year.
// Year selector for every year with data; all computed on-device.

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import type { Theme } from '../theme';
import type { Moment } from '../types';
import { computeWrapped, wrappedYears, type WrappedData } from '../wrapped';import { displayTitle } from '../titles';

const { height: SCREEN_H } = Dimensions.get('window');
const PAGE_H = SCREEN_H - 140;

function fmt(dateISO: string): string {
  const d = new Date(dateISO);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function Page({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  return <View style={[styles.page, { height: PAGE_H }]}>{children}</View>;
}

function Kicker({ theme, children }: { theme: Theme; children: string }) {
  return (
    <Text style={[styles.kicker, { color: theme.secondaryText }]}>{children}</Text>
  );
}

function BigNumber({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <Text style={[styles.bigNumber, { color: theme.text, fontFamily: theme.serif }]}>
      {children}
    </Text>
  );
}

function RankedList({
  theme,
  rows,
}: {
  theme: Theme;
  rows: { name: string; count: number }[];
}) {
  if (rows.length === 0) {
    return (
      <Text style={[styles.emptyRow, { color: theme.secondaryText }]}>
        Nothing here yet.
      </Text>
    );
  }
  return (
    <View style={styles.rows}>
      {rows.slice(0, 5).map((r, i) => (
        <View key={`${r.name}-${i}`} style={styles.row}>
          <Text
            style={[styles.rank, { color: theme.secondaryText }]}
          >{`${i + 1}`}</Text>
          <Text
            style={[styles.rowName, { color: theme.text, fontFamily: theme.serif }]}
            numberOfLines={1}
          >
            {r.name}
          </Text>
          <Text style={[styles.rowCount, { color: theme.secondaryText }]}>
            {r.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function WrappedScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const pager = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const loaded = await loadMoments();
        setMoments(loaded);
        setYear((y) => {
          if (y !== null) return y;
          const all = wrappedYears(loaded);
          return all[0] ?? new Date().getFullYear();
        });
      })();
    }, []),
  );

  const years = useMemo(() => wrappedYears(moments), [moments]);
  const wrapped: WrappedData | null = useMemo(
    () => (year === null ? null : computeWrapped(moments, year)),
    [moments, year],
  );
  const favCount = useMemo(
    () =>
      year === null
        ? 0
        : moments.filter(
            (m) => m.favorite && new Date(m.createdAt).getFullYear() === year,
          ).length,
    [moments, year],
  );

  const maxMonth = Math.max(1, ...(wrapped?.months.map((m) => m.count) ?? [1]));

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    setPage(Math.round(y / PAGE_H));
  }

  function pickYear(y: number) {
    setYear(y);
    setPage(0);
    pager.current?.scrollTo({ y: 0, animated: false });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}>
          Wrapped
        </Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.years}
      >
        {years.map((y) => (
          <Pressable
            key={y}
            onPress={() => pickYear(y)}
            style={[
              styles.yearChip,
              {
                borderColor: theme.separator,
                backgroundColor: y === year ? theme.text : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.yearChipText,
                { color: y === year ? theme.onText : theme.secondaryText },
              ]}
            >
              {y}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {!wrapped || wrapped.total === 0 ? (
        <View style={[styles.page, { height: PAGE_H }]}>
          <Kicker theme={theme}>No memories yet</Kicker>
          <Text
            style={[styles.bigNumber, { color: theme.text, fontFamily: theme.serif }]}
          >
            {year ?? ''}
          </Text>
          <Text style={[styles.sub, { color: theme.secondaryText }]}>
            Save a moment and your Wrapped will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={pager}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
        >
          <Page theme={theme}>
            <Kicker theme={theme}>Your year in moments</Kicker>
            <BigNumber theme={theme}>{year}</BigNumber>
            <Text style={[styles.sub, { color: theme.secondaryText }]}>
              {wrapped.total} {wrapped.total === 1 ? 'moment' : 'moments'} kept.
              Swipe up for the story.
            </Text>
          </Page>

          <Page theme={theme}>
            <Kicker theme={theme}>The totals</Kicker>
            <BigNumber theme={theme}>{wrapped.total}</BigNumber>
            <Text style={[styles.sub, { color: theme.secondaryText }]}>
              {wrapped.photos} photos · {wrapped.voiceNotes} voice notes
            </Text>
            <Text style={[styles.sub, { color: theme.secondaryText }]}>
              {favCount > 0
                ? `${favCount} favorited`
                : 'None favorited yet'}
            </Text>
          </Page>

          <Page theme={theme}>
            <Kicker theme={theme}>The rhythm</Kicker>
            <Text
              style={[styles.sub, { color: theme.text, fontFamily: theme.serif }]}
            >
              Moments by month
            </Text>
            <View style={styles.bars}>
              {wrapped.months.map((m, i) => (
                <View key={m.short} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: theme.text,
                          height: `${Math.max(4, (m.count / maxMonth) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: theme.secondaryText }]}>
                    {m.short}
                  </Text>
                </View>
              ))}
            </View>
          </Page>

          <Page theme={theme}>
            <Kicker theme={theme}>The people</Kicker>
            <RankedList theme={theme} rows={wrapped.topPeople} />
          </Page>

          <Page theme={theme}>
            <Kicker theme={theme}>The places</Kicker>
            <RankedList theme={theme} rows={wrapped.topPlaces} />
          </Page>

          <Page theme={theme}>
            <Kicker theme={theme}>The words</Kicker>
            <View style={styles.words}>
              {wrapped.topWords.slice(0, 6).map((w, i) => (
                <Text
                  key={`${w.word}-${i}`}
                  style={[
                    styles.word,
                    { color: theme.text, fontFamily: theme.serif },
                    { fontSize: 34 - i * 3 },
                  ]}
                >
                  {w.word}
                </Text>
              ))}
            </View>
          </Page>

          <Page theme={theme}>
            <Kicker theme={theme}>The streak</Kicker>
            <BigNumber theme={theme}>{wrapped.longestStreak}</BigNumber>
            <Text style={[styles.sub, { color: theme.secondaryText }]}>
              {wrapped.longestStreak === 1 ? 'day' : 'days'} in a row at your best
            </Text>
          </Page>

          <Page theme={theme}>
            <Kicker theme={theme}>First & latest</Kicker>
            {wrapped.firstMoment ? (
              <View style={styles.bookend}>
                <Text style={[styles.bookendLabel, { color: theme.secondaryText }]}>
                  IT STARTED · {fmt(wrapped.firstMoment.createdAt).toUpperCase()}
                </Text>
                <Text
                  style={[styles.bookendTitle, { color: theme.text, fontFamily: theme.serif }]}
                  numberOfLines={3}
                >
                  {displayTitle(wrapped.firstMoment)}
                </Text>
              </View>
            ) : null}
            {wrapped.latestMoment ? (
              <View style={styles.bookend}>
                <Text style={[styles.bookendLabel, { color: theme.secondaryText }]}>
                  MOST RECENT · {fmt(wrapped.latestMoment.createdAt).toUpperCase()}
                </Text>
                <Text
                  style={[styles.bookendTitle, { color: theme.text, fontFamily: theme.serif }]}
                  numberOfLines={3}
                >
                  {displayTitle(wrapped.latestMoment)}
                </Text>
              </View>
            ) : null}
            {wrapped.firstPhoto ? (
              <Text style={[styles.sub, { color: theme.secondaryText }]}>
                First photo · {fmt(wrapped.firstPhoto.createdAt)}
              </Text>
            ) : null}
          </Page>
        </ScrollView>
      )}

      <View style={styles.dots}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === page ? theme.text : theme.separator,
              },
            ]}
          />
        ))}
      </View>
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
  back: {
    minWidth: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 30, fontWeight: '300', marginTop: -2 },
  title: { fontSize: 24, letterSpacing: 0.3 },
  years: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  yearChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  yearChipText: { fontSize: 15, fontWeight: '600' },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  bigNumber: {
    fontSize: 92,
    letterSpacing: 1,
    lineHeight: 100,
  },
  sub: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 28,
    height: 150,
  },
  barCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    height: 150,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 11,
    letterSpacing: 1,
  },
  rows: { width: '100%', marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 10,
    gap: 14,
  },
  rank: { fontSize: 13, width: 20, letterSpacing: 1 },
  rowName: { fontSize: 22, flex: 1, letterSpacing: 0.2 },
  rowCount: { fontSize: 14, letterSpacing: 1 },
  emptyRow: { fontSize: 15, fontStyle: 'italic' },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 8,
  },
  word: { letterSpacing: 0.3 },
  bookend: { marginTop: 20, alignItems: 'center', maxWidth: '100%' },
  bookendLabel: { fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  bookendTitle: { fontSize: 24, lineHeight: 32, textAlign: 'center' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});
