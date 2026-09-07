import { describe, it } from "node:test";
import assert from "node:assert";
import {
  GEMINI_CONTROLLED_JSON_SCHEMA,
  GEMINI_REQUEST_CONFIG,
  LCP_AI_MODEL_NAME,
} from "../../src/lib/extraction/geminiExtractor.ts";

describe("Gemini Controlled JSON Output Schema Unit Tests", () => {
  it("should configure application/json responseMimeType and responseSchema", () => {
    assert.strictEqual(GEMINI_REQUEST_CONFIG.model, LCP_AI_MODEL_NAME);
    assert.strictEqual(GEMINI_REQUEST_CONFIG.generationConfig.responseMimeType, "application/json");
    assert.ok(GEMINI_REQUEST_CONFIG.generationConfig.responseSchema);
    assert.strictEqual(GEMINI_REQUEST_CONFIG.generationConfig.responseSchema.type, "OBJECT");
  });

  it("should define mandatory schema fields for extracted facts array and evidence items", () => {
    const schema = GEMINI_CONTROLLED_JSON_SCHEMA;
    assert.ok(schema.properties.facts);
    assert.strictEqual(schema.properties.facts.type, "ARRAY");

    const factProperties = schema.properties.facts.items.properties;
    assert.ok(factProperties.key);
    assert.ok(factProperties.label);
    assert.ok(factProperties.category);
    assert.ok(factProperties.confidence);
    assert.ok(factProperties.evidence);

    const evidenceProps = factProperties.evidence.items.properties;
    assert.ok(evidenceProps.pageNumber);
    assert.ok(evidenceProps.quotedText);
  });
});
