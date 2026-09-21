// Recently Deleted: moments removed in the last 30 days.
// Restore them, delete them forever, or empty the whole trash.

import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import {
  deleteForever,
  emptyTrash,
  loadTrash,
  restoreMoment,
  TRASH_RETENTION_DAYS,
  type TrashedMoment,
} from '../storage';
import { useTheme } from '../theme';
import { MomentCard } from '../components/MomentCard';
import { displayTitle } from '../titles';

function daysLeft(deletedAt: string): number {
  const ageDays =
    (Date.now() - new Date(deletedAt).getTime()) / 86_400_000;
  return Math.max(0, Math.ceil(TRASH_RETENTION_DAYS - ageDays));
}

export default function TrashScreen() {
  const theme = useTheme();
  const [trash, setTrash] = useState<TrashedMoment[]>([]);

  const reload = useCallback(async () => {
    setTrash(await loadTrash());
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function handleRestore(item: TrashedMoment) {
    await restoreMoment(item.id);
    reload();
  }

  function handleDeleteForever(item: TrashedMoment) {
    Alert.alert(
      'Delete forever?',
      `“${displayTitle(item)}” will be gone for good.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            setTrash(await deleteForever(item.id));
          },
        },
      ],
    );
  }

  function handleEmptyTrash() {
    if (trash.length === 0) return;
    Alert.alert(
      'Empty Recently Deleted?',
      `${trash.length} ${trash.length === 1 ? 'moment' : 'moments'} will be gone for good.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty trash',
          style: 'destructive',
          onPress: async () => {
            await emptyTrash();
            reload();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />

      <View
        style={[
          styles.navBar,
          { borderBottomColor: theme.separator, backgroundColor: theme.background },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.navSide}>
          <Text style={[styles.back, { color: theme.text }]}>‹ Moments</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>
          Recently Deleted
        </Text>
        <Pressable
          onPress={handleEmptyTrash}
          disabled={trash.length === 0}
          hitSlop={12}
          style={styles.navSide}
        >
          <Text
            style={[
              styles.emptyAction,
              { color: theme.text, opacity: trash.length === 0 ? 0.3 : 1 },
            ]}
          >
            Empty
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={trash}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.hint, { color: theme.secondaryText }]}>
            Deleted moments stay here for {TRASH_RETENTION_DAYS} days.
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Nothing deleted
            </Text>
            <Text style={[styles.emptySub, { color: theme.secondaryText }]}>
              Moments you delete will rest here for {TRASH_RETENTION_DAYS} days.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.cardGrow}>
              <MomentCard moment={item} theme={theme} />
            </View>
            <Text style={[styles.countdown, { color: theme.secondaryText }]}>
              {daysLeft(item.deletedAt)}d left
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => handleRestore(item)}
                hitSlop={10}
                style={[styles.pill, { backgroundColor: theme.text }]}
              >
                <Text style={[styles.pillText, { color: theme.onText }]}>
                  Restore
                </Text>
              </Pressable>
              <Pressable onPress={() => handleDeleteForever(item)} hitSlop={10}>
                <Text
                  style={[styles.forever, { color: theme.secondaryText }]}
                >
                  Delete forever
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navSide: { minWidth: 80 },
  back: { fontSize: 17 },
  navTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  emptyAction: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
  },
  hint: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.7,
  },
  row: { gap: 10 },
  cardGrow: { flex: 1 },
  countdown: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  forever: {
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  separator: { height: 28 },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptySub: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
