// Export / import / wipe for LY's local data.
// A backup is a versioned JSON document holding every @ly:* key we own.
// Export writes it to a temp file and opens the iOS share sheet
// (Sharing.shareAsync) so it can be saved to Files, AirDropped, etc.
// Import reads a .json backup picked with the system document picker and
// replaces local data after the caller's confirmation.

import AsyncStorage from '@react-native-async-storage/async-storage';
// Legacy FileSystem API (SDK 57 moved it under /legacy; the top-level
// package now exports the new File/Directory/Paths API).
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const BACKUP_VERSION = 1;

/** Every AsyncStorage key LY owns. Wipe and export both work off this list. */
const LY_KEYS = [
  '@ly:moments:v1',
  '@ly:trash:v1',
  '@ly:egg:v1',
  '@ly:milestones:v1',
  '@ly:collections:v1',
  '@ly:lock-enabled:v1',
  '@ly:onboarded:v1',
];

export interface BackupDocument {
  app: 'LY';
  version: number;
  exportedAt: string;
  data: Record<string, string | null>;
}

function backupFileName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `ly-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

/** Assemble the backup document from AsyncStorage. */
export async function buildBackup(): Promise<BackupDocument> {
  const data: Record<string, string | null> = {};
  for (const key of LY_KEYS) {
    try {
      data[key] = await AsyncStorage.getItem(key);
    } catch {
      data[key] = null;
    }
  }
  return {
    app: 'LY',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Write the backup to a file and open the share sheet.
 * Returns 'shared' when the sheet opened, 'unavailable' when the
 * device cannot share, and throws on write failures.
 */
export async function exportBackup(): Promise<'shared' | 'unavailable'> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return 'unavailable';
  const backup = await buildBackup();
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) throw new Error('No writable directory available');
  const uri = `${base}${backupFileName()}`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup));
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'LY backup',
    UTI: 'public.json',
  });
  return 'shared';
}

function isBackupDocument(raw: unknown): raw is BackupDocument {
  if (typeof raw !== 'object' || raw === null) return false;
  const doc = raw as Partial<BackupDocument>;
  return (
    doc.app === 'LY' &&
    typeof doc.version === 'number' &&
    typeof doc.exportedAt === 'string' &&
    typeof doc.data === 'object' &&
    doc.data !== null
  );
}

/**
 * Let the user pick a backup file and restore it, replacing local data.
 * Returns the number of moments restored, or null when the user cancelled.
 * Throws when the file is not a valid LY backup.
 */
export async function importBackup(): Promise<number | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.[0]) return null;
  const uri = picked.assets[0].uri;
  const contents = await FileSystem.readAsStringAsync(uri);
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isBackupDocument(parsed)) {
    throw new Error('That file is not an LY backup.');
  }
  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(parsed.data)) {
    if (LY_KEYS.includes(key) && typeof value === 'string') {
      entries.push([key, value]);
    }
  }
  if (entries.length === 0) throw new Error('That backup is empty.');
  await AsyncStorage.multiSet(entries);
  // True replace: drop keys the backup did not include, so stale local
  // data cannot survive a restore.
  const restoredKeys = new Set(entries.map(([key]) => key));
  const missingKeys = LY_KEYS.filter((key) => !restoredKeys.has(key));
  if (missingKeys.length > 0) {
    await AsyncStorage.multiRemove(missingKeys);
  }
  // Best-effort cleanup of the picked copy.
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Non-fatal.
  }
  let momentCount = 0;
  try {
    const momentsRaw = parsed.data['@ly:moments:v1'];
    if (typeof momentsRaw === 'string') {
      const moments = JSON.parse(momentsRaw);
      if (Array.isArray(moments)) momentCount = moments.length;
    }
  } catch {
    // Non-fatal.
  }
  return momentCount;
}

/** Permanently delete every LY key from AsyncStorage. Cannot be undone. */
export async function wipeAllData(): Promise<void> {
  // Also sweep any stray @ly: keys we may have added in the future.
  const allKeys = await AsyncStorage.getAllKeys();
  const lyKeys = allKeys.filter((k) => k.startsWith('@ly:'));
  if (lyKeys.length > 0) {
    await AsyncStorage.multiRemove(lyKeys);
  }
}

/** How many moments are currently stored — for the settings screen summary. */
export async function storedMomentCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem('@ly:moments:v1');
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
