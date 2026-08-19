import type { Timestamp } from "firebase/firestore";

/**
 * Immutable Audit Log: auditLogs/{auditLogId}
 * Preserved indefinitely; protected from client alteration or deletion.
 */
export interface AuditLog {
  id?: string;
  eventType: string;
  resourceType: string;
  resourceId: string;
  applicationId: string | null;
  actorUid: string;
  actorRole: string;
  timestamp: Timestamp | string;
  metadata: Record<string, unknown>;
}
