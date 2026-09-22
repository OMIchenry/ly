import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import type { Theme } from '../theme';
import type { Moment } from '../types';
import {
  WORLD_OBJECTS,
  lockedObjects,
  unlockedObjects,
} from '../world';

function Kicker({ children, theme }: { children: string; theme: Theme }) {
  return (
    <View style={styles.kickerRow}>
      <View style={[styles.kickerLine, { backgroundColor: theme.separator }]} />
      <Text style={[styles.kicker, { color: theme.secondaryText }]}>
        {children}
      </Text>
      <View style={[styles.kickerLine, { backgroundColor: theme.separator }]} />
    </View>
  );
}

export default function WorldScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMoments().then(setMoments);
    }, []),
  );

  const unlocked = useMemo(() => unlockedObjects(moments), [moments]);
  const locked = useMemo(() => lockedObjects(moments), [moments]);
  const pct =
    WORLD_OBJECTS.length > 0
      ? Math.round((unlocked.length / WORLD_OBJECTS.length) * 100)
      : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}>
          Your world
        </Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lede, { color: theme.secondaryText }]}>
          Your memories build this cabinet.{'\n'}
          Keep recording and watch it fill.
        </Text>

        <View style={styles.progressWrap}>
          <Text style={[styles.progressText, { color: theme.secondaryText }]}>
            {unlocked.length} of {WORLD_OBJECTS.length} collected
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: theme.well }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.text, width: `${pct}%` },
              ]}
            />
          </View>
        </View>

        {unlocked.length > 0 ? (
          <>
            <Kicker theme={theme}>Collected</Kicker>
            <View style={styles.grid}>
              {unlocked.map((o) => (
                <View
                  key={o.id}
                  style={[styles.tile, { backgroundColor: theme.card }]}
                >
                  <Text
                    style={[
                      styles.tileLabel,
                      { color: theme.text, fontFamily: theme.serif },
                    ]}
                  >
                    {o.label}
                  </Text>
                  <Text style={[styles.tileCount, { color: theme.secondaryText }]}>
                    {o.count} {o.count === 1 ? 'moment' : 'moments'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={[styles.emptyNote, { color: theme.secondaryText }]}>
            Nothing collected yet. Save a moment mentioning coffee, the gym,
            a trip — anything — and it will appear here.
          </Text>
        )}

        {locked.length > 0 ? (
          <>
            <Kicker theme={theme}>Still out there</Kicker>
            <View style={styles.grid}>
              {locked.map((o) => (
                <View
                  key={o.id}
                  style={[
                    styles.tile,
                    styles.lockedTile,
                    { borderColor: theme.separator },
                  ]}
                >
                  <Text style={[styles.lockedQ, { color: theme.secondaryText }]}>
                    ?
                  </Text>
                  <Text style={[styles.tileCount, { color: theme.secondaryText }]}>
                    Not yet found
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
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
  list: { paddingHorizontal: 20, paddingBottom: 48 },
  lede: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 20,
  },
  progressWrap: { marginBottom: 8 },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 24,
  },
  progressFill: { height: 6, borderRadius: 3 },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
    marginBottom: 16,
  },
  kickerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  kicker: { fontSize: 12, letterSpacing: 2.5, textTransform: 'uppercase' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '48%',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  lockedTile: {
    borderWidth: 1,
    borderStyle: 'dashed',
    shadowOpacity: 0,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  tileLabel: { fontSize: 18, textAlign: 'center' },
  tileCount: {
    marginTop: 6,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  lockedQ: { fontSize: 28, fontWeight: '300' },
  emptyNote: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
