# Request for Information (RFI) & Applicant Response Workflow
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

## 1. RFI Lifecycle & Model
Collection: `applications/{applicationId}/requests/{requestId}`

### RFI Status Lifecycle:
- `DRAFT`: Initial draft created by officer (can be auto-drafted from an unresolved SmartCheck issue).
- `ISSUED`: Published to applicant, sets `visibility = APPLICANT_VISIBLE`, triggers in-app and email notification.
- `VIEWED`: Automatically recorded when applicant navigates to the RFI detail page.
- `RESPONDED`: Applicant has submitted written explanation and/or revised documents.
- `UNDER_REVIEW`: Officer is examining the submission.
- `SATISFIED`: Officer accepts the response.
- `PARTIALLY_RESPONDED`: Response incomplete; follow-up required.
- `CANCELLED`: Officer withdraws the request.

## 2. Issue-to-RFI Conversion
Officers can convert any non-compliant SmartCheck finding directly into an official RFI. The system pre-fills:
- Issue Title & Description
- Specific RTD 2030 / Local Plan Rule Citation
- Prescribed Remedial Action & Document Upload Requirements

## 3. Applicant Responses
Collection: `applications/{applicationId}/requests/{requestId}/responses/{responseId}`
- Applicants provide textual clarification and link amended documents.
- Draft responses can be saved incrementally before submission.
- Submitting a response transitions the application to `RESUBMITTED` and registers a work item for the assigned officer.
