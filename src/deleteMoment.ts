import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { deleteMoment } from './storage';

/** Long-press delete: confirm, move to Recently Deleted, then reload. */
export function confirmDeleteMoment(id: string, onDeleted: () => void): void {
  Alert.alert('Delete moment?', 'It moves to Recently Deleted for 30 days.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {
          // Garnish, not load-bearing.
        }
        await deleteMoment(id);
        onDeleted();
      },
    },
  ]);
}
