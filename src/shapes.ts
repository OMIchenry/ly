import type { ViewStyle } from 'react-native';

export type PhotoShape = 'square' | 'rounded' | 'arch' | 'circle';

export const PHOTO_SHAPES: PhotoShape[] = ['square', 'rounded', 'arch', 'circle'];

export const DEFAULT_PHOTO_SHAPE: PhotoShape = 'square';

export function photoShapeLabel(shape: PhotoShape): string {
  switch (shape) {
    case 'square':
      return 'Square';
    case 'rounded':
      return 'Rounded';
    case 'arch':
      return 'Arch';
    case 'circle':
      return 'Circle';
  }
}

/** Border radii that give any view the given frame shape. */
export function photoFrameStyle(shape: PhotoShape): ViewStyle {
  switch (shape) {
    case 'square':
      return { borderRadius: 6 };
    case 'rounded':
      return { borderRadius: 24 };
    case 'arch':
      return {
        borderTopLeftRadius: 200,
        borderTopRightRadius: 200,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      };
    case 'circle':
      return { borderRadius: 999 };
  }
}
