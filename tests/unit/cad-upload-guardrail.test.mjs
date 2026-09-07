import { describe, it } from "node:test";
import assert from "node:assert";

function validateDocumentUploadFileType(fileName) {
  const nameLower = fileName.toLowerCase();
  if (nameLower.endsWith(".dwg") || nameLower.endsWith(".dxf")) {
    return {
      valid: false,
      code: "CAD_FILE_NOT_SUPPORTED_FOR_OCR",
      error:
        "Fail CAD (.dwg / .dxf) tidak boleh diproses secara terus oleh enjin OCR Document AI. Sila muat naik fail eksport Pelan Susunatur dalam format PDF untuk pengekstrakan AI.",
    };
  }

  if (!nameLower.endsWith(".pdf")) {
    return {
      valid: false,
      code: "INVALID_FILE_TYPE",
      error: "Format fail tidak sah. Hanya fail PDF dibenarkan.",
    };
  }

  return { valid: true, code: null, error: null };
}

describe("Raw CAD Upload Guardrail Unit Tests", () => {
  it("should reject .dwg files with explicit Bahasa Malaysia export guidance", () => {
    const res = validateDocumentUploadFileType("Pelan_Susunatur_v1.dwg");
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.code, "CAD_FILE_NOT_SUPPORTED_FOR_OCR");
    assert.match(res.error, /Fail CAD \(\.dwg \/ \.dxf\) tidak boleh diproses/);
    assert.match(res.error, /format PDF/);
  });

  it("should reject .dxf files with explicit Bahasa Malaysia export guidance", () => {
    const res = validateDocumentUploadFileType("Pelan_Tapak_Cad.dxf");
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.code, "CAD_FILE_NOT_SUPPORTED_FOR_OCR");
  });

  it("should accept valid .pdf files", () => {
    const res = validateDocumentUploadFileType("Pelan_Susunatur_v1.pdf");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.error, null);
  });
});
