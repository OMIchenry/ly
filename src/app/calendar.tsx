import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import { MomentCard } from '../components/MomentCard';
import {
  WEEKDAYS,
  addMonths,
  dayKey,
  fullDayTitle,
  getMonthCells,
  isSameDay,
  monthTitle,
} from '../calendar';
import type { Moment } from '../types';

function Chevron({ direction, color }: { direction: 'left' | 'right'; color: string }) {
  return (
    <Text style={[styles.chevron, { color }]}>
      {direction === 'left' ? '‹' : '›'}
    </Text>
  );
}

export default function CalendarScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);

  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<Date>(now);

  useFocusEffect(
    useCallback(() => {
      loadMoments().then(setMoments);
    }, []),
  );

  // Days that have at least one moment, for the dots.
  const activeDays = useMemo(() => {
    const set = new Set<string>();
    for (const m of moments) set.add(dayKey(new Date(m.createdAt)));
    return set;
  }, [moments]);

  const cells = useMemo(
    () => getMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const selectedMoments = useMemo(
    () => moments.filter((m) => isSameDay(new Date(m.createdAt), selected)),
    [moments, selected],
  );

  function shiftMonth(delta: number) {
    const next = addMonths(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />

      {/* iOS-style nav bar */}
      <View
        style={[
          styles.navBar,
          { borderBottomColor: theme.separator, backgroundColor: theme.background },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.navSide}>
          <Text style={[styles.back, { color: theme.text }]}>‹ Moments</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>Calendar</Text>
        <View style={styles.navSide} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Month pager */}
        <View style={styles.monthRow}>
          <Pressable
            onPress={() => shiftMonth(-1)}
            hitSlop={16}
            style={styles.monthButton}
            accessibilityLabel="Previous month"
          >
            <Chevron direction="left" color={theme.text} />
          </Pressable>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {monthTitle(viewYear, viewMonth)}
          </Text>
          <Pressable
            onPress={() => shiftMonth(1)}
            hitSlop={16}
            style={styles.monthButton}
            accessibilityLabel="Next month"
          >
            <Chevron direction="right" color={theme.text} />
          </Pressable>
        </View>

        {/* Weekday header */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map((d, i) => (
            <Text
              key={i}
              style={[styles.weekday, { color: theme.secondaryText }]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.grid}>
          {cells.map((date) => {
            const inMonth = date.getMonth() === viewMonth;
            const isSelected = isSameDay(date, selected);
            const isToday = isSameDay(date, now);
            const hasMoments = activeDays.has(dayKey(date));
            return (
              <Pressable
                key={dayKey(date) + date.getMonth()}
                onPress={() => setSelected(date)}
                style={styles.cell}
                accessibilityLabel={fullDayTitle(date)}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && { backgroundColor: theme.text },
                    isToday && !isSelected && { borderColor: theme.text, borderWidth: 1.2 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: theme.text },
                      !inMonth && { color: theme.secondaryText, opacity: 0.35 },
                      isSelected && { color: theme.onText, fontWeight: '600' },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
                <View style={styles.dotSlot}>
                  {hasMoments ? (
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isSelected
                            ? theme.onText
                            : theme.secondaryText,
                        },
                      ]}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Selected day's moments */}
        <View style={styles.daySection}>
          <Text style={[styles.dayKicker, { color: theme.secondaryText }]}>
            {selectedMoments.length}{' '}
            {selectedMoments.length === 1 ? 'moment' : 'moments'}
          </Text>
          <Text style={[styles.dayTitle, { color: theme.text }]}>
            {fullDayTitle(selected)}
          </Text>
        </View>

        {selectedMoments.length === 0 ? (
          <Text style={[styles.noMoments, { color: theme.secondaryText }]}>
            Nothing saved this day.
          </Text>
        ) : (
          <View style={styles.momentList}>
            {selectedMoments.map((m) => (
              <Pressable key={m.id} onPress={() => router.push(`/moment/${m.id}`)}>
                <MomentCard moment={m} theme={theme} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navSide: { minWidth: 80 },
  back: { fontSize: 17 },
  navTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  monthButton: {
    width: 44,
    alignItems: 'center',
  },
  chevron: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '200',
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  weekRow: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 10,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 17,
  },
  dotSlot: {
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  daySection: {
    marginTop: 28,
    marginBottom: 16,
  },
  dayKicker: {
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  noMoments: {
    fontSize: 15,
    paddingVertical: 8,
  },
  momentList: {
    gap: 20,
  },
});
