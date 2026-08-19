import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { DocumentMetadata, ProcessingStatus } from "@/types/document";
import { DocumentMetadataSchema } from "@/lib/validation/document.schema";

export class DocumentRepository {
  private db: Firestore;

  constructor(customDb?: Firestore) {
    this.db = customDb || getFirestoreDb();
  }

  /**
   * Adds metadata record for an uploaded document
   */
  async addDocumentMetadata(
    applicationId: string,
    documentId: string,
    rawInput: unknown
  ): Promise<{ id: string; success: boolean }> {
    const validated = DocumentMetadataSchema.parse(rawInput);

    const docRef = doc(this.db, `applications/${applicationId}/documents`, documentId);
    await setDoc(docRef, {
      ...validated,
      uploadedAt: serverTimestamp(),
    });

    return { id: documentId, success: true };
  }

  /**
   * Retrieves all document records for an application, optionally filtered by version
   */
  async getDocumentsByApplication(
    applicationId: string,
    versionNumber?: number
  ): Promise<DocumentMetadata[]> {
    const docCol = collection(this.db, `applications/${applicationId}/documents`);
    let q = query(docCol, orderBy("uploadedAt", "desc"));

    if (versionNumber !== undefined) {
      q = query(
        docCol,
        where("versionNumber", "==", versionNumber),
        orderBy("uploadedAt", "desc")
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DocumentMetadata));
  }

  /**
   * Retrieves a single document metadata record
   */
  async getDocumentById(
    applicationId: string,
    documentId: string
  ): Promise<DocumentMetadata | null> {
    const docRef = doc(this.db, `applications/${applicationId}/documents`, documentId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    return { id: snap.id, ...snap.data() } as DocumentMetadata;
  }

  /**
   * Updates the processing status of a document
   */
  async updateDocumentProcessingStatus(
    applicationId: string,
    documentId: string,
    status: ProcessingStatus
  ): Promise<{ success: boolean }> {
    const docRef = doc(this.db, `applications/${applicationId}/documents`, documentId);
    await updateDoc(docRef, {
      processingStatus: status,
    });

    return { success: true };
  }
}

export const documentRepository = new DocumentRepository();
