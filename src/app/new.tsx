import { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { newId, saveMoment } from '../storage';
import { useTheme } from '../theme';

async function pickFromLibrary(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'LY needs photo access to attach pictures.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'LY needs camera access to take pictures.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

export default function NewMomentScreen() {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = text.trim().length > 0 && !saving;

  function choosePhotoSource() {
    const onTake = async () => {
      const uri = await takePhoto();
      if (uri) setPhotoUri(uri);
    };
    const onLibrary = async () => {
      const uri = await pickFromLibrary();
      if (uri) setPhotoUri(uri);
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) void onTake();
          else if (index === 2) void onLibrary();
        },
      );
    } else {
      Alert.alert('Add a photo', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => void onTake() },
        { text: 'Choose from Library', onPress: () => void onLibrary() },
      ]);
    }
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveMoment({
        id: newId(),
        text: text.trim(),
        photoUri,
        createdAt: new Date().toISOString(),
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
          <Pressable
            style={[styles.archWell, { backgroundColor: theme.well }]}
            onPress={choosePhotoSource}
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
            <Pressable onPress={choosePhotoSource} hitSlop={8}>
              <Text style={[styles.changePhoto, { color: theme.secondaryText }]}>
                Change photo
              </Text>
            </Pressable>
          ) : null}

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
  archWell: {
    height: 320,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
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
  input: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0.2,
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
