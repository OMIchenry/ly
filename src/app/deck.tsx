// Memory deck: your archive as a swipeable card deck.
// Swipe right to keep (favorite), left to skip, up to open the moment.
// Built on Animated + PanResponder — no extra dependencies.

import { useCallback, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { loadMoments, updateMoment } from '../storage';
import { useTheme } from '../theme';
import type { Theme } from '../theme';
import type { Moment } from '../types';
import { displayTitle } from '../titles';
import { formatDate } from '../components/MomentCard';
import { CollectionPicker } from '../components/CollectionPicker';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SWIPE_X = 110;
const SWIPE_UP = -110;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function DeckCard({ moment, theme }: { moment: Moment; theme: Theme }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      {moment.photoUri ? (
        <Image source={{ uri: moment.photoUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photoEmpty, { backgroundColor: theme.well }]}>
          <Text style={[styles.photoEmptyGlyph, { color: theme.secondaryText }]}>
            ✳
          </Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text
          style={[styles.cardTitle, { color: theme.text, fontFamily: theme.serif }]}
          numberOfLines={3}
        >
          {displayTitle(moment)}
        </Text>
        <Text style={[styles.cardDate, { color: theme.secondaryText }]}>
          {formatDate(moment.createdAt).toUpperCase()}
          {(moment.people ?? []).length > 0
            ? `  ·  WITH ${(moment.people ?? []).join(', ').toUpperCase()}`
            : ''}
        </Text>
      </View>
    </View>
  );
}

export default function DeckScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [kept, setKept] = useState(0);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [pan] = useState(() => new Animated.ValueXY());

  const reload = useCallback(async () => {
    const loaded = await loadMoments();
    setMoments(loaded);
    setOrder(shuffle(loaded.map((m) => m.id)));
    setIndex(0);
    setKept(0);
    pan.setValue({ x: 0, y: 0 });
  }, [pan]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const byId = useMemo(() => new Map(moments.map((m) => [m.id, m])), [moments]);
  const current = index < order.length ? byId.get(order[index]) : undefined;
  const next = index + 1 < order.length ? byId.get(order[index + 1]) : undefined;

  function advance() {
    pan.setValue({ x: 0, y: 0 });
    setIndex((i) => i + 1);
  }

  async function keep(moment: Moment) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Garnish.
    }
    setKept((k) => k + 1);
    const updated = await updateMoment(moment.id, { favorite: true });
    setMoments(updated);
    advance();
  }

  async function skip() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Garnish.
    }
    advance();
  }

  function openDetail(moment: Moment) {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
    router.push(`/moment/${moment.id}`);
  }

  function reshuffle() {
    setOrder(shuffle(moments.map((m) => m.id)));
    setIndex(0);
    setKept(0);
    pan.setValue({ x: 0, y: 0 });
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Garnish.
    }
  }

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, g) => {
          const m = current;
          if (!m) return;
          if (g.dx > SWIPE_X) {
            Animated.timing(pan, {
              toValue: { x: SCREEN_W, y: g.dy },
              duration: 220,
              useNativeDriver: true,
            }).start(() => keep(m));
          } else if (g.dx < -SWIPE_X) {
            Animated.timing(pan, {
              toValue: { x: -SCREEN_W, y: g.dy },
              duration: 220,
              useNativeDriver: true,
            }).start(() => skip());
          } else if (g.dy < SWIPE_UP) {
            Animated.timing(pan, {
              toValue: { x: g.dx, y: -SCREEN_H },
              duration: 220,
              useNativeDriver: true,
            }).start(() => {
              pan.setValue({ x: 0, y: 0 });
              router.push(`/moment/${m.id}`);
            });
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current?.id, pan],
  );

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const keepOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_X],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const skipOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_X, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const done = !current;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}>
          Memory deck
        </Text>
        <Pressable onPress={reshuffle} hitSlop={12} style={styles.back}>
          <Text style={[styles.shuffleText, { color: theme.text }]}>Shuffle</Text>
        </Pressable>
      </View>

      {!done ? (
        <Text style={[styles.progress, { color: theme.secondaryText }]}>
          {index + 1} of {order.length}
          {kept > 0 ? `  ·  ${kept} kept` : ''}
        </Text>
      ) : null}

      <View style={styles.deck}>
        {done ? (
          <View style={styles.doneWrap}>
            <Text
              style={[styles.doneTitle, { color: theme.text, fontFamily: theme.serif }]}
            >
              Deck complete
            </Text>
            <Text style={[styles.doneSub, { color: theme.secondaryText }]}>
              You kept {kept} {kept === 1 ? 'moment' : 'moments'} this round.
            </Text>
            <Pressable
              onPress={reshuffle}
              style={[styles.doneButton, { backgroundColor: theme.text }]}
            >
              <Text style={[styles.doneButtonText, { color: theme.onText }]}>
                Shuffle again
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {next ? (
              <View style={[styles.nextCard, { transform: [{ scale: 0.94 }] }]}>
                <DeckCard moment={next} theme={theme} />
              </View>
            ) : null}
            {current ? (
              <Animated.View
                {...responder.panHandlers}
                style={[
                  styles.topCard,
                  {
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { rotate },
                    ],
                  },
                ]}
              >
                <DeckCard moment={current} theme={theme} />
                <Animated.View
                  style={[styles.badge, styles.keepBadge, { opacity: keepOpacity }]}
                >
                  <Text style={styles.badgeText}>KEEP</Text>
                </Animated.View>
                <Animated.View
                  style={[styles.badge, styles.skipBadge, { opacity: skipOpacity }]}
                >
                  <Text style={styles.badgeText}>SKIP</Text>
                </Animated.View>
              </Animated.View>
            ) : null}
          </>
        )}
      </View>

      {!done && current ? (
        <View style={styles.actions}>
          <Pressable
            onPress={() => skip()}
            style={[styles.actionPill, { borderColor: theme.separator }]}
          >
            <Text style={[styles.actionText, { color: theme.secondaryText }]}>
              Skip
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPickerFor(current.id)}
            style={[styles.actionPill, { borderColor: theme.separator }]}
          >
            <Text style={[styles.actionText, { color: theme.secondaryText }]}>
              Collect
            </Text>
          </Pressable>
          <Pressable
            onPress={() => keep(current)}
            style={[styles.actionPill, styles.keepPill, { backgroundColor: theme.text }]}
          >
            <Text style={[styles.actionText, { color: theme.onText }]}>Keep</Text>
          </Pressable>
          <Pressable
            onPress={() => openDetail(current)}
            style={[styles.actionPill, { borderColor: theme.separator }]}
          >
            <Text style={[styles.actionText, { color: theme.secondaryText }]}>
              Open
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={[styles.hint, { color: theme.secondaryText }]}>
        Swipe right to keep · left to skip · up to open
      </Text>

      <CollectionPicker
        visible={pickerFor !== null}
        momentId={pickerFor ?? ''}
        onClose={() => setPickerFor(null)}
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
  back: {
    minWidth: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 30, fontWeight: '300', marginTop: -2 },
  shuffleText: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, letterSpacing: 0.3 },
  progress: {
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  deck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  nextCard: {
    position: 'absolute',
    width: SCREEN_W - 56,
    opacity: 0.55,
  },
  topCard: {
    width: SCREEN_W - 56,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 8,
  },
  photo: {
    width: '100%',
    height: 300,
  },
  photoEmpty: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmptyGlyph: {
    fontSize: 44,
    fontWeight: '300',
  },
  cardBody: {
    paddingHorizontal: 26,
    paddingVertical: 24,
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  cardDate: {
    marginTop: 12,
    fontSize: 11,
    letterSpacing: 2,
  },
  badge: {
    position: 'absolute',
    top: 20,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  keepBadge: {
    left: 20,
    backgroundColor: '#1a7f37',
    transform: [{ rotate: '-14deg' }],
  },
  skipBadge: {
    right: 20,
    backgroundColor: '#B3261E',
    transform: [{ rotate: '14deg' }],
  },
  badgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  actionPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  keepPill: {
    borderWidth: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  doneWrap: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  doneTitle: {
    fontSize: 34,
    letterSpacing: 0.3,
  },
  doneSub: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: 28,
    borderRadius: 999,
    paddingHorizontal: 36,
    paddingVertical: 15,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
