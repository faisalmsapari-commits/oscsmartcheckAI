import { z } from "zod";

export const AuditLogSchema = z.object({
  eventType: z.string().min(2).max(100),
  resourceType: z.string().min(2).max(100),
  resourceId: z.string().min(1).max(100),
  applicationId: z.string().nullable().default(null),
  actorUid: z.string().min(1),
  actorRole: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
