// App-wide Face ID lock. Wrap the navigator in <LockProvider>; any screen
// can read or toggle the setting with useLock(). When locked, a monochrome
// gate covers the whole app until authentication succeeds.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import {
  authenticate,
  getLockEnabled,
  lockAvailable,
  setLockEnabled,
} from '../lock';

interface LockState {
  lockEnabled: boolean;
  locked: boolean;
  lockNow: () => void;
  toggleLock: () => Promise<'enabled' | 'disabled' | 'unavailable' | 'denied'>;
}

const LockContext = createContext<LockState | null>(null);

export function useLock(): LockState {
  const ctx = useContext(LockContext);
  if (!ctx) throw new Error('useLock must be used inside LockProvider');
  return ctx;
}

function LockGlyph({ color }: { color: string }) {
  return (
    <View style={styles.glyphWrap}>
      <View style={[styles.glyphBody, { borderColor: color }]}>
        <View style={[styles.glyphHole, { backgroundColor: color }]} />
      </View>
      <View style={[styles.glyphShackle, { borderColor: color }]} />
    </View>
  );
}

function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);

  async function tryUnlock() {
    const ok = await authenticate();
    if (ok) {
      setFailed(false);
      onUnlocked();
    } else {
      setFailed(true);
    }
  }

  return (
    <View style={[styles.gate, { backgroundColor: theme.background }]}>
      <LockGlyph color={theme.text} />
      <Text style={[styles.gateTitle, { color: theme.text }]}>LY is locked</Text>
      <Text style={[styles.gateSub, { color: theme.secondaryText }]}>
        {failed ? 'Try again' : 'Your memories are private'}
      </Text>
      <Pressable
        onPress={tryUnlock}
        style={[styles.unlockButton, { backgroundColor: theme.text }]}
        accessibilityLabel="Unlock LY"
      >
        <Text style={[styles.unlockText, { color: theme.onText }]}>Unlock</Text>
      </Pressable>
    </View>
  );
}

export function LockProvider({ children }: { children: ReactNode }) {
  const [lockEnabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const enabledRef = useRef(false);

  useEffect(() => {
    (async () => {
      const [enabled, available] = await Promise.all([
        getLockEnabled(),
        lockAvailable(),
      ]);
      const active = enabled && available;
      enabledRef.current = active;
      setEnabled(active);
      setLocked(active);
      setReady(true);
    })();
  }, []);

  // Re-lock whenever the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && enabledRef.current) setLocked(true);
    });
    return () => sub.remove();
  }, []);

  const lockNow = useCallback(() => {
    if (enabledRef.current) setLocked(true);
  }, []);

  const toggleLock = useCallback(async () => {
    if (enabledRef.current) {
      await setLockEnabled(false);
      enabledRef.current = false;
      setEnabled(false);
      setLocked(false);
      return 'disabled' as const;
    }
    if (!(await lockAvailable())) return 'unavailable' as const;
    const ok = await authenticate('Enable Face ID lock for LY');
    if (!ok) return 'denied' as const;
    try {
      await setLockEnabled(true);
    } catch {
      return 'denied' as const;
    }
    enabledRef.current = true;
    setEnabled(true);
    return 'enabled' as const;
  }, []);

  return (
    <LockContext.Provider
      value={{ lockEnabled, locked, lockNow, toggleLock }}
    >
      {children}
      {ready && locked ? (
        <LockScreen onUnlocked={() => setLocked(false)} />
      ) : null}
    </LockContext.Provider>
  );
}

const styles = StyleSheet.create({
  gate: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    zIndex: 100,
  },
  glyphWrap: {
    width: 56,
    height: 68,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 28,
  },
  glyphShackle: {
    position: 'absolute',
    top: 0,
    width: 30,
    height: 30,
    borderWidth: 5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  glyphBody: {
    width: 48,
    height: 40,
    borderWidth: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gateTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  gateSub: {
    marginTop: 10,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  unlockButton: {
    marginTop: 36,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 100,
  },
  unlockText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
