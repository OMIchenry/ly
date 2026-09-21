import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import { MomentCard } from '../components/MomentCard';
import { Egg } from '../components/Egg';
import { currentStreak, eggCaption, eggStage } from '../streak';
import type { Theme } from '../theme';
import type { Moment } from '../types';

// Minimal line-style calendar glyph drawn with views (no icon font needed).
function CalendarGlyph({ color }: { color: string }) {
  return (
    <View style={[glyphStyles.box, { borderColor: color }]}>
      <View style={[glyphStyles.binder, { backgroundColor: color }]} />
      <View style={[glyphStyles.binder, glyphStyles.binderRight, { backgroundColor: color }]} />
      <View style={[glyphStyles.rule, { backgroundColor: color }]} />
      <View style={glyphStyles.dots}>
        <View style={[glyphStyles.dot, { backgroundColor: color }]} />
        <View style={[glyphStyles.dot, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const glyphStyles = StyleSheet.create({
  box: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 1.7,
    alignItems: 'center',
  },
  binder: {
    position: 'absolute',
    top: -5,
    left: 4,
    width: 3,
    height: 7,
    borderRadius: 1.5,
  },
  binderRight: {
    left: undefined,
    right: 4,
  },
  rule: {
    marginTop: 6,
    width: '100%',
    height: 1.7,
    opacity: 0.85,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4.5,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});

function StreakEgg({ moments, theme }: { moments: Moment[]; theme: Theme }) {
  const streak = currentStreak(moments);
  return (
    <View style={[styles.eggCard, { backgroundColor: theme.card }]}>
      <Egg stage={eggStage(streak)} color={theme.text} soft={theme.card} size={58} />
      <View style={styles.eggText}>
        <Text style={[styles.eggCount, { color: theme.text }]}>
          {streak} {streak === 1 ? 'day' : 'days'}
        </Text>
        <Text style={[styles.eggCaption, { color: theme.secondaryText }]}>
          {eggCaption(streak)}
        </Text>
      </View>
    </View>
  );
}

function OnThisDay({
  moments,
  theme,
}: {
  moments: Moment[];
  theme: Theme;
}) {
  if (moments.length === 0) return null;
  return (
    <View style={styles.onThisDay}>
      <Text style={[styles.sectionKicker, { color: theme.secondaryText }]}>
        On this day
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.onThisDayRow}
      >
        {moments.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.memoryChip, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/moment/${m.id}`)}
          >
            <Text style={[styles.memoryYear, { color: theme.text }]}>
              {new Date(m.createdAt).getFullYear()}
            </Text>
            <Text
              style={[styles.memoryText, { color: theme.secondaryText }]}
              numberOfLines={3}
            >
              {m.text}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function EmptyState({ theme, searching }: { theme: Theme; searching: boolean }) {
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyKicker, { color: theme.secondaryText }]}>
        {searching ? 'No matches' : 'Begin anywhere'}
      </Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {searching ? 'Nothing found' : 'No moments yet'}
      </Text>
      {!searching ? (
        <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
          Tap + to keep a small moment{'\n'}before it fades.
        </Text>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [query, setQuery] = useState('');

  // Reload every time the screen comes into focus (e.g. after saving).
  useFocusEffect(
    useCallback(() => {
      loadMoments().then(setMoments);
    }, []),
  );

  const searching = query.trim().length > 0;

  const visibleMoments = useMemo(() => {
    if (!searching) return moments;
    const q = query.trim().toLowerCase();
    return moments.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        (m.locationName ?? '').toLowerCase().includes(q),
    );
  }, [moments, query, searching]);

  // Same month/day as today, from previous years — newest year first.
  const onThisDay = useMemo(() => {
    const now = new Date();
    return moments
      .filter((m) => {
        const d = new Date(m.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate() &&
          d.getFullYear() < now.getFullYear()
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [moments]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>LY</Text>
          {moments.length > 0 ? (
            <Text style={[styles.count, { color: theme.secondaryText }]}>
              {moments.length} {moments.length === 1 ? 'moment' : 'moments'}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push('/calendar')}
          hitSlop={12}
          style={styles.calendarButton}
          accessibilityLabel="Open calendar"
        >
          <CalendarGlyph color={theme.text} />
        </Pressable>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: theme.well }]}>
        <TextInput
          style={[styles.search, { color: theme.text }]}
          placeholder="Search moments"
          placeholderTextColor={theme.secondaryText}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={visibleMoments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/moment/${item.id}`)}>
            <MomentCard moment={item} theme={theme} />
          </Pressable>
        )}
        contentContainerStyle={
          visibleMoments.length === 0 ? styles.listEmpty : styles.list
        }
        ListHeaderComponent={
          searching ? null : (
            <>
              <StreakEgg moments={moments} theme={theme} />
              <OnThisDay moments={onThisDay} theme={theme} />
              {moments.length > 0 ? (
                <Text style={[styles.sectionKicker, { color: theme.secondaryText }]}>
                  All moments
                </Text>
              ) : null}
            </>
          )
        }
        ListEmptyComponent={<EmptyState theme={theme} searching={searching} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.text, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={() => router.push('/new')}
        accessibilityLabel="Create a moment"
      >
        <Text style={[styles.fabPlus, { color: theme.onText }]}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 10,
  },
  count: {
    marginTop: 6,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  calendarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  search: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 20,
  },
  listEmpty: {
    flex: 1,
    paddingHorizontal: 24,
  },
  eggCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 18,
    marginBottom: 24,
    gap: 18,
  },
  eggText: {
    flex: 1,
  },
  eggCount: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  eggCaption: {
    marginTop: 4,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  onThisDay: {
    marginBottom: 24,
  },
  onThisDayRow: {
    gap: 12,
    paddingRight: 20,
  },
  sectionKicker: {
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  memoryChip: {
    width: 190,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  memoryYear: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  memoryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 90,
  },
  emptyKicker: {
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 28,
    bottom: 48,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  fabPlus: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
    marginTop: -2,
  },
});
