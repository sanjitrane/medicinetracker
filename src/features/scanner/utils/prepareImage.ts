import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface PreparedImage {
  base64: string;
  mimeType: string;
}

/**
 * architecture.md #14's "Image preprocessing" step. Downscaling before
 * upload keeps the request small and fast — a raw photo is far more
 * resolution than any OCR/vision model needs to read a label — and every
 * vision-capable OCR provider benefits from it, so it lives here rather than
 * inside one specific `OCRService` implementation.
 */
export async function prepareImageForUpload(imageUri: string): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(imageUri);
  context.resize({ width: 1024 });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });

  if (!result.base64) {
    throw new Error('Image manipulation did not return base64 data.');
  }

  return { base64: result.base64, mimeType: 'image/jpeg' };
}
