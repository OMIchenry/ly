// Your World: the illustrated companion room.
// The companion's appearance follows your egg stage (streak.ts), the room's
// palette follows the time of day, and the cabinet of curiosities on the
// back wall fills with the 24 keyword-unlocked objects as you record life.
// Tap the companion — it reacts.

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Ellipse, Line, Rect, Text as SvgText } from 'react-native-svg';
import { loadMoments } from '../../storage';
import { useTheme } from '../../theme';
import type { Theme } from '../../theme';
import type { Moment } from '../../types';
import { WORLD_OBJECTS, unlockedObjects } from '../../world';
import { refreshEgg, type EggStage } from '../../streak';
import { Companion } from '../../components/Companion';
import { WorldObjectGlyph } from '../../components/WorldGlyphs';

const ROOM_W = Dimensions.get('window').width - 40;

type Daypart = 'morning' | 'afternoon' | 'evening' | 'night';

function daypartOf(hour: number): Daypart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

interface Palette {
  wall: string;
  floor: string;
  sky: string;
  rug: string;
  cabinet: string;
}

function paletteFor(daypart: Daypart, dark: boolean): Palette {
  if (dark) {
    switch (daypart) {
      case 'morning':
        return { wall: '#1C1712', floor: '#251E16', sky: '#8A6B3F', rug: '#4A3B28', cabinet: '#221B14' };
      case 'afternoon':
        return { wall: '#191512', floor: '#221D16', sky: '#3E5A70', rug: '#443B2C', cabinet: '#201A13' };
      case 'evening':
        return { wall: '#1D1510', floor: '#261D13', sky: '#8A4F2E', rug: '#4E3A26', cabinet: '#231A12' };
      case 'night':
        return { wall: '#141110', floor: '#1E1915', sky: '#101A2E', rug: '#3A3227', cabinet: '#1B1611' };
    }
  }
  switch (daypart) {
    case 'morning':
      return { wall: '#F8F2E7', floor: '#EADFC9', sky: '#F7D9A3', rug: '#E3B98D', cabinet: '#F1E8D6' };
    case 'afternoon':
      return { wall: '#F6F3EC', floor: '#E6DCC8', sky: '#BFD8E8', rug: '#D8C6A0', cabinet: '#EFEAD9' };
    case 'evening':
      return { wall: '#F3E7D3', floor: '#E2CDA8', sky: '#E8A06F', rug: '#D69A63', cabinet: '#EDDFC6' };
    case 'night':
      return { wall: '#EFE7D6', floor: '#DCD0B8', sky: '#2E3D5C', rug: '#B89B72', cabinet: '#E7DCC4' };
  }
}

const PHRASES: Record<EggStage, string[]> = {
  0: ['An empty nest…', 'Save a moment today to lay your egg.'],
  1: ['Warm and waiting.', 'Keep the streak going.'],
  2: ['Something is moving in there…', 'Almost there. One more day.'],
  3: ['It is hatching!', 'Hello, little one.'],
  4: ['Chirp chirp!', 'Feed me moments.'],
  5: ['Look at those wings.', 'Growing stronger every day.'],
  6: ['Soaring!', 'Legendary. Absolutely legendary.'],
};

const DAYPART_LABEL: Record<Daypart, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

function RoomScene({
  palette,
  daypart,
  theme,
  unlockedIds,
  counts,
}: {
  palette: Palette;
  daypart: Daypart;
  theme: Theme;
  unlockedIds: Set<string>;
  counts: Map<string, number>;
}) {
  const night = daypart === 'night';
  // Cabinet: 12 columns × 2 rows of cubbies.
  const cols = 12;
  const cw = 360 / cols;
  const cabinetY = 352;
  const ch = 64;
  return (
    <Svg width={ROOM_W} height={(ROOM_W * 480) / 360} viewBox="0 0 360 480">
      {/* wall */}
      <Rect x={0} y={0} width={360} height={292} fill={palette.wall} />
      {/* window */}
      <Rect x={246} y={36} width={80} height={104} rx={6} fill={palette.sky} />
      <Rect x={246} y={36} width={80} height={104} rx={6} fill="none" stroke={theme.text} strokeWidth={3} opacity={0.7} />
      <Line x1={286} y1={36} x2={286} y2={140} stroke={theme.text} strokeWidth={2.5} opacity={0.7} />
      <Line x1={246} y1={88} x2={326} y2={88} stroke={theme.text} strokeWidth={2.5} opacity={0.7} />
      {night ? (
        <>
          <Circle cx={306} cy={62} r={10} fill={theme.text} opacity={0.85} />
          <Circle cx={268} cy={110} r={1.6} fill={theme.text} opacity={0.8} />
          <Circle cx={292} cy={120} r={1.3} fill={theme.text} opacity={0.7} />
          <Circle cx={312} cy={104} r={1.6} fill={theme.text} opacity={0.8} />
        </>
      ) : (
        <>
          <Circle cx={306} cy={66} r={13} fill={theme.text} opacity={0.28} />
          <Ellipse cx={272} cy={112} rx={14} ry={5} fill={theme.text} opacity={0.14} />
        </>
      )}
      {/* floor */}
      <Rect x={0} y={292} width={360} height={60} fill={palette.floor} />
      <Line x1={0} y1={292} x2={360} y2={292} stroke={theme.text} strokeWidth={2} opacity={0.25} />
      {/* rug */}
      <Ellipse cx={110} cy={326} rx={72} ry={15} fill={palette.rug} />
      <Ellipse cx={110} cy={326} rx={52} ry={10} fill="none" stroke={theme.text} strokeWidth={1.6} opacity={0.3} />
      {/* cabinet of curiosities */}
      <Rect x={0} y={cabinetY} width={360} height={128} fill={palette.cabinet} />
      <Line x1={0} y1={cabinetY} x2={360} y2={cabinetY} stroke={theme.text} strokeWidth={2} opacity={0.25} />
      {WORLD_OBJECTS.map((obj, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cw;
        const y = cabinetY + row * ch;
        const unlocked = unlockedIds.has(obj.id);
        return (
          <Fragment key={obj.id}>
            <Rect
              x={x + 1}
              y={y + 1}
              width={cw - 2}
              height={ch - 2}
              fill="none"
              stroke={theme.text}
              strokeWidth={1}
              strokeDasharray={unlocked ? undefined : '4 4'}
              opacity={unlocked ? 0.35 : 0.22}
            />
            {unlocked ? (
              <>
                <Svg x={x + (cw - 24) / 2} y={y + 8} width={24} height={24} viewBox="0 0 24 24">
                  <WorldObjectGlyph id={obj.id} color={theme.text} />
                </Svg>
                <SvgText
                  x={x + cw / 2}
                  y={y + 52}
                  textAnchor="middle"
                  fontSize={10}
                  fill={theme.secondaryText}
                >
                  ×{counts.get(obj.id) ?? 0}
                </SvgText>
              </>
            ) : (
              <SvgText
                x={x + cw / 2}
                y={y + 38}
                textAnchor="middle"
                fontSize={16}
                fill={theme.secondaryText}
                opacity={0.7}
              >
                ?
              </SvgText>
            )}
          </Fragment>
        );
      })}
    </Svg>
  );
}

export default function WorldScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [stage, setStage] = useState<EggStage>(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const [hop] = useState(() => new Animated.Value(0));
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const loaded = await loadMoments();
        setMoments(loaded);
        const er = await refreshEgg(loaded);
        setStage(er.stage);
      })();
    }, []),
  );

  useEffect(
    () => () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    },
    [],
  );

  const unlocked = useMemo(() => unlockedObjects(moments), [moments]);
  const unlockedIds = useMemo(() => new Set(unlocked.map((o) => o.id)), [unlocked]);
  const counts = useMemo(
    () => new Map(unlocked.map((o) => [o.id, o.count] as [string, number])),
    [unlocked],
  );
  const pct =
    WORLD_OBJECTS.length > 0
      ? Math.round((unlocked.length / WORLD_OBJECTS.length) * 100)
      : 0;

  const daypart = daypartOf(new Date().getHours());
  const palette = paletteFor(daypart, theme.dark);

  function pokeCompanion() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Garnish.
    }
    // Hop.
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: -26, duration: 140, useNativeDriver: true }),
      Animated.timing(hop, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    // Speech bubble.
    const phrases = PHRASES[stage];
    const phrase = phrases[phraseIndex % phrases.length];
    setPhraseIndex((i) => i + 1);
    setBubble(phrase);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2400);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}>
          Your world
        </Text>
        <Text style={[styles.daypart, { color: theme.secondaryText }]}>
          {DAYPART_LABEL[daypart]} · tap your companion
        </Text>

        <View style={styles.roomWrap}>
          <RoomScene
            palette={palette}
            daypart={daypart}
            theme={theme}
            unlockedIds={unlockedIds}
            counts={counts}
          />
          {/* Companion sits on the rug, over the room scene. */}
          <Pressable
            onPress={pokeCompanion}
            style={styles.companionTouch}
            accessibilityLabel="Your companion"
          >
            <Animated.View style={{ transform: [{ translateY: hop }] }}>
              <Companion stage={stage} color={theme.text} size={ROOM_W * 0.3} />
            </Animated.View>
          </Pressable>
          {bubble ? (
            <View style={[styles.bubble, { backgroundColor: theme.card }]}>
              <Text style={[styles.bubbleText, { color: theme.text }]}>
                {bubble}
              </Text>
            </View>
          ) : null}
        </View>

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
          <View style={styles.chips}>
            {unlocked.map((o) => (
              <View
                key={o.id}
                style={[styles.chip, { borderColor: theme.separator }]}
              >
                <Text style={[styles.chipText, { color: theme.text }]}>
                  {o.label}
                </Text>
                <Text style={[styles.chipCount, { color: theme.secondaryText }]}>
                  ×{o.count}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyNote, { color: theme.secondaryText }]}>
            Nothing collected yet. Save a moment mentioning coffee, the gym,
            a trip — anything — and it will appear in your cabinet.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 48 },
  title: {
    fontSize: 32,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 20,
  },
  daypart: {
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  roomWrap: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 5,
  },
  companionTouch: {
    position: 'absolute',
    left: '8%',
    top: '33%',
    width: '34%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    left: '30%',
    top: '24%',
    maxWidth: '62%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  progressWrap: { marginTop: 20, marginBottom: 8 },
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipText: { fontSize: 14, letterSpacing: 0.2 },
  chipCount: { fontSize: 12, letterSpacing: 0.5 },
  emptyNote: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
