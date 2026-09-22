// People: everyone tagged in your moments —
// mention count, most recent moment, and a cover photo.
// Tap for their timeline.

import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
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
import { formatDate } from '../components/MomentCard';

interface PersonEntry {
  name: string;
  count: number;
  lastSeen: string;
  cover: string | null;
}

function aggregatePeople(moments: Moment[]): PersonEntry[] {
  const map = new Map<string, Moment[]>();
  for (const m of moments) {
    for (const raw of m.people ?? []) {
      const name = raw.trim();
      if (!name) continue;
      const list = map.get(name) ?? [];
      list.push(m);
      map.set(name, list);
    }
  }
  return Array.from(map.entries())
    .map(([name, list]) => ({
      name,
      count: list.length,
      lastSeen: list[0].createdAt, // moments are newest-first
      cover: list.find((m) => m.photoUri)?.photoUri ?? null,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function PersonCard({ person, theme }: { person: PersonEntry; theme: Theme }) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/filtered',
          params: { kind: 'person', title: person.name, value: person.name },
        })
      }
      style={[styles.card, { backgroundColor: theme.card }]}
      accessibilityLabel={person.name}
    >
      {person.cover ? (
        <Image source={{ uri: person.cover }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: theme.well }]}>
          <Text
            style={[
              styles.avatarInitial,
              { color: theme.text, fontFamily: theme.serif },
            ]}
          >
            {initial(person.name)}
          </Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {person.name}
        </Text>
        <Text style={[styles.meta, { color: theme.secondaryText }]}>
          {person.count} {person.count === 1 ? 'moment' : 'moments'} · last{' '}
          {formatDate(person.lastSeen).toLowerCase()}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: theme.secondaryText }]}>›</Text>
    </Pressable>
  );
}

export default function PeopleScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMoments().then(setMoments);
    }, []),
  );

  const people = useMemo(() => aggregatePeople(moments), [moments]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}>
          People
        </Text>
        <View style={styles.back} />
      </View>
      <FlatList
        data={people}
        keyExtractor={(p) => p.name}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No people yet
            </Text>
            <Text style={[styles.emptySub, { color: theme.secondaryText }]}>
              Tag who was there when you save a moment — “who was here” —
              and they will gather here.
            </Text>
          </View>
        }
        renderItem={({ item }) => <PersonCard person={item} theme={theme} />}
      />
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
  list: { paddingHorizontal: 20, paddingBottom: 48, gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 26,
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
  },
  name: {
    fontSize: 18,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    paddingRight: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptySub: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
