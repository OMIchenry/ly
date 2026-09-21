import { useColorScheme } from 'react-native';

// iOS system palette, adaptive to light / dark mode.
// Follows Apple's Human Interface Guidelines values for system
// backgrounds, labels, and the system blue accent.
export interface Theme {
  dark: boolean;
  /** System grouped background (the canvas behind cards). */
  background: string;
  /** Card / secondary grouped background. */
  card: string;
  /** Primary label color. */
  text: string;
  /** Secondary label color. */
  secondaryText: string;
  /** System blue accent. */
  blue: string;
  /** Hairline separator color. */
  separator: string;
  /** Muted well color for empty photo / input areas. */
  well: string;
}

const light: Theme = {
  dark: false,
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  secondaryText: 'rgba(60, 60, 67, 0.6)',
  blue: '#007AFF',
  separator: 'rgba(60, 60, 67, 0.12)',
  well: 'rgba(120, 120, 128, 0.12)',
};

const dark: Theme = {
  dark: true,
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  secondaryText: 'rgba(235, 235, 245, 0.6)',
  blue: '#0A84FF',
  separator: 'rgba(84, 84, 88, 0.65)',
  well: 'rgba(120, 120, 128, 0.24)',
};

/** Returns the iOS system theme matching the device appearance. */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
