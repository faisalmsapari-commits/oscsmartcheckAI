# Provider-Neutral Notification Center & SLA Service Targets
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

## 1. Notification Architecture
- **Collection:** `notifications/{notificationId}`
- **Channels:** `IN_APP`, `EMAIL`, `PUSH`, `SMS`.
- **Deduplication Safeguard:** Each automated event emits an idempotent deduplication key (e.g. `RFI_ISSUED:req-123:user-456`). Duplicate deliveries are prevented automatically.
- **Template System:** Controlled template engine with dynamic variable substitution (`{{applicationNo}}`, `{{projectTitle}}`, `{{requestTitle}}`, `{{deadline}}`, `{{portalUrl}}`).

## 2. Internal Service Targets (SLA) & Timers
- **Collection:** `applications/{applicationId}/serviceTimers/{timerId}`
- **Business Calendar:** Default timezone `Asia/Kuala_Lumpur`. Saturday and Sunday are excluded from `BUSINESS_DAYS` and `BUSINESS_HOURS` calculations.
- **Timer Statuses:**
  - `RUNNING`: Timer actively decrementing.
  - `PAUSED`: Timer paused while application is in `WAITING_APPLICANT` state.
  - `COMPLETED`: Officer action concluded within target.
  - `BREACHED`: Deadline passed. Automatically triggers an operational escalation in `escalations/{escalationId}` assigned to `OSC_MANAGER`.
