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
          <Text style={[styles.back, { color: theme.blue }]}>‹ Moments</Text>
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
            <Chevron direction="left" color={theme.blue} />
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
            <Chevron direction="right" color={theme.blue} />
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
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: theme.text },
                      !inMonth && { color: theme.secondaryText, opacity: 0.35 },
                      isToday && !isSelected && { color: theme.blue, fontWeight: '600' },
                      isSelected && { color: theme.background, fontWeight: '600' },
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
                            ? theme.background
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
          <Text style={[styles.dayTitle, { color: theme.text }]}>
            {fullDayTitle(selected)}
          </Text>
          {selectedMoments.length > 0 ? (
            <Text style={[styles.dayCount, { color: theme.secondaryText }]}>
              {selectedMoments.length}{' '}
              {selectedMoments.length === 1 ? 'moment' : 'moments'}
            </Text>
          ) : null}
        </View>

        {selectedMoments.length === 0 ? (
          <Text style={[styles.noMoments, { color: theme.secondaryText }]}>
            Nothing saved this day.
          </Text>
        ) : (
          <View style={styles.momentList}>
            {selectedMoments.map((m) => (
              <MomentCard key={m.id} moment={m} theme={theme} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navSide: { minWidth: 80 },
  back: { fontSize: 17 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  monthButton: {
    width: 44,
    alignItems: 'center',
  },
  chevron: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '300',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  weekRow: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 8,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  daySection: {
    marginTop: 20,
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  dayCount: {
    marginTop: 2,
    fontSize: 14,
  },
  noMoments: {
    fontSize: 15,
    paddingVertical: 8,
  },
  momentList: {
    gap: 14,
  },
});
