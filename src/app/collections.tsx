// Collections: user-created groupings of moments.
// Create, rename, and delete; each row shows a cover photo and count.

import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { loadMoments } from '../storage';
import {
  collectionCover,
  createCollection,
  deleteCollection,
  loadCollections,
} from '../collections';
import { useTheme } from '../theme';
import type { Theme } from '../theme';
import type { Collection, Moment } from '../types';

function CollectionCard({
  collection,
  moments,
  theme,
  onDelete,
}: {
  collection: Collection;
  moments: Moment[];
  theme: Theme;
  onDelete: () => void;
}) {
  const cover = collectionCover(collection, moments);
  return (
    <Pressable
      onPress={() => router.push(`/collection/${collection.id}`)}
      onLongPress={onDelete}
      delayLongPress={400}
      style={[styles.card, { backgroundColor: theme.card }]}
      accessibilityLabel={collection.name}
    >
      {cover ? (
        <Image source={{ uri: cover }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverEmpty, { backgroundColor: theme.well }]}>
          <Text style={[styles.coverGlyph, { color: theme.secondaryText }]}>
            ✳
          </Text>
        </View>
      )}
      <View style={styles.body}>
        <Text
          style={[styles.name, { color: theme.text, fontFamily: theme.serif }]}
          numberOfLines={2}
        >
          {collection.name}
        </Text>
        <Text style={[styles.meta, { color: theme.secondaryText }]}>
          {collection.momentIds.length === 0
            ? 'Empty'
            : `${collection.momentIds.length} ${
                collection.momentIds.length === 1 ? 'moment' : 'moments'
              }`}
        </Text>
      </View>
    </Pressable>
  );
}

export default function CollectionsScreen() {
  const theme = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [draft, setDraft] = useState('');

  const reload = useCallback(async () => {
    const [m, c] = await Promise.all([loadMoments(), loadCollections()]);
    setMoments(m);
    setCollections(c);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function create() {
    const name = draft.trim();
    if (!name) return;
    setCollections(await createCollection(name));
    setDraft('');
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Garnish.
    }
  }

  function confirmDelete(collection: Collection) {
    Alert.alert(
      `Delete “${collection.name}”?`,
      'The moments stay — only the collection goes away.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setCollections(await deleteCollection(collection.id));
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
          Collections
        </Text>
        <View style={styles.back} />
      </View>

      <View style={[styles.createRow, { backgroundColor: theme.well }]}>
        <TextInput
          style={[styles.createInput, { color: theme.text }]}
          value={draft}
          onChangeText={setDraft}
          placeholder="New collection — “Japan trip”"
          placeholderTextColor={theme.secondaryText}
          returnKeyType="done"
          onSubmitEditing={create}
        />
        <Pressable onPress={create} hitSlop={8} disabled={!draft.trim()}>
          <Text
            style={[
              styles.createButton,
              { color: theme.text, opacity: draft.trim() ? 1 : 0.3 },
            ]}
          >
            Create
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No collections yet
            </Text>
            <Text style={[styles.emptySub, { color: theme.secondaryText }]}>
              Group moments into trips, projects, or themes.{'\n'}
              Add moments from any moment’s detail screen.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <CollectionCard
              collection={item}
              moments={moments}
              theme={theme}
              onDelete={() => confirmDelete(item)}
            />
          </View>
        )}
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
  title: { fontSize: 24, letterSpacing: 0.3 },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  createInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  createButton: {
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  list: { paddingHorizontal: 20, paddingBottom: 48 },
  row: { gap: 14, marginBottom: 14 },
  cell: { flex: 1 },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cover: {
    width: '100%',
    aspectRatio: 1.2,
  },
  coverEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverGlyph: {
    fontSize: 34,
    fontWeight: '300',
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  name: {
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0.2,
  },
  meta: {
    marginTop: 5,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
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
