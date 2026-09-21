import { useCallback, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import { MomentCard } from '../components/MomentCard';
import { Egg } from '../components/Egg';
import {
  eggCaption,
  eggStage,
  refreshEgg,
  type EggResult,
} from '../streak';
import {
  onThisDayMoments,
  refreshOnThisDayReminder,
} from '../notifications';
import { confirmDeleteMoment } from '../deleteMoment';
import { displayTitle } from '../titles';
import { loadTrash } from '../storage';
import { useLock } from '../components/LockGate';
import type { Theme } from '../theme';
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

// Horizontal ellipsis glyph for the "more" menu.
function MoreGlyph({ color }: { color: string }) {
  return (
    <View style={moreGlyphStyles.row}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[moreGlyphStyles.dot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const moreGlyphStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

// Minimal line-style map-pin glyph drawn with views (no icon font needed).
function MapGlyph({ color }: { color: string }) {
  return (
    <View style={mapGlyphStyles.pin}>
      <View style={[mapGlyphStyles.head, { borderColor: color }]}>
        <View style={[mapGlyphStyles.headDot, { backgroundColor: color }]} />
      </View>
      <View style={[mapGlyphStyles.tail, { backgroundColor: color }]} />
    </View>
  );
}

const mapGlyphStyles = StyleSheet.create({
  pin: {
    alignItems: 'center',
  },
  head: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tail: {
    width: 1.7,
    height: 7,
    marginTop: -1,
  },
});

function EggCard({ egg, theme }: { egg: EggResult | null; theme: Theme }) {
  if (!egg) return null;
  const caption = egg.paused
    ? 'Missed yesterday — save a moment today to repair it'
    : egg.repaired
      ? 'Streak repaired. Nice save.'
      : egg.freezeBurned
        ? 'A freeze kept your streak warm'
        : egg.nextMilestone
          ? `${eggCaption(egg.count)} · ${egg.nextMilestone - egg.count}d to ${egg.nextMilestone}`
          : eggCaption(egg.count);
  return (
    <View style={[styles.eggCard, { backgroundColor: theme.card }]}>
      <View style={{ opacity: egg.paused ? 0.45 : 1 }}>
        <Egg stage={egg.stage} color={theme.text} soft={theme.card} size={58} />
      </View>
      <View style={styles.eggText}>
        <Text style={[styles.eggCount, { color: theme.text }]}>
          {egg.count} {egg.count === 1 ? 'day' : 'days'}
          {egg.paused ? ' · paused' : ''}
        </Text>
        <Text style={[styles.eggCaption, { color: theme.secondaryText }]}>
          {caption}
        </Text>
        <View style={styles.eggMetaRow}>
          {egg.freezes > 0 ? (
            <View style={[styles.freezePill, { borderColor: theme.secondaryText }]}>
              <Text style={[styles.freezeText, { color: theme.secondaryText }]}>
                {egg.freezes} {egg.freezes === 1 ? 'freeze' : 'freezes'}
              </Text>
            </View>
          ) : null}
          {egg.paused ? (
            <View style={[styles.freezePill, { backgroundColor: theme.text }]}>
              <Text style={[styles.freezeText, { color: theme.onText }]}>
                Repair today
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.historyStrip}>
          {egg.history.map((hit, i) => (
            <View
              key={i}
              style={[
                styles.historyDot,
                {
                  backgroundColor: hit ? theme.text : theme.separator,
                  opacity: hit ? 1 : 0.5,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function OnThisDay({
  moments,
  theme,
}: {
  moments: Moment[];
  theme: Theme;
}) {
  if (moments.length === 0) return null;
  return (
    <View style={styles.onThisDay}>
      <Text style={[styles.sectionKicker, { color: theme.secondaryText }]}>
        On this day
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.onThisDayRow}
      >
        {moments.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.memoryChip, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/moment/${m.id}`)}
          >
            <Text style={[styles.memoryYear, { color: theme.text }]}>
              {new Date(m.createdAt).getFullYear()}
            </Text>
            <Text
              style={[styles.memoryText, { color: theme.secondaryText }]}
              numberOfLines={3}
            >
              {m.text}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function EmptyState({ theme, searching }: { theme: Theme; searching: boolean }) {
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyKicker, { color: theme.secondaryText }]}>
        {searching ? 'No matches' : 'Begin anywhere'}
      </Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {searching ? 'Nothing found' : 'No moments yet'}
      </Text>
      {!searching ? (
        <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
          Tap + to keep a small moment{'\n'}before it fades.
        </Text>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [query, setQuery] = useState('');
  const [egg, setEgg] = useState<EggResult | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [trashCount, setTrashCount] = useState(0);
  const { lockEnabled, toggleLock } = useLock();

  const reload = useCallback(async () => {
    const loaded = await loadMoments();
    setMoments(loaded);

    // The egg system: streak, freezes, repairs, milestones — one refresh,
    // one source of truth.
    const er = await refreshEgg(loaded);
    setEgg(er);
    if (er.newMilestones.length > 0) {
      setMilestone(er.newMilestones[0]);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Garnish, not load-bearing.
      }
    }

    // Keep tomorrow's 9am "On this day" reminder fresh.
    refreshOnThisDayReminder(loaded);

    // Badge the trash count in the ••• menu.
    loadTrash().then((t) => setTrashCount(t.length));
  }, []);

  // Reload every time the screen comes into focus (e.g. after saving).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const searching = query.trim().length > 0;

  const visibleMoments = useMemo(() => {
    if (!searching) return moments;
    const q = query.trim().toLowerCase();
    return moments.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        displayTitle(m).toLowerCase().includes(q) ||
        (m.locationName ?? '').toLowerCase().includes(q) ||
        (m.people ?? []).some((p) => p.toLowerCase().includes(q)),
    );
  }, [moments, query, searching]);

  // Same month/day as today, from previous years — newest year first.
  const onThisDay = useMemo(() => onThisDayMoments(moments), [moments]);

  function openMoreMenu() {
    const options = [
      'Photos',
      trashCount > 0 ? `Recently Deleted (${trashCount})` : 'Recently Deleted',
      lockEnabled ? 'Face ID Lock: On' : 'Face ID Lock: Off',
      'Cancel',
    ];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      async (index) => {
        if (index === 0) router.push('/photos');
        else if (index === 1) router.push('/trash');
        else if (index === 2) {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {
            // Garnish, not load-bearing.
          }
          const result = await toggleLock();
          if (result === 'unavailable') {
            Alert.alert(
              'Face ID not available',
              'This device has no biometric or passcode authentication set up.',
            );
          } else if (result === 'denied') {
            Alert.alert('Not enabled', 'Authentication was cancelled.');
          }
        }
      },
    );
  }

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
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => router.push('/map')}
            hitSlop={12}
            style={styles.headerButton}
            accessibilityLabel="Open map"
          >
            <MapGlyph color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/calendar')}
            hitSlop={12}
            style={styles.headerButton}
            accessibilityLabel="Open calendar"
          >
            <CalendarGlyph color={theme.text} />
          </Pressable>
          <Pressable
            onPress={openMoreMenu}
            hitSlop={12}
            style={styles.headerButton}
            accessibilityLabel="More options"
          >
            <MoreGlyph color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: theme.well }]}>
        <TextInput
          style={[styles.search, { color: theme.text }]}
          placeholder="Search moments"
          placeholderTextColor={theme.secondaryText}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={visibleMoments}
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
        contentContainerStyle={
          visibleMoments.length === 0 ? styles.listEmpty : styles.list
        }
        ListHeaderComponent={
          searching ? null : (
            <>
              <EggCard egg={egg} theme={theme} />
              <OnThisDay moments={onThisDay} theme={theme} />
              {moments.length > 0 ? (
                <Text style={[styles.sectionKicker, { color: theme.secondaryText }]}>
                  All moments
                </Text>
              ) : null}
            </>
          )
        }
        ListEmptyComponent={<EmptyState theme={theme} searching={searching} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.text, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={() => router.push('/new')}
        accessibilityLabel="Create a moment"
      >
        <Text style={[styles.fabPlus, { color: theme.onText }]}>+</Text>
      </Pressable>

      <Modal
        visible={milestone !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMilestone(null)}
      >
        <View style={styles.milestoneBackdrop}>
          <View style={[styles.milestoneCard, { backgroundColor: theme.card }]}>
            <Egg
              stage={eggStage(milestone ?? 0)}
              color={theme.text}
              soft={theme.card}
              size={96}
            />
            <Text style={[styles.milestoneTitle, { color: theme.text }]}>
              {milestone}-day streak!
            </Text>
            <Text style={[styles.milestoneSub, { color: theme.secondaryText }]}>
              Your egg evolved — and you earned a freeze.
            </Text>
            <Pressable
              onPress={() => setMilestone(null)}
              style={[styles.milestoneButton, { backgroundColor: theme.text }]}
            >
              <Text style={[styles.milestoneButtonText, { color: theme.onText }]}>
                Keep going
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 10,
  },
  count: {
    marginTop: 6,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  calendarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  search: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 20,
  },
  listEmpty: {
    flex: 1,
    paddingHorizontal: 24,
  },
  eggCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 18,
    marginBottom: 24,
    gap: 18,
  },
  eggText: {
    flex: 1,
  },
  eggCount: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  eggCaption: {
    marginTop: 4,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  freezePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  freezeText: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  eggMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  historyStrip: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  historyDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  milestoneBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  milestoneCard: {
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  milestoneTitle: {
    marginTop: 18,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  milestoneSub: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  milestoneButton: {
    marginTop: 24,
    borderRadius: 100,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  milestoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  onThisDay: {
    marginBottom: 24,
  },
  onThisDayRow: {
    gap: 12,
    paddingRight: 20,
  },
  sectionKicker: {
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  memoryChip: {
    width: 190,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  memoryYear: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  memoryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 90,
  },
  emptyKicker: {
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 28,
    bottom: 48,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  fabPlus: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
    marginTop: -2,
  },
});
