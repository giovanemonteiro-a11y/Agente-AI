import { openaiClient, OPENAI_MODELS } from '../config/openai';
import fs from 'fs';

export interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
}

const MOCK_TRANSCRIPT = 'Transcrição não disponível (OpenAI não configurado)';

export async function transcribeAudioFile(filePath: string): Promise<TranscriptionResult> {
  if (!openaiClient) {
    return { text: MOCK_TRANSCRIPT };
  }

  const fileStream = fs.createReadStream(filePath);

  const transcription = await openaiClient.audio.transcriptions.create({
    file: fileStream,
    model: OPENAI_MODELS.WHISPER,
    response_format: 'verbose_json',
    language: 'pt',
  });

  return {
    text: transcription.text,
  };
}

export async function transcribeAudioBuffer(
  buffer: Buffer,
  filename: string
): Promise<TranscriptionResult> {
  if (!openaiClient) {
    return { text: MOCK_TRANSCRIPT };
  }

  const { toFile } = await import('openai');
  const file = await toFile(buffer, filename);

  const transcription = await openaiClient.audio.transcriptions.create({
    file,
    model: OPENAI_MODELS.WHISPER,
    response_format: 'verbose_json',
    language: 'pt',
  });

  return {
    text: transcription.text,
  };
}
