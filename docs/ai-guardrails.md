# AI Guardrails & Prompt Integrity

## 1. Safety Guardrails & Principles

1. **Deterministic Separation:** Genkit flows consume verified structured JSON inputs. Gemini is never prompted to compute mathematical formulas or evaluate geometric intersections directly.
2. **Prohibited Phrase Filter:** `PROHIBITED_PHRASES` regex and string checks prevent statutory approval or rejection words in draft generation and verification stages.
3. **Data Minimization (PII Reduction):** Personal identification numbers (NRIC), phone numbers, bank details, and personal addresses are excluded from `PlanningCommentContext`.
4. **Source Evidence Traceability:** Every statement generated in `categoryComments` contains references to rule codes and source guideline clauses.
