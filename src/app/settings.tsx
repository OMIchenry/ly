// Settings: backup & restore, Face ID lock, and the nuclear option.
// Export writes a versioned JSON backup and opens the share sheet;
// import restores one; delete-all wipes every @ly:* key after a
// double confirmation gated on Face ID / device authentication.

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  exportBackup,
  importBackup,
  storedMomentCount,
  wipeAllData,
} from '../export';
import { authenticate, lockAvailable } from '../lock';
import { useLock } from '../components/LockGate';
import { useTheme } from '../theme';
import type { Theme } from '../theme';

function Row({
  label,
  sub,
  danger,
  busy,
  onPress,
  theme,
}: {
  label: string;
  sub: string;
  danger?: boolean;
  busy?: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  return (
    <Pressable onPress={onPress} disabled={busy} style={styles.row}>
      <View style={styles.rowText}>
        <Text
          style={[styles.rowLabel, { color: danger ? '#B3261E' : theme.text }]}
        >
          {label}
        </Text>
        <Text style={[styles.rowSub, { color: theme.secondaryText }]}>{sub}</Text>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={theme.secondaryText} />
      ) : (
        <Text style={[styles.chevron, { color: theme.secondaryText }]}>›</Text>
      )}
    </Pressable>
  );
}

function Kicker({ children, theme }: { children: string; theme: Theme }) {
  return (
    <View style={styles.kickerRow}>
      <View style={[styles.kickerLine, { backgroundColor: theme.separator }]} />
      <Text style={[styles.kicker, { color: theme.secondaryText }]}>
        {children}
      </Text>
      <View style={[styles.kickerLine, { backgroundColor: theme.separator }]} />
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const [momentCount, setMomentCount] = useState(0);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const { lockEnabled, toggleLock } = useLock();

  useFocusEffect(
    useCallback(() => {
      storedMomentCount().then(setMomentCount);
    }, []),
  );

  async function handleExport() {
    if (busy) return;
    setBusy('export');
    try {
      const result = await exportBackup();
      if (result === 'unavailable') {
        Alert.alert(
          'Sharing not available',
          'This device cannot open the share sheet right now.',
        );
      } else {
        try {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        } catch {
          // Garnish.
        }
      }
    } catch {
      Alert.alert('Export failed', 'The backup could not be written.');
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    if (busy) return;
    Alert.alert(
      'Restore a backup?',
      'This replaces everything currently in LY with the backup file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose file',
          onPress: async () => {
            setBusy('import');
            try {
              const count = await importBackup();
              if (count === null) return; // user cancelled the picker
              setMomentCount(count);
              try {
                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              } catch {
                // Garnish.
              }
              Alert.alert(
                'Backup restored',
                `${count} ${count === 1 ? 'moment' : 'moments'} restored.`,
              );
            } catch (e) {
              Alert.alert(
                'Could not restore',
                e instanceof Error ? e.message : 'That file did not work.',
              );
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  }

  async function handleToggleLock() {
    const result = await toggleLock();
    if (result === 'unavailable') {
      const available = await lockAvailable();
      Alert.alert(
        'Not available',
        available
          ? 'Authentication was cancelled.'
          : 'This device has no biometric or passcode authentication set up.',
      );
    }
  }

  function handleDeleteAll() {
    Alert.alert(
      'Delete all data?',
      `This permanently erases all ${momentCount} moments, your streak, collections, and settings. There is no undo.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Last chance',
              'Are you absolutely sure? Authenticate to confirm.',
              [
                { text: 'Keep my data', style: 'cancel' },
                {
                  text: 'Yes, erase it all',
                  style: 'destructive',
                  onPress: async () => {
                    const ok = await authenticate('Confirm erasing all LY data');
                    if (!ok) return;
                    try {
                      await wipeAllData();
                      try {
                        await Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success,
                        );
                      } catch {
                        // Garnish.
                      }
                      setMomentCount(0);
                      Alert.alert('Done', 'All LY data has been erased.');
                    } catch {
                      Alert.alert(
                        'Something went wrong',
                        'The data could not be fully erased.',
                      );
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}>
          Settings
        </Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <Kicker theme={theme}>Your data</Kicker>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.summary, { color: theme.secondaryText }]}>
            {momentCount} {momentCount === 1 ? 'moment' : 'moments'} kept on
            this device · local only
          </Text>
          <View style={[styles.divider, { backgroundColor: theme.separator }]} />
          <Row
            label="Export all memories"
            sub="Save a backup file — share it to Files or AirDrop"
            busy={busy === 'export'}
            onPress={handleExport}
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.separator }]} />
          <Row
            label="Import backup"
            sub="Restore from a backup file you exported"
            busy={busy === 'import'}
            onPress={handleImport}
            theme={theme}
          />
        </View>

        <Kicker theme={theme}>Privacy</Kicker>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Row
            label={`Face ID Lock: ${lockEnabled ? 'On' : 'Off'}`}
            sub="Require authentication to open LY"
            onPress={handleToggleLock}
            theme={theme}
          />
        </View>

        <Kicker theme={theme}>Danger zone</Kicker>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Row
            label="Delete all data"
            sub="Erase every moment, streak, and setting"
            danger
            onPress={handleDeleteAll}
            theme={theme}
          />
        </View>

        <Text style={[styles.footnote, { color: theme.secondaryText }]}>
          LY keeps everything on this device. Backups are yours to keep
          wherever you like — LY never sees them.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 30, fontWeight: '300', marginTop: -2 },
  title: { fontSize: 24, letterSpacing: 0.3 },
  list: { paddingHorizontal: 20, paddingBottom: 48 },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    marginBottom: 14,
  },
  kickerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  kicker: { fontSize: 12, letterSpacing: 2.5, textTransform: 'uppercase' },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  summary: {
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingVertical: 14,
  },
  divider: { height: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 17, letterSpacing: 0.2, fontWeight: '500' },
  rowSub: { marginTop: 3, fontSize: 13, letterSpacing: 0.2, lineHeight: 18 },
  chevron: { fontSize: 22, fontWeight: '300' },
  footnote: {
    marginTop: 24,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
