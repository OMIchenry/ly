import { useColorScheme } from 'react-native';

// Soft Serif Gallery palette — warm paper, ink text, editorial serif.
// Light: warm paper white, pure white cards, ink black text.
// Dark: warm near-black, charcoal cards, warm white text.
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
  /** Editorial serif family (iOS system serif). */
  serif: string;
}

const light: Theme = {
  dark: false,
  background: '#FBFAF7',
  card: '#FFFFFF',
  text: '#0A0A0A',
  onText: '#FFFFFF',
  secondaryText: 'rgba(10, 10, 10, 0.55)',
  separator: 'rgba(10, 10, 10, 0.14)',
  well: 'rgba(10, 10, 10, 0.05)',
  serif: 'Georgia',
};

const dark: Theme = {
  dark: true,
  background: '#0C0B09',
  card: '#1A1815',
  text: '#F5F1E8',
  onText: '#0C0B09',
  secondaryText: 'rgba(245, 241, 232, 0.55)',
  separator: 'rgba(245, 241, 232, 0.16)',
  well: 'rgba(245, 241, 232, 0.07)',
  serif: 'Georgia',
};

/** Returns the monochrome theme matching the device appearance. */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
