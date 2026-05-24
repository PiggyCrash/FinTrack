import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

let _recording: Audio.Recording | null = null;


export async function requestMicPermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}


export async function startRecording(): Promise<void> {
  if (_recording) {
    console.warn('[Audio] Recording already in progress.');
    return;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  _recording = recording;
  console.log('[Audio] Recording started.');
}


export async function stopRecording(): Promise<string> {
  if (!_recording) {
    throw new Error('[Audio] No active recording to stop.');
  }

  await _recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = _recording.getURI();
  _recording = null;

  if (!uri) {
    throw new Error('[Audio] Recording URI is null after stopping.');
  }

  console.log('[Audio] Recording stopped. File:', uri);
  return uri;
}


export async function transcribeAudio(fileUri: string): Promise<string> {
  console.log('[Whisper] Uploading audio for transcription...');

  const response = await FileSystem.uploadAsync(WHISPER_URL, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: 'audio/m4a',
    parameters: {
      model: 'whisper-1',
      language: 'id', 
      response_format: 'json',
    },
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  });

  if (response.status !== 200) {
    
    let reason = `Error ${response.status}`;
    try {
      const errBody = JSON.parse(response.body) as { error?: { message?: string; code?: string } };
      const code = errBody?.error?.code ?? '';
      if (response.status === 429 || code === 'insufficient_quota') {
        throw new Error(
          '🔑 OpenAI quota exceeded.\n\nYour Whisper API key has run out of credits. Voice mode requires a paid OpenAI account.\n\n💡 Tip: Use "AI Chat" mode instead — it runs on Cerebras which is free.'
        );
      }
      if (response.status === 401) {
        throw new Error(
          '🔑 Invalid OpenAI API key.\n\nCheck that EXPO_PUBLIC_OPENAI_API_KEY is set correctly in your .env file.'
        );
      }
      reason = errBody?.error?.message ?? reason;
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message.startsWith('🔑')) throw parseErr;
    }
    throw new Error(`Voice transcription failed: ${reason}`);
  }

  const body = JSON.parse(response.body) as { text: string };
  console.log('[Whisper] Transcript:', body.text);
  return body.text;
}


export async function cancelRecording(): Promise<void> {
  if (!_recording) return;
  try {
    await _recording.stopAndUnloadAsync();
  } catch {}
  const uri = _recording.getURI();
  _recording = null;
  if (uri) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
