import { describe, it } from "node:test";
import assert from "node:assert";

function validatePdfQuality(fileSize, magicBytes) {
  if (fileSize === 0 || fileSize < 1024) {
    return {
      valid: false,
      code: "INVALID_PDF_QUALITY",
      error:
        "Fail PDF tidak sah atau kualiti imbuhan (OCR) terlalu rendah. Sila pastikan dokumen PDF bukan fail kosong, mengandungi teks/halaman yang boleh dibaca, dan resolusi imbasan sekurang-kurangnya 150 DPI sebelum memuat naik semula.",
    };
  }

  if (magicBytes && !magicBytes.startsWith("%PDF-")) {
    return {
      valid: false,
      code: "CORRUPT_PDF_HEADER",
      error:
        "Header fail PDF rosak atau tidak sah. Sila pastikan fail disimpan sebagai dokumen PDF standard sebelum memuat naik semula.",
    };
  }

  return { valid: true, code: null, error: null };
}

describe("Pre-Upload PDF Quality Gate Tests", () => {
  it("should reject 0-byte or corrupted small files (<1024 bytes) with Bahasa Malaysia guidance", () => {
    const res = validatePdfQuality(0, "");
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.code, "INVALID_PDF_QUALITY");
    assert.match(res.error, /Fail PDF tidak sah atau kualiti imbuhan \(OCR\) terlalu rendah/);
  });

  it("should reject files with corrupt non-PDF magic bytes header", () => {
    const res = validatePdfQuality(2048, "INVALID_BYTES");
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.code, "CORRUPT_PDF_HEADER");
    assert.match(res.error, /Header fail PDF rosak atau tidak sah/);
  });

  it("should accept valid PDF files with %PDF- header and size > 1KB", () => {
    const res = validatePdfQuality(1048576, "%PDF-1.7");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.error, null);
  });
});
