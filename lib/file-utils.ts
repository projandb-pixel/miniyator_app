/**
 * Helper functions for converting between base64 strings and Buffer (blob)
 */

/**
 * Detect MIME type from Buffer using magic bytes
 */
export function detectMimeTypeFromBuffer(buffer: Buffer): string {
  if (!buffer || buffer.length < 4) return 'image/png';

  // Check magic bytes for different image formats
  const bytes = buffer.slice(0, 12);

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }

  // GIF: 47 49 46 38 (GIF8)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif';
  }

  // WebP: Check for "WEBP" string at offset 8
  if (bytes.length >= 12 && 
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }

  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
    return 'image/bmp';
  }

  // SVG: Check for XML/SVG content (text-based)
  const text = buffer.toString('utf-8', 0, Math.min(100, buffer.length));
  if (text.includes('<svg') || text.includes('<?xml')) {
    return 'image/svg+xml';
  }

  // PDF: 25 50 44 46 (%PDF)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf';
  }

  // Default to PNG if unknown
  return 'image/png';
}

/**
 * Convert base64 string to Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64.includes(',') 
    ? base64.split(',')[1] 
    : base64;
  
  return Buffer.from(base64Data, 'base64');
}

/**
 * Convert Buffer to base64 string with automatic MIME type detection
 */
export function bufferToBase64(
  buffer: Buffer | null | undefined, 
  mimeType?: string
): string | null {
  if (!buffer) return null;
  
  // Auto-detect MIME type if not provided
  const detectedMimeType = mimeType || detectMimeTypeFromBuffer(buffer);
  
  const base64 = buffer.toString('base64');
  return `data:${detectedMimeType};base64,${base64}`;
}

/**
 * Detect MIME type from base64 data URL
 */
export function getMimeTypeFromBase64(base64: string): string {
  if (base64.startsWith('data:')) {
    const mimeMatch = base64.match(/data:([^;]+)/);
    if (mimeMatch) {
      return mimeMatch[1];
    }
  }
  
  // If no MIME type in data URL, try to detect from buffer
  try {
    const buffer = base64ToBuffer(base64);
    return detectMimeTypeFromBuffer(buffer);
  } catch {
    return 'image/png';
  }
}

/**
 * Convert File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

