import type { Timestamp } from "firebase/firestore";

export type ReviewStatus = "DRAFT" | "UNDER_REVIEW" | "VERIFIED";

/**
 * Officer Review Schema: applications/{applicationId}/officerReviews/{reviewId}
 */
export interface OfficerReview {
  id?: string;
  smartCheckId: string;
  reviewStatus: ReviewStatus;
  aiDraftComment: string | null;
  officerComment: string | null;
  finalComment: string | null;
  reviewedBy: string | null;
  verifiedBy: string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  verifiedAt: Timestamp | string | null;
}

/**
 * Application Status Transition Log: applications/{applicationId}/statusHistory/{historyId}
 */
export interface StatusHistoryEntry {
  id?: string;
  fromStatus: string | null;
  toStatus: string;
  action: string;
  actorUid: string;
  actorRole: string;
  timestamp: Timestamp | string;
  remarks: string | null;
}
