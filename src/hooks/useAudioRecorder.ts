import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import {
  startVoiceRecording,
  stopAndParseVoice,
  cancelRecording,
} from '../ai/transactionParser';
import { ParsedTransaction } from '../types/transaction';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const isMounted = useRef(true);

  
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (playbackSound) {
        playbackSound.unloadAsync().catch(() => {});
      }
    };
  }, [playbackSound]);

  const start = useCallback(async () => {
    setError(null);
    setParsed(null);
    setTranscript('');
    setRecordingUri(null);
    setIsPlaying(false);
    if (playbackSound) {
      await playbackSound.unloadAsync().catch(() => {});
      setPlaybackSound(null);
    }
    try {
      await startVoiceRecording();
      if (isMounted.current) setState('recording');
    } catch (e) {
      if (isMounted.current) {
        setState('error');
        setError(e instanceof Error ? e.message : 'Failed to start recording.');
      }
    }
  }, [playbackSound]);

  const stop = useCallback(async () => {
    if (state !== 'recording') return;
    setState('processing');
    try {
      const result = await stopAndParseVoice();
      if (isMounted.current) {
        setRecordingUri(result.fileUri);
        setTranscript(result.transcript);
        setParsed(result.parsed);
        setState('done');
      }
    } catch (e) {
      if (isMounted.current) {
        setState('error');
        setError(e instanceof Error ? e.message : 'Failed to process audio.');
        if (e && typeof e === 'object' && 'fileUri' in e) {
          setRecordingUri((e as any).fileUri);
        }
      }
    }
  }, [state]);

  const cancel = useCallback(async () => {
    await cancelRecording();
    if (isMounted.current) {
      setState('idle');
      setError(null);
      setParsed(null);
      setTranscript('');
      setRecordingUri(null);
      setIsPlaying(false);
      if (playbackSound) {
        await playbackSound.unloadAsync().catch(() => {});
        setPlaybackSound(null);
      }
    }
  }, [playbackSound]);

  const reset = useCallback(async () => {
    if (playbackSound) {
      await playbackSound.unloadAsync().catch(() => {});
    }
    if (isMounted.current) {
      setState('idle');
      setError(null);
      setParsed(null);
      setTranscript('');
      setRecordingUri(null);
      setIsPlaying(false);
      setPlaybackSound(null);
    }
  }, [playbackSound]);

  const playRecording = useCallback(async () => {
    if (!recordingUri) return;
    try {
      if (playbackSound) {
        await playbackSound.unloadAsync().catch(() => {});
      }
      setIsPlaying(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      setPlaybackSound(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (e) {
      console.error('Failed to play sound', e);
      setIsPlaying(false);
    }
  }, [recordingUri, playbackSound]);

  const stopPlayback = useCallback(async () => {
    if (playbackSound) {
      try {
        await playbackSound.stopAsync();
        setIsPlaying(false);
      } catch (e) {
        console.error('Failed to stop sound', e);
      }
    }
  }, [playbackSound]);

  return {
    state,
    transcript,
    parsed,
    error,
    recordingUri,
    isPlaying,
    start,
    stop,
    cancel,
    reset,
    playRecording,
    stopPlayback,
  };
}
