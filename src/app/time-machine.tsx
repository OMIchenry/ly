import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import { MomentCard, formatDate } from '../components/MomentCard';
import type { Theme } from '../theme';
import type { Moment } from '../types';

const JUMPS = [
  { label: '1 mo ago', months: 1 },
  { label: '6 mo ago', months: 6 },
  { label: '1 yr ago', months: 12 },
  { label: '3 yrs ago', months: 36 },
];

function targetYearMonth(monthsAgo: number): { year: number; month: number } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export default function TimeMachineScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [jump, setJump] = useState(1);
  const [offset, setOffset] = useState(0); // extra months back/forward from jump

  useFocusEffect(
    useCallback(() => {
      loadMoments().then(setMoments);
    }, []),
  );

  const { year, month } = useMemo(
    () => targetYearMonth(jump + offset),
    [jump, offset],
  );

  const inMonth = useMemo(() => {
    const list = moments.filter((m) => {
      const d = new Date(m.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return list;
  }, [moments, year, month]);

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const canGoForward = jump + offset > 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}>
          Time machine
        </Text>
        <View style={styles.back} />
      </View>

      <View style={styles.jumps}>
        {JUMPS.map((j) => {
          const active = jump === j.months && offset === 0;
          return (
            <Pressable
              key={j.months}
              onPress={() => {
                setJump(j.months);
                setOffset(0);
              }}
              style={[
                styles.jump,
                {
                  backgroundColor: active ? theme.text : 'transparent',
                  borderColor: theme.separator,
                },
              ]}
            >
              <Text
                style={[
                  styles.jumpText,
                  { color: active ? theme.onText : theme.secondaryText },
                ]}
              >
                {j.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.monthNav}>
        <Pressable
          onPress={() => setOffset((o) => o + 1)}
          hitSlop={12}
          style={styles.navArrow}
        >
          <Text style={[styles.navArrowText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <View style={styles.monthTitleWrap}>
          <Text
            style={[
              styles.monthTitle,
              { color: theme.text, fontFamily: theme.serif },
            ]}
          >
            {monthLabel}
          </Text>
          <Text style={[styles.monthCount, { color: theme.secondaryText }]}>
            {inMonth.length === 0
              ? 'No moments this month'
              : `${inMonth.length} ${inMonth.length === 1 ? 'moment' : 'moments'}`}
          </Text>
        </View>
        <Pressable
          onPress={() => canGoForward && setOffset((o) => o - 1)}
          hitSlop={12}
          style={[styles.navArrow, { opacity: canGoForward ? 1 : 0.25 }]}
        >
          <Text style={[styles.navArrowText, { color: theme.text }]}>›</Text>
        </Pressable>
      </View>
      <View style={[styles.hairline, { backgroundColor: theme.separator }]} />

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {inMonth.length === 0 ? (
          <Text style={[styles.emptyNote, { color: theme.secondaryText }]}>
            Nothing kept in {monthLabel}.{'\n'}
            {jump + offset <= 1
              ? 'Your archive starts here — save something today.'
              : 'Try another month.'}
          </Text>
        ) : (
          inMonth.map((m) => (
            <Pressable key={m.id} onPress={() => router.push(`/moment/${m.id}`)}>
              <MomentCard moment={m} theme={theme} />
            </Pressable>
          ))
        )}
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
  jumps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  jump: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  jumpText: { fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navArrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navArrowText: { fontSize: 28, fontWeight: '300' },
  monthTitleWrap: { alignItems: 'center' },
  monthTitle: { fontSize: 30, letterSpacing: 0.3 },
  monthCount: {
    marginTop: 4,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  hairline: { height: StyleSheet.hairlineWidth, marginHorizontal: 24, marginTop: 8 },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, gap: 20 },
  emptyNote: {
    marginTop: 48,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
