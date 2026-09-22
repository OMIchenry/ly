// Tab bar glyphs for the five-tab navigation.
// Minimal line-style marks drawn with views — no icon font needed,
// matching the Soft Serif Gallery editorial feel.

import { StyleSheet, View } from 'react-native';

function GlyphWrap({ children }: { children: React.ReactNode }) {
  return <View style={styles.wrap}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** Memories: stacked moment cards. */
export function MemoriesGlyph({ color }: { color: string }) {
  return (
    <GlyphWrap>
      <View
        style={{
          width: 20,
          height: 15,
          borderWidth: 1.7,
          borderColor: color,
          borderRadius: 4,
          transform: [{ rotate: '-6deg' }],
          position: 'absolute',
          top: 3,
          left: 2,
        }}
      />
      <View
        style={{
          width: 20,
          height: 15,
          borderWidth: 1.7,
          borderColor: color,
          borderRadius: 4,
          backgroundColor: color,
          opacity: 0.16,
          transform: [{ rotate: '5deg' }],
          position: 'absolute',
          bottom: 3,
          right: 2,
        }}
      />
    </GlyphWrap>
  );
}

/** Photos: a 2x2 grid. */
export function PhotosGlyph({ color }: { color: string }) {
  const cell = {
    width: 8.5,
    height: 8.5,
    borderRadius: 2.5,
    backgroundColor: color,
  };
  return (
    <GlyphWrap>
      <View style={{ flexDirection: 'row', gap: 3.5 }}>
        <View style={cell} />
        <View style={[cell, { opacity: 0.45 }]} />
      </View>
      <View style={{ flexDirection: 'row', gap: 3.5, marginTop: 3.5 }}>
        <View style={[cell, { opacity: 0.45 }]} />
        <View style={cell} />
      </View>
    </GlyphWrap>
  );
}

/** World: a house. */
export function WorldGlyph({ color }: { color: string }) {
  return (
    <GlyphWrap>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 11,
          borderRightWidth: 11,
          borderBottomWidth: 9,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View
        style={{
          width: 16,
          height: 11,
          borderWidth: 1.7,
          borderColor: color,
          borderTopWidth: 0,
          marginTop: -1,
        }}
      />
    </GlyphWrap>
  );
}

/** Stats: bar chart. */
export function StatsGlyph({ color }: { color: string }) {
  return (
    <GlyphWrap>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 3.5,
        }}
      >
        {[9, 16, 12].map((h, i) => (
          <View
            key={i}
            style={{
              width: 4.5,
              height: h,
              borderRadius: 2.25,
              backgroundColor: color,
            }}
          />
        ))}
      </View>
    </GlyphWrap>
  );
}

/** More: horizontal ellipsis. */
export function MoreGlyph({ color }: { color: string }) {
  return (
    <GlyphWrap>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }}
          />
        ))}
      </View>
    </GlyphWrap>
  );
}
