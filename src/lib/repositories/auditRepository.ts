import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { AuditLog } from "@/types/audit";
import { AuditLogSchema } from "@/lib/validation/audit.schema";

export class AuditRepository {
  private db: Firestore;

  constructor(customDb?: Firestore) {
    this.db = customDb || getFirestoreDb();
  }

  /**
   * Writes an immutable audit log record
   */
  async recordAuditLog(rawLog: unknown): Promise<{ id: string; success: boolean }> {
    const validated = AuditLogSchema.parse(rawLog);

    const col = collection(this.db, "auditLogs");
    const docRef = await addDoc(col, {
      ...validated,
      timestamp: serverTimestamp(),
    });

    return { id: docRef.id, success: true };
  }

  /**
   * Retrieves audit logs for a specific application
   */
  async getAuditLogsByApplication(applicationId: string): Promise<AuditLog[]> {
    const col = collection(this.db, "auditLogs");
    const q = query(
      col,
      where("applicationId", "==", applicationId),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
  }
}

export const auditRepository = new AuditRepository();
