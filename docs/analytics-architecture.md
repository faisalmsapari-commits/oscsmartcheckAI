# Analytics & Aggregation Architecture

## 1. Pipeline Architecture

```text
Operational Systems (Firestore / Cloud Storage / PostGIS)
                        │
                        ▼
      Incremental Snapshot / Daily Aggregation Job
                        │
                        ▼
       Analytics Snapshots Store (Firestore MVP)
                        │
                        ▼
         AnalyticsRepository Abstraction
                        │
                        ▼
       Management & Operational APIs / DTOs
                        │
                        ▼
           Management UI Dashboard
```

## 2. BigQuery Readiness

The `AnalyticsRepository` interface decouples the frontend DTO layer from the underlying storage mechanism.
- `FirestoreAnalyticsRepository`: Initial MVP implementation reading application snapshots.
- `BigQueryAnalyticsRepository`: Future high-scale data warehouse implementation via Cloud Pub/Sub and BigQuery without modifying frontend contracts.
