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
        <View style={styles.archWrap}>
          <Image source={{ uri: moment.photoUri }} style={styles.photo} />
        </View>
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
  // Arch-shaped photo — the signature premium frame.
  archWrap: {
    marginHorizontal: 14,
    marginTop: 14,
    height: 250,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },
  photo: {
    width: '100%',
    height: '100%',
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
