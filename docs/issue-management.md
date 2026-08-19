# SmartCheck Issue Management & Workflow

## 1. Issue Data Model (`applications/{id}/issues/{issueId}`)

```typescript
interface SmartCheckIssue {
  issueId: string;
  applicationId: string;
  smartCheckId: string;
  resultId: string;
  ruleCode: string;
  category: RuleCategory;
  issueType: "NON_COMPLIANCE" | "OFFICER_REVIEW" | "MISSING_INFORMATION" | "DATA_CONFLICT" | "GIS_REVIEW" | "PROCESSING_ERROR";
  title: string;
  description: string;
  severity: "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR" | "INFORMATIONAL";
  status: "OPEN" | "IN_REVIEW" | "WAITING_APPLICANT" | "RESOLVED" | "CLOSED" | "SUPERSEDED";
  source: "AUTO_SMARTCHECK" | "OFFICER_CREATED" | "SYSTEM";
  visibility: "INTERNAL" | "APPLICANT_VISIBLE";
  assignedTo: string | null;
  assignedRole: string | null;
  officerCommentDraft?: string | null;
  resolutionType?: IssueResolutionType | null;
  resolutionNote?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
}
```

## 2. Issue Lifecycle State Machine

```text
┌─────────┐     Officer Starts Review     ┌───────────┐
│  OPEN   │ ────────────────────────────> │ IN_REVIEW │
└─────────┘                               └───────────┘
     │                                          │
     │ Publish to Applicant                     │ Request Info
     ▼                                          ▼
┌──────────────────┐                     ┌───────────────────┐
│APPLICANT_VISIBLE │                     │ WAITING_APPLICANT │
└──────────────────┘                     └───────────────────┘
                                                │
                                                │ Applicant Resubmits LCP
                                                ▼
                                         ┌───────────┐
                                         │ IN_REVIEW │
                                         └───────────┘
                                                │
                                                │ Officer Resolves Issue
                                                ▼
                                         ┌───────────┐
                                         │ RESOLVED  │
                                         └───────────┘
```

- **Automatic Generation:** `NON_COMPLIANT`, `REQUIRES_REVIEW`, and `INSUFFICIENT_DATA` automatically spawn `OPEN` issues.
- **Idempotency:** Re-runs do not create duplicate issues for the same `smartCheckId + resultId + issueType`.
- **Visibility Control:** Initially created as `INTERNAL`. Officers explicitly publish issues to the applicant.
- **Supersession:** When a new SmartCheck run is triggered, open issues from the previous run are marked `SUPERSEDED` rather than silently deleted.
