import { StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../theme';
import type { Moment } from '../types';
import { DEFAULT_PHOTO_SHAPE } from '../shapes';
import { MomentPhoto } from './MomentPhoto';

// Photos-style relative date: "Today", "Yesterday", otherwise "Sep 21, 2026".
export function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const days = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function MomentCard({
  moment,
  theme,
}: {
  moment: Moment;
  theme: Theme;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      {moment.photoUri ? (
        <MomentPhoto
          uri={moment.photoUri}
          shape={moment.photoShape ?? DEFAULT_PHOTO_SHAPE}
          height={250}
          style={styles.photoMargins}
        />
      ) : null}
      <View style={styles.cardBody}>
        <Text style={[styles.cardText, { color: theme.text }]}>
          {moment.text}
        </Text>
        <Text style={[styles.cardDate, { color: theme.secondaryText }]}>
          {formatDate(moment.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  photoMargins: {
    marginHorizontal: 14,
    marginTop: 14,
  },
  cardBody: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
  },
  cardText: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  cardDate: {
    marginTop: 10,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
