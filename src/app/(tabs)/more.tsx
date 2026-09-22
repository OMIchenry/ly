// More tab: the directory of everything else — calendar, map,
// time machine, places, people, collections, trash, and settings.

import { useCallback, useState } from 'react';
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
import { loadTrash } from '../../storage';
import { loadCollections } from '../../collections';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';

interface Row {
  label: string;
  sub: string;
  route: string;
  badge?: string;
}

function Section({
  title,
  rows,
  theme,
}: {
  title: string;
  rows: Row[];
  theme: Theme;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.kickerRow}>
        <View style={[styles.kickerLine, { backgroundColor: theme.separator }]} />
        <Text style={[styles.kicker, { color: theme.secondaryText }]}>
          {title}
        </Text>
        <View style={[styles.kickerLine, { backgroundColor: theme.separator }]} />
      </View>
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {rows.map((row, i) => (
          <View key={row.route}>
            {i > 0 ? (
              <View style={[styles.divider, { backgroundColor: theme.separator }]} />
            ) : null}
            <Pressable
              onPress={() => router.push(row.route as never)}
              style={styles.row}
              accessibilityLabel={row.label}
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>
                  {row.label}
                </Text>
                <Text style={[styles.rowSub, { color: theme.secondaryText }]}>
                  {row.sub}
                </Text>
              </View>
              {row.badge ? (
                <View
                  style={[styles.badge, { backgroundColor: theme.text }]}
                >
                  <Text style={[styles.badgeText, { color: theme.onText }]}>
                    {row.badge}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.chevron, { color: theme.secondaryText }]}>
                ›
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MoreScreen() {
  const theme = useTheme();
  const [trashCount, setTrashCount] = useState(0);
  const [collectionCount, setCollectionCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadTrash().then((t) => setTrashCount(t.length));
      loadCollections().then((c) => setCollectionCount(c.length));
    }, []),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}>
          More
        </Text>
        <Text style={[styles.kickerSub, { color: theme.secondaryText }]}>
          Everything else in LY
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <Section
          title="Browse time & place"
          theme={theme}
          rows={[
            {
              label: 'Calendar',
              sub: 'Every day you kept something',
              route: '/calendar',
            },
            {
              label: 'Map',
              sub: 'Your moments, pinned',
              route: '/map',
            },
            {
              label: 'Time machine',
              sub: 'Jump to any month, years back',
              route: '/time-machine',
            },
            {
              label: 'Photo dump',
              sub: 'Turn camera-roll photos into moments',
              route: '/photo-dump',
            },
          ]}
        />
        <Section
          title="Your library"
          theme={theme}
          rows={[
            {
              label: 'Places',
              sub: 'Everywhere you have been',
              route: '/places',
            },
            {
              label: 'People',
              sub: 'Everyone in your story',
              route: '/people',
            },
            {
              label: 'Collections',
              sub: 'Trips, projects, themes — yours',
              route: '/collections',
              badge: collectionCount > 0 ? String(collectionCount) : undefined,
            },
          ]}
        />
        <Section
          title="System"
          theme={theme}
          rows={[
            {
              label: 'Recently Deleted',
              sub: 'Kept for 30 days, then gone',
              route: '/trash',
              badge: trashCount > 0 ? String(trashCount) : undefined,
            },
            {
              label: 'Settings',
              sub: 'Backup, restore, and your data',
              route: '/settings',
            },
          ]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    letterSpacing: 0.3,
  },
  kickerSub: {
    marginTop: 4,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 8,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    marginBottom: 14,
  },
  kickerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  kicker: { fontSize: 12, letterSpacing: 2.5, textTransform: 'uppercase' },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 17,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  rowSub: {
    marginTop: 3,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
});
