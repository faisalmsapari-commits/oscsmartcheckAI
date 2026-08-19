export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".geojson"];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename: string;
}

/**
 * Validates PDF magic bytes signature (%PDF-)
 */
export function validatePdfSignature(buffer: Buffer | Uint8Array): boolean {
  if (!buffer || buffer.length < 5) return false;
  const magic = buffer.slice(0, 5);
  // %PDF- in ASCII is 0x25, 0x50, 0x44, 0x46, 0x2D
  return (
    magic[0] === 0x25 &&
    magic[1] === 0x50 &&
    magic[2] === 0x44 &&
    magic[3] === 0x46 &&
    magic[4] === 0x2d
  );
}

/**
 * Sanitizes a file name, removing path traversal and special characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "document.pdf";
  // Remove directory traversal characters
  const clean = filename.replace(/^.*[\\/]/, "");
  // Replace dangerous characters with underscores
  return clean.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Validates an uploaded document file
 */
export function validateUploadedFile(
  filename: string,
  sizeBytes: number,
  buffer?: Buffer | Uint8Array
): FileValidationResult {
  const sanitized = sanitizeFilename(filename);

  // Check 1: Size limit
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Saiz fail melebihi had maksimum 50MB (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB).`,
      sanitizedFilename: sanitized,
    };
  }

  // Check 2: Extension check
  const ext = "." + sanitized.split(".").pop()?.toLowerCase();
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Format fail '${ext}' tidak dibenarkan. Sila muat naik fail PDF atau Imej yang sah.`,
      sanitizedFilename: sanitized,
    };
  }

  // Check 3: PDF Magic Byte validation if PDF
  if (ext === ".pdf" && buffer && buffer.length >= 5) {
    if (!validatePdfSignature(buffer)) {
      return {
        valid: false,
        error: "Fail PDF tidak sah atau rosak (Magic byte signature tidak sepadan).",
        sanitizedFilename: sanitized,
      };
    }
  }

  return {
    valid: true,
    sanitizedFilename: sanitized,
  };
}
