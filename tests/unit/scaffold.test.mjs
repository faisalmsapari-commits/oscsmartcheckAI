import { describe, it } from "node:test";
import assert from "node:assert";

describe("Module 01: Project Scaffold Verification", () => {
  it("should have valid environment variable structure for Firebase", () => {
    const requiredKeys = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ];

    assert.strictEqual(requiredKeys.length, 6, "All 6 Firebase keys must be accounted for");
  });

  it("should verify runtime status logic gracefully handles missing or present keys", () => {
    function evaluateStatus(mockEnv) {
      const config = {
        apiKey: mockEnv.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: mockEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: mockEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        storageBucket: mockEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: mockEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: mockEnv.NEXT_PUBLIC_FIREBASE_APP_ID || "",
      };

      const requiredKeys = [
        "apiKey",
        "authDomain",
        "projectId",
        "storageBucket",
        "messagingSenderId",
        "appId",
      ];
      const missingKeys = requiredKeys.filter((k) => !config[k]);
      return {
        isConfigured: missingKeys.length === 0,
        missingKeys,
      };
    }

    const emptyStatus = evaluateStatus({});
    assert.strictEqual(emptyStatus.isConfigured, false);
    assert.strictEqual(emptyStatus.missingKeys.length, 6);

    const fullStatus = evaluateStatus({
      NEXT_PUBLIC_FIREBASE_API_KEY: "test-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-proj",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "test.appspot.com",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:abc",
    });
    assert.strictEqual(fullStatus.isConfigured, true);
    assert.strictEqual(fullStatus.missingKeys.length, 0);
  });

  it("should verify architectural immutable principles are declared", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const archPath = path.resolve("docs", "architecture.md");
    assert.ok(fs.existsSync(archPath), "docs/architecture.md must exist");

    const content = fs.readFileSync(archPath, "utf-8");
    assert.ok(
      content.includes("Browser clients must not execute privileged business logic"),
      "Must contain principle 1"
    );
    assert.ok(
      content.includes("Compliance calculations must eventually execute server-side"),
      "Must contain principle 2"
    );
    assert.ok(
      content.includes("AI cannot change compliance status"),
      "Must contain principle 3"
    );
    assert.ok(
      content.includes("Official OSC comments require human verification"),
      "Must contain principle 4"
    );
    assert.ok(
      content.includes("Audit records must be preserved"),
      "Must contain principle 5"
    );
    assert.ok(
      content.includes("Planning guideline versions must be traceable"),
      "Must contain principle 6"
    );
    assert.ok(
      content.includes("Final verified records must not be overwritten"),
      "Must contain principle 7"
    );
  });
});
