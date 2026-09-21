import { useColorScheme } from 'react-native';

// Monochrome premium palette — no chromatic accent.
// Light: paper white, soft gray cards, ink black text.
// Dark: true black, charcoal cards, white text.
export interface Theme {
  dark: boolean;
  /** Screen background. */
  background: string;
  /** Card background. */
  card: string;
  /** Primary label color (also the accent — ink). */
  text: string;
  /** Color that contrasts against `text` (for content on filled shapes). */
  onText: string;
  /** Secondary label color. */
  secondaryText: string;
  /** Hairline separator color. */
  separator: string;
  /** Muted well color for empty photo / input areas. */
  well: string;
}

const light: Theme = {
  dark: false,
  background: '#FFFFFF',
  card: '#F4F4F5',
  text: '#0A0A0A',
  onText: '#FFFFFF',
  secondaryText: 'rgba(10, 10, 10, 0.55)',
  separator: 'rgba(10, 10, 10, 0.1)',
  well: 'rgba(10, 10, 10, 0.05)',
};

const dark: Theme = {
  dark: true,
  background: '#000000',
  card: '#171717',
  text: '#FAFAFA',
  onText: '#000000',
  secondaryText: 'rgba(250, 250, 250, 0.55)',
  separator: 'rgba(250, 250, 250, 0.14)',
  well: 'rgba(250, 250, 250, 0.07)',
};

/** Returns the monochrome theme matching the device appearance. */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
