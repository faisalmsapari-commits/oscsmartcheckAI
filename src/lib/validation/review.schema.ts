import { z } from "zod";

export const OfficerReviewSchema = z.object({
  smartCheckId: z.string().min(1),
  reviewStatus: z.enum(["DRAFT", "UNDER_REVIEW", "VERIFIED"]).default("DRAFT"),
  aiDraftComment: z.string().max(2000).nullable().default(null),
  officerComment: z.string().max(2000).nullable().default(null),
  finalComment: z.string().max(2000).nullable().default(null),
  reviewedBy: z.string().nullable().default(null),
  verifiedBy: z.string().nullable().default(null),
});

export const StatusHistoryEntrySchema = z.object({
  fromStatus: z.string().nullable(),
  toStatus: z.string().min(1),
  action: z.string().min(1).max(100),
  actorUid: z.string().min(1),
  actorRole: z.string().min(1),
  remarks: z.string().max(1000).nullable().default(null),
});
