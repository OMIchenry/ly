import { useEffect, useState } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../notifications'; // Registers the notification handler once.
import { LockProvider } from '../components/LockGate';
import { ONBOARDED_KEY } from './onboarding';

/** First launch goes to onboarding; every launch after goes home. */
function OnboardingGate() {
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => {
        if (v !== '1' && pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
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
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="map" />
        <Stack.Screen name="photos" />
        <Stack.Screen name="trash" />
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
