// Photo grid: every moment with a photo, in a monochrome wall.
// Tap a photo to open its moment.

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
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import type { Moment } from '../types';

const COLUMNS = 3;
const GAP = 3;
const TILE = (Dimensions.get('window').width - 40 - GAP * (COLUMNS - 1)) / COLUMNS;

export default function PhotosScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMoments().then(setMoments);
    }, []),
  );

  const withPhotos = useMemo(
    () => moments.filter((m) => m.photoUri),
    [moments],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />

      <View
        style={[
          styles.navBar,
          { borderBottomColor: theme.separator, backgroundColor: theme.background },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.navSide}>
          <Text style={[styles.back, { color: theme.text }]}>‹ Moments</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>Photos</Text>
        <View style={styles.navSide} />
      </View>

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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  count: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginVertical: 16,
  },
  row: { gap: GAP, marginBottom: GAP },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
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
