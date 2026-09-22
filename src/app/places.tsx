// Places: every location stamped on your moments —
// visit count, last visit, and a cover photo. Tap for the timeline.

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

interface PlaceEntry {
  name: string;
  count: number;
  lastVisit: string;
  cover: string | null;
}

function aggregatePlaces(moments: Moment[]): PlaceEntry[] {
  const map = new Map<string, Moment[]>();
  for (const m of moments) {
    const name = (m.locationName ?? '').trim();
    if (!name) continue;
    const list = map.get(name) ?? [];
    list.push(m);
    map.set(name, list);
  }
  return Array.from(map.entries())
    .map(([name, list]) => ({
      name,
      count: list.length,
      lastVisit: list[0].createdAt, // moments are newest-first
      cover: list.find((m) => m.photoUri)?.photoUri ?? null,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function PlaceCard({ place, theme }: { place: PlaceEntry; theme: Theme }) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/filtered',
          params: { kind: 'place', title: place.name, value: place.name },
        })
      }
      style={[styles.card, { backgroundColor: theme.card }]}
      accessibilityLabel={place.name}
    >
      {place.cover ? (
        <Image source={{ uri: place.cover }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverEmpty, { backgroundColor: theme.well }]}>
          <Text style={[styles.coverGlyph, { color: theme.secondaryText }]}>
            ⌖
          </Text>
        </View>
      )}
      <View style={styles.body}>
        <Text
          style={[styles.name, { color: theme.text, fontFamily: theme.serif }]}
          numberOfLines={1}
        >
          {place.name}
        </Text>
        <Text style={[styles.meta, { color: theme.secondaryText }]}>
          {place.count} {place.count === 1 ? 'visit' : 'visits'} · last{' '}
          {formatDate(place.lastVisit).toLowerCase()}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: theme.secondaryText }]}>›</Text>
    </Pressable>
  );
}

export default function PlacesScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMoments().then(setMoments);
    }, []),
  );

  const places = useMemo(() => aggregatePlaces(moments), [moments]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}>
          Places
        </Text>
        <View style={styles.back} />
      </View>
      <FlatList
        data={places}
        keyExtractor={(p) => p.name}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No places yet
            </Text>
            <Text style={[styles.emptySub, { color: theme.secondaryText }]}>
              Moments saved with location on will map out your world here.
            </Text>
          </View>
        }
        renderItem={({ item }) => <PlaceCard place={item} theme={theme} />}
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cover: {
    width: 92,
    height: 92,
  },
  coverEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverGlyph: {
    fontSize: 30,
    fontWeight: '300',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  name: {
    fontSize: 19,
    letterSpacing: 0.2,
  },
  meta: {
    marginTop: 5,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    paddingRight: 16,
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
