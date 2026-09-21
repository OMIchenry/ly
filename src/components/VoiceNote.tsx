import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import type { Theme } from '../theme';

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Record-a-voice-note control. Shows a mic button; while recording shows
 * a pulsing dot + elapsed time; after stopping it reports the file URI.
 */
export function VoiceRecorder({
  theme,
  onDone,
}: {
  theme: Theme;
  onDone: (uri: string | null) => void;
}) {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    directory: 'document',
  });
  const recorderState = useAudioRecorderState(recorder);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  async function toggle() {
    if (busy) return;
    if (recorderState.isRecording) {
      setBusy(true);
      try {
        await recorder.stop();
        if (timer.current) clearInterval(timer.current);
        onDone(recorder.uri ?? null);
      } catch {
        onDone(null);
      } finally {
        setElapsed(0);
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Permission needed',
          'LY needs microphone access to record voice notes.',
        );
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setElapsed(0);
      timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      Alert.alert('Could not start recording', 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const recording = recorderState.isRecording;

  return (
    <Pressable
      onPress={toggle}
      style={[
        styles.recorder,
        { backgroundColor: theme.well, opacity: busy ? 0.6 : 1 },
      ]}
      accessibilityLabel={recording ? 'Stop recording' : 'Record a voice note'}
    >
      <View
        style={[
          styles.micDot,
          { backgroundColor: recording ? '#FF3B30' : theme.text },
        ]}
      />
      <Text style={[styles.recorderText, { color: theme.text }]}>
        {recording ? `Recording · ${formatTime(elapsed)}` : 'Record a voice note'}
      </Text>
      {recording ? <Text style={styles.stopHint}>Tap to stop</Text> : null}
    </Pressable>
  );
}

/** Playback control for a saved voice note. */
export function VoicePlayer({ uri, theme }: { uri: string; theme: Theme }) {
  const player = useAudioPlayer({ uri });
  const playing = player.playing;

  const duration = player.duration > 0 ? player.duration : 0;
  const current = Math.min(player.currentTime, duration);

  function toggle() {
    if (playing) {
      player.pause();
    } else {
      if (duration > 0 && current >= duration) player.seekTo(0);
      player.play();
    }
  }

  const progress = duration > 0 ? current / duration : 0;

  return (
    <View style={[styles.player, { backgroundColor: theme.card }]}>
      <Pressable
        onPress={toggle}
        style={[styles.playButton, { backgroundColor: theme.text }]}
        accessibilityLabel={playing ? 'Pause voice note' : 'Play voice note'}
      >
        <Text style={[styles.playGlyph, { color: theme.onText }]}>
          {playing ? '❚❚' : '▶'}
        </Text>
      </Pressable>
      <View style={styles.trackWrap}>
        <View style={[styles.track, { backgroundColor: theme.well }]}>
          <View
            style={[
              styles.progress,
              { backgroundColor: theme.text, width: `${progress * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.time, { color: theme.secondaryText }]}>
          {formatTime(current)} / {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  recorder: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    gap: 12,
  },
  micDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recorderText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
    flex: 1,
  },
  stopHint: {
    fontSize: 12,
    color: '#FF3B30',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    fontSize: 15,
    marginLeft: 2,
  },
  trackWrap: {
    flex: 1,
    gap: 6,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 2,
  },
  time: {
    fontSize: 11,
    letterSpacing: 1,
  },
});
