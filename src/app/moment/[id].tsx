import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { deleteMoment, loadMoments, updateMoment } from '../../storage';
import { useTheme } from '../../theme';
import { choosePhoto } from '../../photo';
import { DEFAULT_PHOTO_SHAPE, photoFrameStyle, type PhotoShape } from '../../shapes';
import { MomentPhoto } from '../../components/MomentPhoto';
import { ShapePicker } from '../../components/ShapePicker';
import { VoicePlayer, VoiceRecorder } from '../../components/VoiceNote';
import { formatDate } from '../../components/MomentCard';
import { displayTitle, generateTitle } from '../../titles';
import type { Moment } from '../../types';

function metaLine(moment: Moment): string {
  const parts = [formatDate(moment.createdAt)];
  if (moment.locationName) parts.push(moment.locationName);
  if (moment.weather) parts.push(`${moment.weather.tempC}° ${moment.weather.label}`);
  return parts.join('  ·  ');
}

export default function MomentDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftTitleTouched, setDraftTitleTouched] = useState(false);
  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [draftShape, setDraftShape] = useState<PhotoShape>(DEFAULT_PHOTO_SHAPE);
  const [draftAudio, setDraftAudio] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMoments().then((all) => {
        const found = all.find((m) => m.id === id) ?? null;
        setMoment(found);
        setEditing(false);
      });
    }, [id]),
  );

  function beginEdit() {
    if (!moment) return;
    setDraftText(moment.text);
    setDraftTitle(moment.title ?? '');
    setDraftTitleTouched(!!(moment.title ?? '').trim());
    setDraftPhoto(moment.photoUri);
    setDraftShape(moment.photoShape ?? DEFAULT_PHOTO_SHAPE);
    setDraftAudio(moment.audioUri ?? null);
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!moment || draftText.trim().length === 0 || saving) return;
    setSaving(true);
    try {
      const trimmedText = draftText.trim();
      const finalTitle =
        (draftTitleTouched && draftTitle.trim()) ||
        generateTitle({
          text: trimmedText,
          createdAt: moment.createdAt,
          locationName: moment.locationName,
          weather: moment.weather,
        });
      const updated = await updateMoment(moment.id, {
        title: finalTitle,
        text: trimmedText,
        photoUri: draftPhoto,
        photoShape: draftShape,
        audioUri: draftAudio,
      });
      const found = updated.find((m) => m.id === moment.id) ?? null;
      setMoment(found);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!moment) return;
    Alert.alert(
      'Delete this moment?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMoment(moment.id);
            router.back();
          },
        },
      ],
    );
  }

  async function changePhoto() {
    const uri = await choosePhoto();
    if (uri) setDraftPhoto(uri);
  }

  if (!moment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />

      {/* Nav bar */}
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
          {editing ? 'Edit' : 'Moment'}
        </Text>
        {editing ? (
          <Pressable
            onPress={handleSaveEdit}
            disabled={draftText.trim().length === 0 || saving}
            hitSlop={12}
            style={styles.navSide}
          >
            <Text
              style={[
                styles.navAction,
                {
                  color: theme.text,
                  opacity: draftText.trim().length === 0 || saving ? 0.3 : 1,
                },
              ]}
            >
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={beginEdit} hitSlop={12} style={styles.navSide}>
            <Text style={[styles.navAction, { color: theme.text }]}>Edit</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {editing ? (
          <>
            <ShapePicker value={draftShape} onChange={setDraftShape} theme={theme} />
            <Pressable
              style={[
                styles.photoWell,
                photoFrameStyle(draftShape),
                draftShape === 'circle' ? styles.photoWellCircle : styles.photoWellTall,
                { backgroundColor: theme.well },
              ]}
              onPress={changePhoto}
            >
              {draftPhoto ? (
                <Image source={{ uri: draftPhoto }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={[styles.addPhotoText, { color: theme.secondaryText }]}>
                    Add a photo
                  </Text>
                </View>
              )}
            </Pressable>
            {draftPhoto ? (
              <Pressable onPress={() => setDraftPhoto(null)} hitSlop={8}>
                <Text style={[styles.smallAction, { color: theme.secondaryText }]}>
                  Remove photo
                </Text>
              </Pressable>
            ) : null}

            <View style={[styles.titleCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.titleLabel, { color: theme.secondaryText }]}>
                {draftTitleTouched ? 'Title' : 'Title · auto'}
              </Text>
              <TextInput
                style={[styles.titleInput, { color: theme.text }]}
                value={
                  draftTitleTouched
                    ? draftTitle
                    : generateTitle({
                        text: draftText,
                        createdAt: moment.createdAt,
                        locationName: moment.locationName,
                        weather: moment.weather,
                      })
                }
                onChangeText={(t) => {
                  setDraftTitle(t);
                  setDraftTitleTouched(true);
                }}
                placeholder="Title"
                placeholderTextColor={theme.secondaryText}
                accessibilityLabel="Moment title"
              />
            </View>

            <View style={[styles.textCard, { backgroundColor: theme.card }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={draftText}
                onChangeText={setDraftText}
                multiline
                autoFocus
              />
            </View>

            <View style={styles.voiceBlock}>
              {draftAudio ? (
                <View style={styles.audioRow}>
                  <View style={styles.audioRowGrow}>
                    <VoicePlayer uri={draftAudio} theme={theme} />
                  </View>
                  <Pressable onPress={() => setDraftAudio(null)} hitSlop={10}>
                    <Text style={[styles.smallAction, { color: theme.secondaryText }]}>
                      Remove
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <VoiceRecorder theme={theme} onDone={setDraftAudio} />
              )}
            </View>

            <Pressable onPress={() => setEditing(false)} hitSlop={8}>
              <Text style={[styles.smallAction, { color: theme.secondaryText }]}>
                Cancel editing
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {moment.photoUri ? (
              <MomentPhoto
                uri={moment.photoUri}
                shape={moment.photoShape ?? DEFAULT_PHOTO_SHAPE}
                height={320}
                style={styles.photoView}
              />
            ) : null}
            <Text style={[styles.detailTitle, { color: theme.text }]}>
              {displayTitle(moment)}
            </Text>
            {displayTitle(moment) !== moment.text ? (
              <Text style={[styles.text, { color: theme.text }]}>{moment.text}</Text>
            ) : null}
            <Text style={[styles.meta, { color: theme.secondaryText }]}>
              {metaLine(moment)}
            </Text>
            {moment.audioUri ? (
              <View style={styles.voiceBlock}>
                <VoicePlayer uri={moment.audioUri} theme={theme} />
              </View>
            ) : null}
            <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteWrap}>
              <Text style={[styles.delete, { color: theme.secondaryText }]}>
                Delete this moment
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navSide: { minWidth: 80, alignItems: 'flex-end' },
  back: { fontSize: 17 },
  navTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  navAction: { fontSize: 17, fontWeight: '600' },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
  },
  archWrap: {
    height: 320,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
    marginBottom: 24,
  },
  photoWell: {
    marginTop: 14,
    overflow: 'hidden',
  },
  photoWellTall: {
    height: 280,
  },
  photoWellCircle: {
    aspectRatio: 1,
  },
  photoView: {
    marginBottom: 24,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  smallAction: {
    marginTop: 14,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  textCard: {
    marginTop: 20,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  titleCard: {
    marginTop: 20,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 16,
  },
  titleLabel: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  titleInput: {
    marginTop: 6,
    fontSize: 19,
    lineHeight: 26,
    letterSpacing: 0.2,
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0.2,
    fontWeight: '600',
    marginBottom: 14,
  },
  input: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0.2,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  text: {
    fontSize: 22,
    lineHeight: 32,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  meta: {
    marginTop: 16,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  voiceBlock: {
    marginTop: 22,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioRowGrow: {
    flex: 1,
  },
  deleteWrap: {
    marginTop: 36,
    alignItems: 'center',
  },
  delete: {
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
