/**
 * Magic Bytes & File Security Validation Utilities
 * Validates file headers/magic numbers to ensure binary integrity and prevent MIME spoofing.
 */

export interface FileValidationResult {
  valid: boolean;
  mimeType?: string;
  extension?: string;
  error?: string;
}

const ALLOWED_MIME_TYPES = {
  "image/jpeg": { ext: "jpg", headerCheck: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": {
    ext: "png",
    headerCheck: (bytes: Uint8Array) =>
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  "image/gif": {
    ext: "gif",
    headerCheck: (bytes: Uint8Array) =>
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61,
  },
  "image/webp": {
    ext: "webp",
    headerCheck: (bytes: Uint8Array) =>
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 && // 'RIFF'
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50, // 'WEBP'
  },
};

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates an ArrayBuffer or Uint8Array against allowed image magic byte signatures.
 */
export function validateImageMagicBytes(
  buffer: ArrayBuffer | Uint8Array,
  declaredMimeType?: string
): FileValidationResult {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  if (bytes.length === 0) {
    return { valid: false, error: "File is empty" };
  }

  if (bytes.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File exceeds 5MB size limit" };
  }

  // Detect genuine MIME type from binary signature
  for (const [mime, spec] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (bytes.length >= 12 && spec.headerCheck(bytes)) {
      if (declaredMimeType && declaredMimeType.toLowerCase() !== mime) {
        return {
          valid: false,
          error: `MIME type mismatch: declared '${declaredMimeType}', but magic bytes identify '${mime}'`,
        };
      }
      return {
        valid: true,
        mimeType: mime,
        extension: spec.ext,
      };
    }
  }

  return {
    valid: false,
    error: "Invalid or unsupported file signature. Only JPEG, PNG, GIF, and WebP are permitted.",
  };
}
