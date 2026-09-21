import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import MapView, { Marker, type MapStyleElement, type Region } from 'react-native-maps';
import { loadMoments } from '../storage';
import { useTheme } from '../theme';
import type { Moment } from '../types';

// Monochrome map treatment to match LY's palette.
const MONO_MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ saturation: -100 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#111111' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#dedede' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f2f2f2' }],
  },
];

// Home turf fallback when there is nothing to frame yet.
const FALLBACK_REGION: Region = {
  latitude: 43.6532,
  longitude: -79.3832,
  latitudeDelta: 0.8,
  longitudeDelta: 0.8,
};

interface PlacedMoment extends Moment {
  latitude: number;
  longitude: number;
}

function regionFor(points: PlacedMoment[]): Region {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 1.6;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * pad, 0.06),
    longitudeDelta: Math.max((maxLng - minLng) * pad, 0.06),
  };
}

export default function MapScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadMoments().then(setMoments);
    }, []),
  );

  const placed = useMemo<PlacedMoment[]>(
    () =>
      moments.filter(
        (m): m is PlacedMoment =>
          typeof m.latitude === 'number' && typeof m.longitude === 'number',
      ),
    [moments],
  );

  const region = useMemo(
    () => (placed.length > 0 ? regionFor(placed) : FALLBACK_REGION),
    [placed],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />

      {/* iOS-style nav bar */}
      <View
        style={[
          styles.navBar,
          { borderBottomColor: theme.separator, backgroundColor: theme.background },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.navSide}>
          <Text style={[styles.back, { color: theme.text }]}>‹ Moments</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>Map</Text>
        <View style={styles.navSide} />
      </View>

      <View style={styles.flex}>
        <MapView
          style={styles.map}
          initialRegion={region}
          customMapStyle={MONO_MAP_STYLE}
          showsUserLocation
        >
          {placed.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.latitude, longitude: m.longitude }}
              onPress={() => router.push(`/moment/${m.id}`)}
            >
              <View style={styles.pin}>
                <View style={styles.pinDot} />
              </View>
            </Marker>
          ))}
        </MapView>

        {placed.length === 0 ? (
          <View style={styles.emptyWrap} pointerEvents="none">
            <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.emptyKicker, { color: theme.secondaryText }]}>
                No pins yet
              </Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                Moments you save with location on will appear here.
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  map: { flex: 1 },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#111111',
  },
  emptyWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 18,
    maxWidth: 300,
    alignItems: 'center',
  },
  emptyKicker: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
