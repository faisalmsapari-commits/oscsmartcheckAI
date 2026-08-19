# OSC Comment Lifecycle & Workflow

```text
Deterministic SmartCheck (Prompt 09) + Verified Facts (07/08) + Issues (10)
                                ↓
                 buildPlanningCommentContext()
        (Compact, PII-Minimized, Source-Fingerprinted)
                                ↓
                 Server-Side Genkit / Gemini Flow
                                ↓
                 Zod Schema Validation (OscDraftSchema)
                                ↓
        commentDrafts/{draftId} (Status: AI_DRAFT) [OFFICER-ONLY]
                                ↓
         Officer Review & Editing Workspace (/comments)
           ├─ Section Markdown Editor
           ├─ Diff Viewer (AI Draft vs Officer Edit)
           └─ Prohibited Word Validation
                                ↓
         Explicit Officer Verification (SAHKAN ULASAN)
                                ↓
       verifiedComments/{commentId} (IMMUTABLE SNAPSHOT)
                                ↓
         Officer Publication (TERBITKAN KEPADA PEMOHON)
                                ↓
       Applicant Official Comment View (/official-comments)
```

## State Definitions
- `DRAF AI`: Raw AI-generated text stored in `aiGeneratedText`.
- `DRAF PEGAWAI`: Modified text stored in `officerEditedText` with revision tracking.
- `ULASAN DISAHKAN`: Immutable snapshot locked in `verifiedComments`.
- `ULASAN DITERBITKAN`: Comment marked `APPLICANT_VISIBLE` for external applicant viewing.
