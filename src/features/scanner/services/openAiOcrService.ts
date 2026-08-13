import { prepareImageForUpload } from '../utils/prepareImage';
import type { MedicineScanResult } from '../types/scan';
import { OCRServiceError, type OCRService } from './ocrService';

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';
const REQUEST_TIMEOUT_MS = 30000;

const SYSTEM_PROMPT = `You read photos of medicine packaging for a medicine tracking app. Extract only what is clearly visible on the packaging.

Rules:
- Never invent or guess a value. If a field is not clearly legible, return null for it.
- Normalize dates to "YYYY-MM-DD" if the day is visible, or "YYYY-MM" if only the month and year are visible.
- "rawText" should contain all text you can read on the packaging, verbatim.
- "confidence" is your own honest estimate (0 to 1) of how reliable medicineName, manufacturingDate and expiryDate are together. A blurry or partially obscured photo should score low.
- This is not a medical tool: do not infer dosage, do not suggest a prescription, do not diagnose anything. Only transcribe what is printed.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    medicineName: { type: ['string', 'null'] },
    manufacturingDate: { type: ['string', 'null'] },
    expiryDate: { type: ['string', 'null'] },
    rawText: { type: ['string', 'null'] },
    confidence: { type: 'number' },
  },
  required: ['medicineName', 'manufacturingDate', 'expiryDate', 'rawText', 'confidence'],
  additionalProperties: false,
} as const;

interface OpenAiScanPayload {
  medicineName: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  rawText: string | null;
  confidence: number;
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function toScanResult(payload: OpenAiScanPayload): MedicineScanResult {
  return {
    medicineName: payload.medicineName ?? undefined,
    manufacturingDate: payload.manufacturingDate ?? undefined,
    expiryDate: payload.expiryDate ?? undefined,
    rawText: payload.rawText ?? undefined,
    confidence: clampConfidence(payload.confidence),
  };
}

/**
 * architecture.md #15's "CloudOCRService" / "AIExtractionService": does OCR
 * and structured extraction in one call, since a vision-capable chat model
 * reads the label and returns the fields directly rather than needing a
 * separate raw-text-parsing step.
 *
 * Security note (architecture.md #32): the API key ships inside the client
 * bundle via `EXPO_PUBLIC_OPENAI_API_KEY` — see .env.example. That's only
 * acceptable because this is a personal, non-distributed app; a distributed
 * app must proxy this call through a backend instead.
 */
export const openAiOcrService: OCRService = {
  async scanMedicine(imageUri: string): Promise<MedicineScanResult> {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new OCRServiceError(
        'No OpenAI API key configured. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env file and restart the app, or enter this medicine manually.'
      );
    }

    let image: Awaited<ReturnType<typeof prepareImageForUpload>>;
    try {
      image = await prepareImageForUpload(imageUri);
    } catch {
      throw new OCRServiceError('Could not process the photo. Please try taking it again.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract the medicine details from this packaging photo.' },
                { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
              ],
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'medicine_scan', strict: true, schema: RESPONSE_SCHEMA },
          },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OCRServiceError('The scan took too long. Check your connection and try again.');
      }
      throw new OCRServiceError('Could not reach the scanning service. Check your connection and try again.');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new OCRServiceError('The OpenAI API key was rejected. Check EXPO_PUBLIC_OPENAI_API_KEY in your .env file.');
      }
      throw new OCRServiceError(`Scanning failed (${response.status}). Please try again or enter this medicine manually.`);
    }

    try {
      const body = await response.json();
      const content = body.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('Missing content in response');
      }
      const payload = JSON.parse(content) as OpenAiScanPayload;
      return toScanResult(payload);
    } catch {
      throw new OCRServiceError('Got an unreadable response from the scanning service. Please try again.');
    }
  },
};
