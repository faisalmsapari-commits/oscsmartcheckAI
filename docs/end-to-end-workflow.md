# End-to-End Workflow Lifecycle — OSC SmartCheck AI
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

## 1. Statutory Scope & Governance Principles
The OSC SmartCheck AI end-to-end lifecycle manages the technical pre-check, document verification, Request for Information (RFI), resubmission impact, and final reporting of Kebenaran Merancang (KM) planning applications.

> [!IMPORTANT]
> **Statutory Notice:** Completion of the OSC SmartCheck AI pre-checking workflow (`COMPLETED`) signifies that all automated rules, officer verifications, and compliance matrices have been finalized. It does **NOT** constitute statutory approval of Kebenaran Merancang (KM) under Akta Perancangan Bandar dan Desa 1976 (Akta 172). Formal statutory KM decisions remain exclusively within the purview of the OSC Committee Meeting (Mesyuarat Jawatankuasa OSC).

## 2. State Transition Lifecycle Matrix

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> SUBMITTED: Pemohon hantar
    SUBMITTED --> DOCUMENT_CHECK: Pegawai OSC semak dokumen
    DOCUMENT_CHECK --> AWAITING_DOCUMENT_COMPLETION: Dokumen tidak lengkap
    AWAITING_DOCUMENT_COMPLETION --> RESUBMITTED: Pemohon kemuka dokumen
    DOCUMENT_CHECK --> DOCUMENT_COMPLETE: Dokumen lengkap
    DOCUMENT_COMPLETE --> AI_PROCESSING: Proses Document AI & GIS
    DOCUMENT_CHECK --> AI_PROCESSING
    AI_PROCESSING --> SMARTCHECK_READY: Ekstraksi & spatial selesai
    SMARTCHECK_READY --> SMARTCHECK_COMPLETED: Enjin peraturan selesai
    AI_PROCESSING --> SMARTCHECK_COMPLETED
    SMARTCHECK_COMPLETED --> OFFICER_REVIEW: Pegawai semak dapatan
    OFFICER_REVIEW --> REQUEST_INFORMATION: Pegawai keluar RFI
    OFFICER_REVIEW --> WAITING_APPLICANT: RFI diterbitkan
    REQUEST_INFORMATION --> WAITING_APPLICANT
    REQUEST_INFORMATION --> RESUBMITTED: Pemohon maklum balas
    WAITING_APPLICANT --> RESUBMITTED: Pemohon maklum balas & pelan pinda
    RESUBMITTED --> RECHECK_REQUIRED: Sistem/Pegawai kesan versi baru
    RESUBMITTED --> OFFICER_REVIEW
    RECHECK_REQUIRED --> AI_PROCESSING: Semakan semula peraturan
    RECHECK_REQUIRED --> OFFICER_REVIEW
    OFFICER_REVIEW --> VERIFIED: Pegawai sahkan ulasan
    OFFICER_REVIEW --> VERIFIED_COMMENT_READY
    VERIFIED --> VERIFIED_COMMENT_READY
    VERIFIED_COMMENT_READY --> REPORT_READY: Jana laporan rasmi
    VERIFIED --> REPORT_READY
    VERIFIED --> COMPLETED: Kes selesai
    REPORT_READY --> COMPLETED: Kes selesai
    COMPLETED --> [*]
```

## 3. Transition Auditing & Immutability
All status changes are recorded in two immutable subcollections:
1. `applications/{applicationId}/statusHistory/{historyId}`: Simple status timeline.
2. `applications/{applicationId}/workflowHistory/{transitionId}`: Detailed operational transition audit with actor role, reason, related documents, and automatic/manual flag.
