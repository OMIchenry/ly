import { ActionSheetIOS, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

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

/** Ask the user for a photo source, then return the picked image URI (or null). */
export function choosePhoto(): Promise<string | null> {
  return new Promise((resolve) => {
    const onTake = async () => resolve(await takePhoto());
    const onLibrary = async () => resolve(await pickFromLibrary());

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) void onTake();
          else if (index === 2) void onLibrary();
          else resolve(null);
        },
      );
    } else {
      Alert.alert('Add a photo', undefined, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Take Photo', onPress: () => void onTake() },
        { text: 'Choose from Library', onPress: () => void onLibrary() },
      ]);
    }
  });
}
