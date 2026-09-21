import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { newId, saveMoment } from '../storage';
import { useTheme } from '../theme';
import { choosePhoto } from '../photo';
import { captureContext } from '../context';
import { DEFAULT_PHOTO_SHAPE, photoFrameStyle, type PhotoShape } from '../shapes';
import { generateTitle } from '../titles';
import { ShapePicker } from '../components/ShapePicker';
import { VoicePlayer, VoiceRecorder } from '../components/VoiceNote';

export default function NewMomentScreen() {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoShape, setPhotoShape] = useState<PhotoShape>(DEFAULT_PHOTO_SHAPE);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = text.trim().length > 0 && !saving;

  // Live title suggestion from what we know so far (text + time of day).
  // Location and weather join in at save time.
  const titleSuggestion = useMemo(
    () => generateTitle({ text, createdAt: new Date().toISOString() }),
    [text],
  );

  async function handleChoosePhoto() {
    const uri = await choosePhoto();
    if (uri) setPhotoUri(uri);
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      // Quietly stamp location + weather — never blocks the save.
      const ctx = await captureContext();
      const createdAt = new Date().toISOString();
      const trimmed = text.trim();
      // Untouched title field → generate from full context (now including
      // location + weather). Cleared field → same. Custom text → keep it.
      const finalTitle =
        (titleTouched && title.trim()) ||
        generateTitle({
          text: trimmed,
          createdAt,
          locationName: ctx.locationName,
          weather: ctx.weather,
        });
      await saveMoment({
        id: newId(),
        title: finalTitle,
        text: trimmed,
        photoUri,
        photoShape,
        audioUri,
        locationName: ctx.locationName,
        weather: ctx.weather,
        latitude: ctx.latitude,
        longitude: ctx.longitude,
        createdAt,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* iOS-style navigation bar */}
        <View
          style={[
            styles.navBar,
            { borderBottomColor: theme.separator, backgroundColor: theme.background },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.navSide}
          >
            <Text style={[styles.navAction, { color: theme.text }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>
            New Moment
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            hitSlop={12}
            style={styles.navSide}
            accessibilityLabel="Save moment"
          >
            <Text
              style={[
                styles.navAction,
                styles.navSave,
                { color: theme.text, opacity: canSave ? 1 : 0.3 },
              ]}
            >
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ShapePicker value={photoShape} onChange={setPhotoShape} theme={theme} />
          <Pressable
            style={[
              styles.photoWell,
              photoFrameStyle(photoShape),
              photoShape === 'circle' ? styles.photoWellCircle : styles.photoWellTall,
              { backgroundColor: theme.well },
            ]}
            onPress={handleChoosePhoto}
            accessibilityLabel="Add a photo"
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <View
                  style={[styles.addCircle, { backgroundColor: theme.text }]}
                >
                  <Text style={[styles.addCirclePlus, { color: theme.onText }]}>+</Text>
                </View>
                <Text style={[styles.addPhotoText, { color: theme.secondaryText }]}>
                  Add a photo
                </Text>
              </View>
            )}
          </Pressable>
          {photoUri ? (
            <Pressable onPress={handleChoosePhoto} hitSlop={8}>
              <Text style={[styles.changePhoto, { color: theme.secondaryText }]}>
                Change photo
              </Text>
            </Pressable>
          ) : null}

          <View style={[styles.titleCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.titleLabel, { color: theme.secondaryText }]}>
              {titleTouched ? 'Title' : 'Title · auto'}
            </Text>
            <TextInput
              style={[styles.titleInput, { color: theme.text }]}
              value={titleTouched ? title : titleSuggestion}
              onChangeText={(t) => {
                setTitle(t);
                setTitleTouched(true);
              }}
              placeholder="Title"
              placeholderTextColor={theme.secondaryText}
              accessibilityLabel="Moment title"
            />
          </View>

          <View style={[styles.textCard, { backgroundColor: theme.card }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="What do you want to remember?"
              placeholderTextColor={theme.secondaryText}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
            />
          </View>

          <View style={styles.voiceBlock}>
            {audioUri ? (
              <View style={styles.audioRow}>
                <View style={styles.audioRowGrow}>
                  <VoicePlayer uri={audioUri} theme={theme} />
                </View>
                <Pressable onPress={() => setAudioUri(null)} hitSlop={10}>
                  <Text style={[styles.removeAudio, { color: theme.secondaryText }]}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            ) : (
              <VoiceRecorder theme={theme} onDone={setAudioUri} />
            )}
          </View>

          <Text style={[styles.contextHint, { color: theme.secondaryText }]}>
            Location & weather are stamped automatically
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navSide: {
    minWidth: 64,
  },
  navAction: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
  navSave: {
    fontWeight: '600',
    textAlign: 'right',
  },
  navTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  // Signature arch frame for the photo.
  photoWell: {
    marginTop: 14,
    overflow: 'hidden',
  },
  photoWellTall: {
    height: 320,
  },
  photoWellCircle: {
    aspectRatio: 1,
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
  addCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCirclePlus: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '300',
    marginTop: -2,
  },
  addPhotoText: {
    marginTop: 14,
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  changePhoto: {
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
  input: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0.2,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  voiceBlock: {
    marginTop: 16,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioRowGrow: {
    flex: 1,
  },
  removeAudio: {
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  contextHint: {
    marginTop: 20,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    opacity: 0.7,
  },
});
