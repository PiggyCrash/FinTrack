import { parseTransactionText } from './cerebrasClient';
import {
  startRecording,
  stopRecording,
  transcribeAudio,
  cancelRecording,
  requestMicPermission,
} from './audioTranscriber';
import { ParsedTransaction } from '../types/transaction';


export async function startVoiceRecording(): Promise<void> {
  const granted = await requestMicPermission();
  if (!granted) {
    throw new Error('Microphone permission denied.');
  }
  await startRecording();
}

export async function stopAndParseVoice(): Promise<{
  transcript: string;
  parsed: ParsedTransaction;
  fileUri: string;
}> {
  const fileUri = await stopRecording();
  try {
    const transcript = await transcribeAudio(fileUri);
    const parsed = await parseTransactionText(transcript);
    return { transcript, parsed, fileUri };
  } catch (err) {
    if (err instanceof Error) {
      (err as any).fileUri = fileUri;
    }
    throw err;
  }
}

export { cancelRecording };


export async function parseTextInput(
  text: string
): Promise<ParsedTransaction> {
  return parseTransactionText(text);
}
