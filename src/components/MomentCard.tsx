import { StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../theme';
import type { Moment } from '../types';
import { DEFAULT_PHOTO_SHAPE } from '../shapes';
import { displayTitle } from '../titles';
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
  const title = displayTitle(moment);
  const showText = title !== moment.text;
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
        <Text
          style={[styles.cardTitle, { color: theme.text, fontFamily: theme.serif }]}
        >
          {title}
        </Text>
        {showText ? (
          <Text
            style={[styles.cardText, { color: theme.secondaryText }]}
            numberOfLines={3}
          >
            {moment.text}
          </Text>
        ) : null}
        {(moment.people ?? []).length > 0 ? (
          <Text style={[styles.cardPeople, { color: theme.secondaryText }]}>
            with {(moment.people ?? []).join(', ')}
          </Text>
        ) : null}
        <Text style={[styles.cardDate, { color: theme.secondaryText }]}>
          {formatDate(moment.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    // Gallery float: soft, deep shadow on paper.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  photoMargins: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  cardBody: {
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 26,
  },
  cardTitle: {
    fontSize: 21,
    lineHeight: 29,
    letterSpacing: 0.2,
  },
  cardText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0.2,
  },
  cardPeople: {
    marginTop: 10,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  cardDate: {
    marginTop: 12,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
