import { Image, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../theme';
import type { Moment } from '../types';

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
        <Image source={{ uri: moment.photoUri }} style={styles.photo} />
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  cardText: {
    fontSize: 17,
    lineHeight: 24,
  },
  cardDate: {
    marginTop: 8,
    fontSize: 13,
  },
});
