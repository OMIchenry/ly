// CollectionPicker: a modal sheet to add/remove a moment from
// the user's collections, with inline "new collection" creation.
// Used by the moment detail screen and the memory deck.

import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  createCollection,
  loadCollections,
  toggleMomentInCollection,
} from '../collections';
import { useTheme } from '../theme';
import type { Collection } from '../types';

export function CollectionPicker({
  visible,
  momentId,
  onClose,
}: {
  visible: boolean;
  momentId: string;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    loadCollections().then((cols) => {
      if (cancelled) return;
      setCollections(cols);
      setDraft('');
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  async function toggle(collectionId: string) {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Garnish.
    }
    const updated = await toggleMomentInCollection(collectionId, momentId);
    setCollections(updated);
  }

  async function create() {
    const name = draft.trim();
    if (!name) return;
    const updated = await createCollection(name);
    setCollections(updated);
    setDraft('');
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Garnish.
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.card }]}>
        <View style={[styles.grabber, { backgroundColor: theme.separator }]} />
        <Text
          style={[
            styles.title,
            { color: theme.text, fontFamily: theme.serif },
          ]}
        >
          Add to collection
        </Text>

        <View style={[styles.createRow, { backgroundColor: theme.well }]}>
          <TextInput
            style={[styles.createInput, { color: theme.text }]}
            value={draft}
            onChangeText={setDraft}
            placeholder="New collection name"
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
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.secondaryText }]}>
              No collections yet — create one above.
            </Text>
          }
          renderItem={({ item }) => {
            const has = item.momentIds.includes(momentId);
            return (
              <Pressable
                onPress={() => toggle(item.id)}
                style={styles.row}
                accessibilityLabel={`Toggle ${item.name}`}
              >
                <View
                  style={[
                    styles.check,
                    {
                      borderColor: theme.secondaryText,
                      backgroundColor: has ? theme.text : 'transparent',
                    },
                  ]}
                >
                  {has ? (
                    <Text style={[styles.checkMark, { color: theme.onText }]}>
                      ✓
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[styles.rowName, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={[styles.rowCount, { color: theme.secondaryText }]}>
                  {item.momentIds.length}
                </Text>
              </Pressable>
            );
          }}
        />

        <Pressable
          onPress={onClose}
          style={[styles.doneButton, { backgroundColor: theme.text }]}
        >
          <Text style={[styles.doneText, { color: theme.onText }]}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    letterSpacing: 0.3,
    marginBottom: 16,
    textAlign: 'center',
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
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
  list: {
    marginTop: 8,
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    paddingVertical: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 14,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: -1,
  },
  rowName: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  rowCount: {
    fontSize: 12,
    letterSpacing: 1,
  },
  doneButton: {
    marginTop: 16,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
