import { Alert } from 'react-native';
import { deleteMoment } from './storage';

/** Long-press delete: confirm, remove, then let the caller reload. */
export function confirmDeleteMoment(id: string, onDeleted: () => void): void {
  Alert.alert('Delete moment?', 'This will permanently remove it.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        await deleteMoment(id);
        onDeleted();
      },
    },
  ]);
}
