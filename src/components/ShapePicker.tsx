import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  PHOTO_SHAPES,
  photoFrameStyle,
  photoShapeLabel,
  type PhotoShape,
} from '../shapes';
import type { Theme } from '../theme';

/** Pick the photo frame shape: square (default), rounded, arch, or circle. */
export function ShapePicker({
  value,
  onChange,
  theme,
}: {
  value: PhotoShape;
  onChange: (shape: PhotoShape) => void;
  theme: Theme;
}) {
  return (
    <View>
      <Text style={[styles.kicker, { color: theme.secondaryText }]}>
        Photo shape
      </Text>
      <View style={styles.row}>
        {PHOTO_SHAPES.map((shape) => {
          const selected = shape === value;
          return (
            <Pressable
              key={shape}
              onPress={() => onChange(shape)}
              style={styles.option}
              hitSlop={8}
              accessibilityLabel={`${photoShapeLabel(shape)} photo shape`}
            >
              <View
                style={[
                  styles.mini,
                  photoFrameStyle(shape),
                  {
                    borderColor: theme.text,
                    borderWidth: 1.5,
                    backgroundColor: selected ? theme.text : 'transparent',
                    opacity: selected ? 1 : 0.35,
                  },
                ]}
              />
              <Text style={[styles.label, { color: theme.secondaryText }]}>
                {photoShapeLabel(shape)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  option: {
    alignItems: 'center',
    gap: 8,
  },
  mini: {
    width: 40,
    height: 40,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
