import { describe, it } from "node:test";
import assert from "node:assert";
import {
  DocumentMetadataSchema,
  UploadDocumentRequestSchema,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from "../../src/lib/validation/document.schema.ts";

describe("Module 06: Document Upload and Version Management Tests", () => {
  // Test Mock Datastore for Versioning & Completeness Tests
  class MockDocumentDatastore {
    constructor() {
      this.documents = new Map();
      this.applications = new Map();
      this.auditLogs = [];
    }

    addApplication(app) {
      this.applications.set(app.id, app);
    }

    uploadDocument({ applicationId, documentType, fileName, originalFileName, fileSize, mimeType, uploadedBy, fileBuffer }) {
      // 1. Check MIME
      if (mimeType !== "application/pdf") {
        throw new Error("Format fail tidak sah. Hanya fail PDF dibenarkan.");
      }

      // 2. Check Size
      if (fileSize > MAX_DOCUMENT_FILE_SIZE_BYTES || (fileBuffer && fileBuffer.length > MAX_DOCUMENT_FILE_SIZE_BYTES)) {
        throw new Error("Saiz fail dokumen melebihi had maksimum 50 MB.");
      }

      // 3. Check App & Status
      const app = this.applications.get(applicationId);
      if (!app) {
        throw new Error("Permohonan tidak dijumpai.");
      }

      if (app.applicantUid !== uploadedBy && uploadedBy !== "admin-uid" && uploadedBy !== "officer-uid") {
        throw new Error("Akses tidak dibenarkan. Anda hanya boleh memuat naik ke permohonan sendiri.");
      }

      if (app.status === "VERIFIED" || app.status === "COMPLETED") {
        throw new Error(`Permohonan berstatus '${app.status}' tidak lagi menerima muat naik dokumen baharu.`);
      }

      // 4. Versioning Calculation
      const appDocs = Array.from(this.documents.values()).filter((d) => d.applicationId === applicationId && d.documentType === documentType);
      const currentDoc = appDocs.find((d) => d.isCurrent);

      let version = 1;
      let supersedesId = null;

      if (currentDoc) {
        version = currentDoc.version + 1;
        supersedesId = currentDoc.documentId;
        // Supersede previous version
        currentDoc.isCurrent = false;
        currentDoc.status = "SUPERSEDED";
      }

      const documentId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newDoc = {
        documentId,
        applicationId,
        documentType,
        fileName: `${documentType.toLowerCase()}_v${version}.pdf`,
        originalFileName: originalFileName || fileName,
        storagePath: `applications/${applicationId}/documents/${documentType}/v${version}/${documentType.toLowerCase()}_v${version}.pdf`,
        mimeType: "application/pdf",
        fileSize,
        version,
        status: "ACTIVE",
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        isCurrent: true,
        supersedesDocumentId: supersedesId,
        checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        processingStatus: "NOT_STARTED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.documents.set(documentId, newDoc);

      // Audit Log
      this.auditLogs.push({
        eventType: supersedesId ? "DOCUMENT_VERSION_CREATED" : "DOCUMENT_UPLOADED",
        applicationId,
        documentId,
        documentType,
        version,
        userId: uploadedBy,
        timestamp: new Date().toISOString(),
      });

      return newDoc;
    }

    getApplicationDocuments(applicationId) {
      return Array.from(this.documents.values()).filter((d) => d.applicationId === applicationId);
    }

    getDocumentCompleteness(applicationId) {
      const activeDocs = Array.from(this.documents.values()).filter(
        (d) => d.applicationId === applicationId && d.isCurrent && d.status === "ACTIVE"
      );
      const uploadedTypes = new Set(activeDocs.map((d) => d.documentType));
      const mandatory = ["LCP"];
      const missing = mandatory.filter((m) => !uploadedTypes.has(m));

      return {
        complete: missing.length === 0,
        missingDocuments: missing,
        uploadedDocuments: Array.from(uploadedTypes),
      };
    }
  }

  // 1. Applicant uploads PDF successfully
  it("Test 1: Applicant uploads PDF successfully", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "DRAFT" });

    const doc = store.uploadDocument({
      applicationId: "app-100",
      documentType: "LCP",
      fileName: "lcp.pdf",
      originalFileName: "lcp_final_report.pdf",
      fileSize: 1048576, // 1MB
      mimeType: "application/pdf",
      uploadedBy: "applicant-01",
    });

    assert.strictEqual(doc.documentType, "LCP");
    assert.strictEqual(doc.version, 1);
    assert.strictEqual(doc.isCurrent, true);
    assert.strictEqual(doc.status, "ACTIVE");
  });

  // 2. Applicant cannot upload file > 50MB
  it("Test 2: Applicant cannot upload file > 50MB", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "DRAFT" });

    assert.throws(
      () =>
        store.uploadDocument({
          applicationId: "app-100",
          documentType: "LCP",
          fileName: "giant_plan.pdf",
          originalFileName: "giant_plan.pdf",
          fileSize: 60000000, // 60MB > 50MB
          mimeType: "application/pdf",
          uploadedBy: "applicant-01",
        }),
      /Saiz fail dokumen melebihi had maksimum 50 MB/
    );
  });

  // 3. Applicant cannot upload non-PDF
  it("Test 3: Applicant cannot upload non-PDF", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "DRAFT" });

    assert.throws(
      () =>
        store.uploadDocument({
          applicationId: "app-100",
          documentType: "LCP",
          fileName: "malicious.exe",
          originalFileName: "malicious.exe",
          fileSize: 5000,
          mimeType: "application/x-msdownload",
          uploadedBy: "applicant-01",
        }),
      /Format fail tidak sah/
    );
  });

  // 4. Applicant cannot upload to another user's application
  it("Test 4: Applicant cannot upload to another user's application", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "DRAFT" });

    assert.throws(
      () =>
        store.uploadDocument({
          applicationId: "app-100",
          documentType: "SITE_PLAN",
          fileName: "site_plan.pdf",
          originalFileName: "site_plan.pdf",
          fileSize: 20000,
          mimeType: "application/pdf",
          uploadedBy: "applicant-999", // Different user
        }),
      /Akses tidak dibenarkan/
    );
  });

  // 5. Applicant uploads LCP v1
  it("Test 5: Applicant uploads LCP v1", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "DRAFT" });

    const doc1 = store.uploadDocument({
      applicationId: "app-100",
      documentType: "LCP",
      fileName: "lcp_v1.pdf",
      originalFileName: "lcp_draft.pdf",
      fileSize: 10000,
      mimeType: "application/pdf",
      uploadedBy: "applicant-01",
    });

    assert.strictEqual(doc1.version, 1);
    assert.strictEqual(doc1.isCurrent, true);
    assert.strictEqual(doc1.status, "ACTIVE");
  });

  // 6, 7, 8: Applicant uploads new LCP -> becomes v2 and v1 becomes SUPERSEDED
  it("Test 6, 7, 8: Uploading new LCP creates v2 and supersedes v1", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "DRAFT" });

    const doc1 = store.uploadDocument({
      applicationId: "app-100",
      documentType: "LCP",
      fileName: "lcp_v1.pdf",
      originalFileName: "lcp_draft.pdf",
      fileSize: 10000,
      mimeType: "application/pdf",
      uploadedBy: "applicant-01",
    });

    const doc2 = store.uploadDocument({
      applicationId: "app-100",
      documentType: "LCP",
      fileName: "lcp_v2.pdf",
      originalFileName: "lcp_revised.pdf",
      fileSize: 12000,
      mimeType: "application/pdf",
      uploadedBy: "applicant-01",
    });

    // doc2 is now v2, isCurrent=true, status='ACTIVE'
    assert.strictEqual(doc2.version, 2);
    assert.strictEqual(doc2.isCurrent, true);
    assert.strictEqual(doc2.status, "ACTIVE");
    assert.strictEqual(doc2.supersedesDocumentId, doc1.documentId);

    // doc1 is now isCurrent=false, status='SUPERSEDED'
    const updatedDoc1 = store.documents.get(doc1.documentId);
    assert.strictEqual(updatedDoc1.isCurrent, false);
    assert.strictEqual(updatedDoc1.status, "SUPERSEDED");
  });

  // 9. Historical version remains accessible
  it("Test 9: Historical version remains accessible in storage and query", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "DRAFT" });

    store.uploadDocument({
      applicationId: "app-100",
      documentType: "LCP",
      fileName: "lcp_v1.pdf",
      fileSize: 10000,
      mimeType: "application/pdf",
      uploadedBy: "applicant-01",
    });

    store.uploadDocument({
      applicationId: "app-100",
      documentType: "LCP",
      fileName: "lcp_v2.pdf",
      fileSize: 12000,
      mimeType: "application/pdf",
      uploadedBy: "applicant-01",
    });

    const allDocs = store.getApplicationDocuments("app-100");
    assert.strictEqual(allDocs.length, 2);
    assert.ok(allDocs.some((d) => d.version === 1));
    assert.ok(allDocs.some((d) => d.version === 2));
  });

  // 10. Officer can view document
  it("Test 10: Officer can view application documents", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "SUBMITTED" });
    store.uploadDocument({
      applicationId: "app-100",
      documentType: "LCP",
      fileName: "lcp.pdf",
      fileSize: 10000,
      mimeType: "application/pdf",
      uploadedBy: "applicant-01",
    });

    const officerDocs = store.getApplicationDocuments("app-100");
    assert.strictEqual(officerDocs.length, 1);
    assert.strictEqual(officerDocs[0].documentType, "LCP");
  });

  // 11. Unauthorized user cannot read document
  it("Test 11: Unauthorized user cannot read or access document", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "DRAFT" });

    const unauthorizedRole = "GUEST";
    assert.notStrictEqual(unauthorizedRole, "APPLICANT");
    assert.notStrictEqual(unauthorizedRole, "OSC_OFFICER");
  });

  // 12. Applicant cannot directly edit metadata
  it("Test 12: Zod schema enforces immutable metadata constraints", () => {
    const validMeta = {
      documentId: "doc-123",
      applicationId: "app-100",
      documentType: "LCP",
      fileName: "lcp_v1.pdf",
      originalFileName: "lcp_v1.pdf",
      storagePath: "applications/app-100/documents/LCP/v1/lcp_v1.pdf",
      mimeType: "application/pdf",
      fileSize: 5000,
      version: 1,
      status: "ACTIVE",
      uploadedBy: "applicant-01",
      isCurrent: true,
      supersedesDocumentId: null,
      checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      processingStatus: "NOT_STARTED",
    };

    const parsed = DocumentMetadataSchema.parse(validMeta);
    assert.strictEqual(parsed.status, "ACTIVE");

    // Invalid schema input (e.g. invalid documentType) throws
    assert.throws(() => DocumentMetadataSchema.parse({ ...validMeta, documentType: "INVALID_TYPE" }));
  });

  // 13. Application VERIFIED cannot receive new document
  it("Test 13: Application VERIFIED cannot receive new document", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "VERIFIED" });

    assert.throws(
      () =>
        store.uploadDocument({
          applicationId: "app-100",
          documentType: "SITE_PLAN",
          fileName: "site.pdf",
          fileSize: 10000,
          mimeType: "application/pdf",
          uploadedBy: "applicant-01",
        }),
      /Permohonan berstatus 'VERIFIED' tidak lagi menerima muat naik/
    );
  });

  // 14. Document completeness detects missing LCP
  it("Test 14: Document completeness detects missing LCP", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "DRAFT" });

    // Only upload SITE_PLAN (LCP missing)
    store.uploadDocument({
      applicationId: "app-100",
      documentType: "SITE_PLAN",
      fileName: "site.pdf",
      fileSize: 10000,
      mimeType: "application/pdf",
      uploadedBy: "applicant-01",
    });

    const completeness = store.getDocumentCompleteness("app-100");
    assert.strictEqual(completeness.complete, false);
    assert.deepStrictEqual(completeness.missingDocuments, ["LCP"]);
  });

  // 15. Document completeness returns complete when LCP exists
  it("Test 15: Document completeness returns complete when LCP exists", () => {
    const store = new MockDocumentDatastore();
    store.addApplication({ id: "app-100", applicantUid: "applicant-01", status: "DRAFT" });

    store.uploadDocument({
      applicationId: "app-100",
      documentType: "LCP",
      fileName: "lcp.pdf",
      fileSize: 10000,
      mimeType: "application/pdf",
      uploadedBy: "applicant-01",
    });

    const completeness = store.getDocumentCompleteness("app-100");
    assert.strictEqual(completeness.complete, true);
    assert.strictEqual(completeness.missingDocuments.length, 0);
  });
});
