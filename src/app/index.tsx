import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import { MomentCard } from '../components/MomentCard';
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

function EmptyState({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        No Moments Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
        Tap + to capture a small moment{'\n'}worth keeping.
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);

  // Reload every time the screen comes into focus (e.g. after saving).
  useFocusEffect(
    useCallback(() => {
      loadMoments().then(setMoments);
    }, []),
  );

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

      <FlatList
        data={moments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MomentCard moment={item} theme={theme} />}
        contentContainerStyle={
          moments.length === 0 ? styles.listEmpty : styles.list
        }
        ListEmptyComponent={<EmptyState theme={theme} />}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.blue, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={() => router.push('/new')}
        accessibilityLabel="Create a moment"
      >
        <Text style={styles.fabPlus}>+</Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  // iOS large-title style.
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  count: {
    marginTop: 2,
    fontSize: 15,
  },
  calendarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 14,
  },
  listEmpty: {
    flex: 1,
    paddingHorizontal: 20,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 44,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPlus: {
    fontSize: 32,
    lineHeight: 34,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
});
