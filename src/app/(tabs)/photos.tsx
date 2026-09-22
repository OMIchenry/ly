// Photos tab: every moment with a photo.
// Grid view for the wall; Grouped view clusters photos by day + place
// into events with auto-titles (heuristic grouping, fully on-device).

import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
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
import { loadMoments } from '../../storage';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';
import type { Moment } from '../../types';
import { dayKey } from '../../calendar';
import { generateTitle } from '../../titles';

const COLUMNS = 3;
const GAP = 3;
const TILE = (Dimensions.get('window').width - 40 - GAP * (COLUMNS - 1)) / COLUMNS;

interface PhotoGroup {
  id: string;
  title: string;
  moments: Moment[];
}

/** Bucket photos by day and rough place — same day + same place = one event. */
function locationBucket(m: Moment): string {
  const place = (m.locationName ?? '').split(',')[0].trim().toLowerCase();
  if (place) return `p:${place}`;
  if (typeof m.latitude === 'number' && typeof m.longitude === 'number') {
    return `g:${m.latitude.toFixed(2)},${m.longitude.toFixed(2)}`;
  }
  return 'g:unknown';
}

function groupPhotos(moments: Moment[]): PhotoGroup[] {
  const withPhotos = moments.filter((m) => m.photoUri);
  const groups: PhotoGroup[] = [];
  let current: Moment[] = [];
  let currentKey = '';
  for (const m of withPhotos) {
    const key = `${dayKey(new Date(m.createdAt))}|${locationBucket(m)}`;
    if (key !== currentKey) {
      if (current.length > 0) {
        groups.push({
          id: current[0].id,
          title: generateTitle(current[0]),
          moments: current,
        });
      }
      current = [];
      currentKey = key;
    }
    current.push(m);
  }
  if (current.length > 0) {
    groups.push({
      id: current[0].id,
      title: generateTitle(current[0]),
      moments: current,
    });
  }
  return groups;
}

function GroupCard({
  group,
  theme,
}: {
  group: PhotoGroup;
  theme: Theme;
}) {
  const ids = group.moments.map((m) => m.id).join(',');
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/filtered',
          params: { kind: 'group', title: group.title, ids },
        })
      }
      style={[styles.groupCard, { backgroundColor: theme.card }]}
      accessibilityLabel={group.title}
    >
      <View style={styles.groupPhotos}>
        {group.moments.slice(0, 3).map((m, i) => (
          <Image
            key={m.id}
            source={{ uri: m.photoUri! }}
            style={[
              styles.groupThumb,
              i > 0 && styles.groupThumbStack,
              { borderColor: theme.card },
            ]}
          />
        ))}
        {group.moments.length > 1 ? (
          <View style={[styles.countBadge, { backgroundColor: theme.text }]}>
            <Text style={[styles.countBadgeText, { color: theme.onText }]}>
              {group.moments.length}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.groupBody}>
        <Text
          style={[styles.groupTitle, { color: theme.text, fontFamily: theme.serif }]}
          numberOfLines={2}
        >
          {group.title}
        </Text>
        <Text style={[styles.groupSub, { color: theme.secondaryText }]}>
          {group.moments.length === 1
            ? '1 photo'
            : `${group.moments.length} photos`}
        </Text>
      </View>
    </Pressable>
  );
}

export default function PhotosScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [view, setView] = useState<'grid' | 'grouped'>('grid');

  useFocusEffect(
    useCallback(() => {
      loadMoments().then(setMoments);
    }, []),
  );

  const withPhotos = useMemo(
    () => moments.filter((m) => m.photoUri),
    [moments],
  );
  const groups = useMemo(() => groupPhotos(moments), [moments]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />

      <View style={styles.navBar}>
        <View style={styles.navSide} />
        <Text style={[styles.navTitle, { color: theme.text, fontFamily: theme.serif }]}>
          Photos
        </Text>
        <Pressable
          onPress={() => router.push('/photo-dump')}
          hitSlop={12}
          style={styles.navSideRight}
        >
          <Text style={[styles.importAction, { color: theme.text }]}>Import</Text>
        </Pressable>
      </View>

      <View style={styles.viewToggle}>
        {(['grid', 'grouped'] as const).map((v) => {
          const active = view === v;
          return (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              style={[
                styles.togglePill,
                {
                  backgroundColor: active ? theme.text : 'transparent',
                  borderColor: theme.separator,
                },
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: active ? theme.onText : theme.secondaryText },
                ]}
              >
                {v === 'grid' ? 'Grid' : 'Grouped'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {view === 'grid' ? (
        <FlatList
          data={withPhotos}
          keyExtractor={(item) => item.id}
          numColumns={COLUMNS}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={
            <Text style={[styles.count, { color: theme.secondaryText }]}>
              {withPhotos.length === 0
                ? ''
                : `${withPhotos.length} ${withPhotos.length === 1 ? 'photo' : 'photos'}`}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No photos yet
              </Text>
              <Text style={[styles.emptySub, { color: theme.secondaryText }]}>
                Moments you save with photos will gather here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/moment/${item.id}`)}
              style={[styles.tile, { backgroundColor: theme.well }]}
              accessibilityLabel="Open moment"
            >
              <Image source={{ uri: item.photoUri! }} style={styles.image} />
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.groupList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.count, { color: theme.secondaryText }]}>
              {groups.length === 0
                ? ''
                : `${groups.length} ${groups.length === 1 ? 'event' : 'events'}`}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No photo events yet
              </Text>
              <Text style={[styles.emptySub, { color: theme.secondaryText }]}>
                Photos taken on the same day in the same place group together
                here.
              </Text>
            </View>
          }
          renderItem={({ item }) => <GroupCard group={item} theme={theme} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  navSide: { minWidth: 80 },
  navSideRight: { minWidth: 80, alignItems: 'flex-end' },
  navTitle: {
    fontSize: 24,
    letterSpacing: 0.3,
  },
  importAction: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  togglePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  groupList: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 16,
  },
  count: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginVertical: 12,
  },
  row: { gap: GAP, marginBottom: GAP },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  groupCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  groupPhotos: {
    flexDirection: 'row',
    height: 150,
  },
  groupThumb: {
    flex: 1,
    height: 150,
  },
  groupThumbStack: {
    borderLeftWidth: 3,
  },
  countBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  groupBody: {
    paddingHorizontal: 22,
    paddingVertical: 16,
  },
  groupTitle: {
    fontSize: 19,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  groupSub: {
    marginTop: 4,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
