// Face ID / device lock for LY.
// The gate UI lives in components/LockGate.tsx; this module owns the
// persistent setting and the authentication calls.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const LOCK_KEY = '@ly:lock-enabled:v1';

/** True when the device can do biometric or passcode authentication. */
export async function lockAvailable(): Promise<boolean> {
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  } catch {
    return false;
  }
}

export async function getLockEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LOCK_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setLockEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCK_KEY, enabled ? '1' : '0');
  } catch {
    // A lock setting that can't persist shouldn't silently enable.
    if (enabled) throw new Error('Could not save lock setting');
  }
}

/** Prompt the user to authenticate. Passcode fallback stays enabled. */
export async function authenticate(reason?: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason ?? 'Unlock LY',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
