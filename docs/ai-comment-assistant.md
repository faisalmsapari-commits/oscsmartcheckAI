# AI Planning Comment Assistant Architecture

## 1. Role & Governance Policy

The **AI Planning Comment Assistant** (powered by Google Gemini 1.5 via Genkit) acts strictly as a **planning comment drafting assistant** for authorized One Stop Centre (OSC) and planning officers of Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP).

### What the AI Does:
- Summarizes deterministic findings from the Planning Rule Engine (Prompt 09).
- Explains technical criteria differences in formal Malaysian planning language.
- Consolidates related issues across RTD, Parking, Open Space, and Housing.
- References verified facts from LCP extraction and GIS spatial intersection.
- Generates structured, officer-editable drafts (`DRAF AI`).

### What the AI NEVER Does:
- It **never** determines or overrides compliance statuses (`COMPLIANT`, `NON_COMPLIANT`, `REQUIRES_REVIEW`).
- It **never** issues statutory approvals or rejections (`LULUS KM` / `TOLAK MUKTAMAD`).
- It **never** invents or hallucinates regulations, clauses, or lot numbers.
- It **never** publishes official comments directly to applicants without explicit officer verification.
