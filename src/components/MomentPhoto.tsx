import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { photoFrameStyle, type PhotoShape } from '../shapes';

/** A photo rendered in the moment's chosen frame shape. */
export function MomentPhoto({
  uri,
  shape,
  height = 250,
  style,
}: {
  uri: string;
  shape: PhotoShape;
  height?: number;
  style?: ViewStyle;
}) {
  const isCircle = shape === 'circle';
  return (
    <View
      style={[
        styles.frame,
        photoFrameStyle(shape),
        isCircle ? styles.circle : { height },
        style,
      ]}
    >
      <Image source={{ uri }} style={styles.img} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },
  circle: {
    aspectRatio: 1,
  },
  img: {
    width: '100%',
    height: '100%',
  },
});
