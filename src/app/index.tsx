import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { loadMoments } from '../storage';
import { useTheme, type Theme } from '../theme';
import type { Moment } from '../types';

// Photos-style relative date: "Today", "Yesterday", otherwise "Sep 21, 2026".
function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const days = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MomentCard({ moment, theme }: { moment: Moment; theme: Theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      {moment.photoUri ? (
        <Image source={{ uri: moment.photoUri }} style={styles.photo} />
      ) : null}
      <View style={styles.cardBody}>
        <Text style={[styles.cardText, { color: theme.text }]}>
          {moment.text}
        </Text>
        <Text style={[styles.cardDate, { color: theme.secondaryText }]}>
          {formatDate(moment.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function EmptyState({ theme }: { theme: Theme }) {
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
        <Text style={[styles.title, { color: theme.text }]}>LY</Text>
        {moments.length > 0 ? (
          <Text style={[styles.count, { color: theme.secondaryText }]}>
            {moments.length} {moments.length === 1 ? 'moment' : 'moments'}
          </Text>
        ) : null}
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 14,
  },
  listEmpty: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  cardText: {
    fontSize: 17,
    lineHeight: 24,
  },
  cardDate: {
    marginTop: 8,
    fontSize: 13,
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
