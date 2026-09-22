import { useEffect } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../notifications'; // Registers the notification handler once.
import { LockProvider } from '../components/LockGate';
import { ONBOARDED_KEY } from './onboarding';

/** First launch goes to onboarding; every launch after goes home. */
function OnboardingGate() {
  const pathname = usePathname();

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => {
        if (v !== '1' && pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
      })
      .catch(() => {});
  }, [pathname]);

  return null;
}

export default function Layout() {
  return (
    <LockProvider>
      <OnboardingGate />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="deck" />
        <Stack.Screen name="moment/[id]" />
        <Stack.Screen
          name="new"
          options={{
            presentation: 'modal',
            gestureEnabled: true,
          }}
        />
      </Stack>
    </LockProvider>
  );
}
