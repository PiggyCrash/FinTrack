import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  Text,
} from 'react-native';
import { RecordingState } from '../hooks/useAudioRecorder';

interface Props {
  state: RecordingState;
  onPress: () => void;
}

export default function VoiceRecordButton({ state, onPress }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'recording') {
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.18,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
      Animated.timing(glow, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      pulse.stopAnimation();
      Animated.timing(pulse, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(glow, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [state]);

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  const bgColor = isRecording
    ? '#FF4757'
    : isProcessing
    ? '#A29BFE'
    : '#6C63FF';

  const icon = isRecording ? '⏹' : isProcessing ? '⏳' : '🎙️';
  const label = isRecording ? 'Tap to stop' : isProcessing ? 'Processing…' : 'Tap to record';

  return (
    <View style={styles.wrapper}>
      {}
      <Animated.View
        style={[
          styles.glowRing,
          {
            opacity: glow,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: bgColor }]}
          onPress={onPress}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <Text style={styles.icon}>{icon}</Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 10,
  },
  glowRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FF475740',
    top: -10,
    left: -10,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    color: '#8890AA',
    fontSize: 12,
    fontWeight: '500',
  },
});
