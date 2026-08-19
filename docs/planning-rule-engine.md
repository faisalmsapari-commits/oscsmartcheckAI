# Planning Rule Engine & Compliance Decision Core

## 1. Overview & Objectives

The **Planning Rule Engine** is the deterministic machine-computed compliance core of **OSC SmartCheck AI** (Majlis Perbandaran Langkawi Bandaraya Pelancongan - MPLBP). It ingests:
1. **Verified LCP Project Facts** (Prompt 07)
2. **Verified Cadastral & RTD Spatial Facts** (Prompt 08)
3. **Application Metadata**
4. **Approved, Versioned Statutory Planning Rules**

And outputs:
- Deterministic compliance evaluations: `COMPLIANT` (`PATUH`), `NON_COMPLIANT` (`TIDAK PATUH`), `REQUIRES_REVIEW` (`PERLU PENGESAHAN`), `NOT_APPLICABLE` (`TIDAK BERKENAAN`), `INSUFFICIENT_DATA` (`MAKLUMAT TIDAK MENCUKUPI`), `ERROR` (`RALAT SEMAKAN`).
- Category breakdowns (RTD 2030, Parking, Open Space, Plot Ratio, Housing).
- Overall pre-check evaluation (`PASS_PRECHECK`, `REVISION_REQUIRED`, `OFFICER_REVIEW_REQUIRED`, `INSUFFICIENT_DATA`, `PROCESSING_ERROR`).

---

## 2. Fundamental Governance Principles

```text
┌─────────────────────────────────────────────────────────────┐
│               GOVERNANCE & AUDITABILITY CORE                │
├─────────────────────────────────────────────────────────────┤
│ 1. ZERO GENERATIVE AI COMPLIANCE DECISIONS                  │
│    Gemini is NEVER used to determine compliance statuses.    │
│    All evaluations are 100% deterministic arithmetic/logic. │
│                                                             │
│ 2. ZERO STATUTORY KM APPROVAL DECISIONS                     │
│    The engine produces pre-check compliance findings only.  │
│    It never issues statutory approval ("LULUS KM").         │
│                                                             │
│ 3. IMMUTABLE MACHINE RESULTS                                │
│    Officers cannot overwrite machine results. Officer       │
│    assessments (AGREE/DISAGREE) are stored separately.      │
│                                                             │
│ 4. COMPLETE TRACEABILITY                                    │
│    Every result links to the guideline clause, page, and    │
│    step-by-step arithmetic calculation trace.               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Evaluation Pipeline

```text
PlanningDataContext (Verified Facts + Spatial Facts)
       ↓
resolveApplicableRuleSets(applicationDate, jurisdiction)
       ↓
isRuleApplicable(rule, context) [Safe DSL - No eval()]
       ↓
Category Evaluators:
  - ThresholdRuleEvaluator (Min / Max)
  - RangeRuleEvaluator
  - RatioRuleEvaluator (Plot Ratio)
  - FormulaRuleEvaluator (Hotel/Housing Parking, Open Space Area)
  - SpatialZoneRuleEvaluator (RTD 2030 Local Plan)
       ↓
RuleEvaluation[] (with Calculation Traces & Guideline Citations)
       ↓
Category Summaries & Overall Status Aggregation
       ↓
applications/{id}/smartChecks/{smartCheckId} (Versioned Snapshot)
```
