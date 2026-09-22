// First-run onboarding: the philosophy, the egg, and gentle reminders.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../theme';
import { Egg } from '../components/Egg';

export const ONBOARDED_KEY = '@ly:onboarded:v1';

async function finish() {
  try {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    // Non-fatal; they'll just see onboarding once more.
  }
  router.replace('/');
}

const PAGES = 3;

export default function OnboardingScreen() {
  const theme = useTheme();
  const [page, setPage] = useState(0);

  async function enableNotifications() {
    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === 'undetermined') {
        await Notifications.requestPermissionsAsync();
      }
    } catch {
      // Fine — reminders are optional.
    }
    finish();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.body}>
        {page === 0 ? (
          <>
            <Text style={[styles.brand, { color: theme.text }]}>LY</Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Make remembering effortless.
            </Text>
            <Text style={[styles.sub, { color: theme.secondaryText }]}>
              Journaling felt like too much work. So LY asks for one small
              moment a day — a line, a photo, a voice note. That&apos;s the whole app.
            </Text>
          </>
        ) : null}

        {page === 1 ? (
          <>
            <Egg stage={2} color={theme.text} soft={theme.card} size={110} />
            <Text style={[styles.title, { color: theme.text, marginTop: 28 }]}>
              Keep the egg warm.
            </Text>
            <Text style={[styles.sub, { color: theme.secondaryText }]}>
              Save a moment every day and your egg grows — cracking, hatching,
              finally soaring. Miss a day and a freeze protects you. Miss two
              and you get one repair a week. No guilt, just warmth.
            </Text>
          </>
        ) : null}

        {page === 2 ? (
          <>
            <Text style={[styles.brand, { color: theme.text }]}>✳</Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Gentle reminders.
            </Text>
            <Text style={[styles.sub, { color: theme.secondaryText }]}>
              One quiet notification each morning — only when you have a memory
              from this day in past years. Nothing else. Ever.
            </Text>
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: PAGES }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: theme.text,
                  opacity: i === page ? 1 : 0.2,
                  width: i === page ? 22 : 7,
                },
              ]}
            />
          ))}
        </View>

        {page < 2 ? (
          <Pressable
            onPress={() => setPage(page + 1)}
            style={[styles.button, { backgroundColor: theme.text }]}
          >
            <Text style={[styles.buttonText, { color: theme.onText }]}>
              Continue
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={enableNotifications}
              style={[styles.button, { backgroundColor: theme.text }]}
            >
              <Text style={[styles.buttonText, { color: theme.onText }]}>
                Enable reminders
              </Text>
            </Pressable>
            <Pressable onPress={finish} hitSlop={12} style={styles.skip}>
              <Text style={[styles.skipText, { color: theme.secondaryText }]}>
                Skip for now
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  brand: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 36,
  },
  sub: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 28,
    height: 7,
    alignItems: 'center',
  },
  dot: { height: 7, borderRadius: 3.5 },
  button: {
    borderRadius: 100,
    paddingHorizontal: 44,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  skip: { marginTop: 18 },
  skipText: {
    fontSize: 15,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
