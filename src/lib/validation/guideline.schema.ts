import { z } from "zod";

export const GuidelineSchema = z.object({
  title: z.string().min(3).max(200),
  code: z.string().min(2).max(50),
  version: z.string().min(1).max(20),
  active: z.boolean().default(true),
  sourceDocumentPath: z.string().nullable().default(null),
  createdBy: z.string().min(1),
});

export const RuleSetSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(3).max(200),
  version: z.string().min(1).max(20),
  status: z.enum(["DRAFT", "ACTIVE", "RETIRED"]).default("DRAFT"),
  createdBy: z.string().min(1),
});

export const OrganizationSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(50),
  type: z.enum(["LOCAL_AUTHORITY", "TECHNICAL_AGENCY", "PRIVATE_FIRM", "PUBLIC"]),
  active: z.boolean().default(true),
});
