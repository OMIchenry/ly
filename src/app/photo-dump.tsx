import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library/legacy';
import { newId, saveMoment } from '../storage';
import { useTheme } from '../theme';
import type { Theme } from '../theme';

const MAX_SELECT = 20;
const PAGE_SIZE = 120;

interface PhotoItem {
  id: string;
  uri: string;
  creationTime: number;
}

function dayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function PhotoDumpScreen() {
  const theme = useTheme();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>(
    'unknown',
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        mediaType: 'photo',
        sortBy: [['creationTime', false]],
      });
      setPhotos(
        assets.map((a) => ({
          id: a.id,
          uri: a.uri,
          creationTime: a.creationTime,
        })),
      );
    })();
  }, []);

  const selectedPhotos = useMemo(
    () => photos.filter((p) => selected.has(p.id)),
    [photos, selected],
  );

  const dayGroups = useMemo(() => {
    const map = new Map<string, PhotoItem[]>();
    for (const p of selectedPhotos) {
      const key = dayLabel(p.creationTime);
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [selectedPhotos]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_SELECT) {
          Alert.alert(
            'That\u2019s enough for one dump',
            `Pick up to ${MAX_SELECT} photos at a time.`,
          );
          return prev;
        }
        next.add(id);
      }
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Garnish.
      }
      return next;
    });
  }

  async function saveAll() {
    if (selectedPhotos.length === 0 || saving) return;
    setSaving(true);
    try {
      // Oldest first so the timeline reads naturally.
      const ordered = [...selectedPhotos].sort(
        (a, b) => a.creationTime - b.creationTime,
      );
      for (const p of ordered) {
        await saveMoment({
          id: newId(),
          title: '',
          text: '',
          people: [],
          photoUri: p.uri,
          audioUri: null,
          createdAt: new Date(p.creationTime).toISOString(),
        });
      }
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Garnish.
      }
      router.back();
    } catch {
      Alert.alert('Could not save', 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}>
          Photo dump
        </Text>
        <View style={styles.back} />
      </View>

      {permission === 'denied' ? (
        <View style={styles.center}>
          <Text style={[styles.note, { color: theme.secondaryText }]}>
            LY needs photo access to find your memories.{'\n'}
            Enable it in Settings, then come back.
          </Text>
        </View>
      ) : permission === 'unknown' ? (
        <View style={styles.center}>
          <Text style={[styles.note, { color: theme.secondaryText }]}>
            Asking for photo access…
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.lede, { color: theme.secondaryText }]}>
            Pick up to {MAX_SELECT} photos. Each becomes a moment, dated when
            it was taken.
          </Text>
          <ScrollView contentContainerStyle={styles.grid}>
            {photos.map((p) => {
              const isSel = selected.has(p.id);
              const order = selectedPhotos.findIndex((s) => s.id === p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => toggle(p.id)}
                  style={styles.cell}
                >
                  <Image
                    source={{ uri: p.uri }}
                    style={[styles.thumb, { opacity: isSel ? 0.55 : 1 }]}
                  />
                  {isSel ? (
                    <View
                      style={[styles.badge, { backgroundColor: theme.text }]}
                    >
                      <Text style={[styles.badgeText, { color: theme.onText }]}>
                        {order + 1}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
          {selected.size > 0 ? (
            <View
              style={[styles.footer, { backgroundColor: theme.background }]}
            >
              <Text style={[styles.footerText, { color: theme.secondaryText }]}>
                {dayGroups.length} {dayGroups.length === 1 ? 'day' : 'days'} ·{' '}
                {selected.size} {selected.size === 1 ? 'photo' : 'photos'}
              </Text>
              <Pressable
                onPress={saveAll}
                disabled={saving}
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.text, opacity: saving ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.saveText, { color: theme.onText }]}>
                  {saving ? 'Saving…' : `Save ${selected.size} moments`}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  note: { fontSize: 15, lineHeight: 23, textAlign: 'center' },
  lede: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 120,
    gap: 4,
  },
  cell: { width: '32%', aspectRatio: 1, position: 'relative' },
  thumb: { width: '100%', height: '100%', borderRadius: 8 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 10,
  },
  footerText: { fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  saveButton: {
    borderRadius: 999,
    paddingHorizontal: 36,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  saveText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
});
