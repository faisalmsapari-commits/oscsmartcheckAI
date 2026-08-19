# SmartCheck Compliance Dashboard Architecture

## 1. Overview & Operational Role

The **SmartCheck Compliance Dashboard** (`/applications/[applicationId]/smartcheck`) provides the main review workspace for One Stop Centre (OSC) officers and planning officers at Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP).

Key features:
1. **Header & Context:** Application metadata, lot numbers, mukim, and version lineage (LCP version, Site version, SmartCheck run ID, Rule Engine version).
2. **Permanent Disclaimer:** Clarifies that findings constitute non-statutory pre-check determinations.
3. **Data-Driven Category Breakdown:** Summary metrics for RTD 2030, Parking, Open Space, Plot Ratio, Housing, etc.
4. **Interactive Compliance Matrix:** Filterable, sortable, and searchable table linking each rule to project facts, guideline clauses, and active issues.
5. **Explainable Results & Evidence Chains:** Deep-dive calculation drawer exposing step-by-step arithmetic traces and statutory citations.
6. **Officer Review & Issue Management:** Recording `AGREE` / `DISAGREE` assessments and managing resolution workflows.
