import { Stack } from 'expo-router';
import '../notifications'; // Registers the notification handler once.
import { LockProvider } from '../components/LockGate';

export default function Layout() {
  return (
    <LockProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen name="index" />
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
