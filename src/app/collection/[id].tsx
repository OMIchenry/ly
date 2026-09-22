// Collection detail: the moments inside one collection.
// Rename via the title tap; remove moments with a long-press.

import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { loadMoments } from '../../storage';
import {
  collectionMoments,
  loadCollections,
  renameCollection,
  toggleMomentInCollection,
} from '../../collections';
import { useTheme } from '../../theme';
import { MomentCard } from '../../components/MomentCard';
import type { Collection, Moment } from '../../types';

export default function CollectionDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');

  const reload = useCallback(async () => {
    const [m, c] = await Promise.all([loadMoments(), loadCollections()]);
    setMoments(m);
    setCollection(c.find((col) => col.id === id) ?? null);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function saveRename() {
    if (!collection) return;
    const name = draft.trim();
    setRenaming(false);
    if (!name || name === collection.name) return;
    const updated = await renameCollection(collection.id, name);
    setCollection(updated.find((c) => c.id === id) ?? collection);
  }

  function removeMoment(momentId: string) {
    if (!collection) return;
    Alert.alert('Remove from collection?', 'The moment itself is kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = await toggleMomentInCollection(collection.id, momentId);
          setCollection(updated.find((c) => c.id === id) ?? null);
        },
      },
    ]);
  }

  const inCollection = collection ? collectionMoments(collection, moments) : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </Pressable>
        {renaming ? (
          <TextInput
            style={[
              styles.renameInput,
              { color: theme.text, fontFamily: theme.serif },
            ]}
            value={draft}
            onChangeText={setDraft}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={saveRename}
            onBlur={saveRename}
          />
        ) : (
          <Pressable
            onPress={() => {
              setDraft(collection?.name ?? '');
              setRenaming(true);
            }}
            hitSlop={8}
          >
            <Text
              style={[styles.title, { color: theme.text, fontFamily: theme.serif }]}
              numberOfLines={1}
            >
              {collection?.name ?? 'Collection'}
            </Text>
          </Pressable>
        )}
        <View style={styles.back} />
      </View>

      <FlatList
        data={inCollection}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/moment/${item.id}`)}
            onLongPress={() => removeMoment(item.id)}
            delayLongPress={400}
          >
            <MomentCard moment={item} theme={theme} />
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.count, { color: theme.secondaryText }]}>
            {inCollection.length === 0
              ? 'Empty — long-press a moment anywhere to add it'
              : `${inCollection.length} ${
                  inCollection.length === 1 ? 'moment' : 'moments'
                } · tap title to rename`}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptySub, { color: theme.secondaryText }]}>
              Open any moment and use “Add to collection” to fill this up.
            </Text>
          </View>
        }
      />
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
  title: { fontSize: 22, letterSpacing: 0.3 },
  renameInput: {
    fontSize: 22,
    letterSpacing: 0.3,
    textAlign: 'center',
    minWidth: 180,
  },
  list: { paddingHorizontal: 20, paddingBottom: 48, gap: 20 },
  count: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptySub: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
