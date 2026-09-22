// Filtered timeline: a moment list for one slice of the archive.
// Used by Places, People, and photo Groups.
// Params: kind = 'place' | 'person' | 'group', title, value?, ids?

import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import { MomentCard } from '../components/MomentCard';
import { confirmDeleteMoment } from '../deleteMoment';
import type { Moment } from '../types';

export default function FilteredScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    kind: string;
    title: string;
    value?: string;
    ids?: string;
  }>();
  const [moments, setMoments] = useState<Moment[]>([]);

  const reload = useCallback(() => {
    loadMoments().then(setMoments);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const filtered = useMemo(() => {
    const kind = params.kind;
    if (kind === 'place' && params.value) {
      const v = params.value.toLowerCase();
      return moments.filter((m) =>
        (m.locationName ?? '').toLowerCase().includes(v),
      );
    }
    if (kind === 'person' && params.value) {
      const v = params.value.toLowerCase();
      return moments.filter((m) =>
        (m.people ?? []).some((p) => p.toLowerCase() === v),
      );
    }
    if (kind === 'group' && params.ids) {
      const order = params.ids.split(',');
      const byId = new Map(moments.map((m) => [m.id, m]));
      return order
        .map((id) => byId.get(id))
        .filter((m): m is Moment => !!m);
    }
    return [];
  }, [moments, params.kind, params.value, params.ids]);

  const title = params.title || 'Moments';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text
          style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={styles.back} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/moment/${item.id}`)}
            onLongPress={() => confirmDeleteMoment(item.id, reload)}
            delayLongPress={350}
          >
            <MomentCard moment={item} theme={theme} />
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[styles.count, { color: theme.secondaryText }]}>
            {filtered.length === 0
              ? 'No moments'
              : `${filtered.length} ${filtered.length === 1 ? 'moment' : 'moments'}`}
          </Text>
        }
        showsVerticalScrollIndicator={false}
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
  title: { fontSize: 22, letterSpacing: 0.3, flex: 1, textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 48, gap: 20 },
  count: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 4,
  },
});
