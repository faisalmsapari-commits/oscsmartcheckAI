# Planning Rule Schema & Controlled DSL

## 1. Rule Set Model (`planningRuleSets/{ruleSetId}`)

```typescript
interface PlanningRuleSet {
  ruleSetId: string;
  code: string;               // e.g. GPP_MPLBP_SUITE_2026
  name: string;               // e.g. Garis Panduan Standard MPLBP 2026
  description: string;
  category: RuleCategory;
  jurisdiction: string;       // e.g. MPLBP
  authority: string;          // e.g. Majlis Perbandaran Langkawi
  version: string;            // e.g. 1.0.0
  status: "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
  effectiveFrom: string | null;
  effectiveTo: string | null;
  sourceDocumentIds: string[];
  approvedBy: string | null;
  approvedAt: string | null;
  createdBy: string;
  checksum: string;
  isTestOnly?: boolean;
}
```

## 2. Individual Rule Model (`planningRuleSets/{ruleSetId}/rules/{ruleId}`)

```typescript
interface PlanningRule {
  ruleId: string;
  ruleSetId: string;
  code: string;               // e.g. GPP-PARK-HOTEL-01
  name: string;               // e.g. Keperluan Tempat Letak Kereta Hotel
  description: string;
  category: RuleCategory;     // RTD, PARKING, OPEN_SPACE, HOUSING, PLOT_RATIO, etc.
  developmentTypes: string[]; // ["HOTEL", "COMMERCIAL"]
  applicability: RuleApplicabilityDsl;
  ruleType: RuleType;         // THRESHOLD_MIN, THRESHOLD_MAX, RANGE, RATIO, FORMULA, SPATIAL_ZONE
  inputKeys: string[];        // ["hotel.rooms", "parking.carProvided"]
  formula?: FormulaDefinition;
  parameters: Record<string, unknown>;
  severity: "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR" | "INFORMATIONAL";
  failureStatus: "NON_COMPLIANT" | "REQUIRES_REVIEW";
  missingDataStatus: "INSUFFICIENT_DATA" | "REQUIRES_REVIEW";
  sourceDocumentId: string;
  sourceDocumentVersion: string | number;
  sourceClause: string;
  sourcePage: number;
  sourceTextExcerpt: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  priority: number;
  enabled: boolean;
}
```

## 3. Controlled Rule DSL (No `eval()`)

```json
{
  "all": [
    {
      "field": "developmentType",
      "operator": "EQUALS",
      "value": "HOTEL"
    },
    {
      "field": "hotel.rooms",
      "operator": "GREATER_THAN",
      "value": 0
    }
  ]
}
```

Supported Operators:
- `EQUALS`, `NOT_EQUALS`
- `GREATER_THAN`, `GREATER_THAN_OR_EQUAL`
- `LESS_THAN`, `LESS_THAN_OR_EQUAL`
- `IN`, `NOT_IN`
- `EXISTS`, `NOT_EXISTS`
- `BETWEEN`
- `CONTAINS`
