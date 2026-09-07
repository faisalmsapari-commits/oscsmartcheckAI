# Document AI Processor Configuration & Custom Document Extractor Training Guide

**Document Version:** 1.0.0  
**Target Platform:** Google Cloud Document AI Workbench  
**Application:** OSC SmartCheck AI (Majlis Perbandaran Langkawi Bandar Pelancongan - MPLBP)  

---

## 1. Current Document AI Configuration Audit

| Configuration Parameter | Active Value / Default | Description |
| :--- | :--- | :--- |
| `DOCUMENT_AI_PROJECT_ID` | `osc-smartcheck-mplbp` | Google Cloud Project ID |
| `DOCUMENT_AI_LOCATION` | `us` / `eu` | Document AI API Multi-Region |
| `DOCUMENT_AI_PROCESSOR_ID` | Environment variable | Configured Processor ID |
| **Processor Type** | **Form Parser / Generic OCR** | Standard key-value and layout text extraction processor. |

To achieve maximum extraction accuracy ($\ge 98\%$) on Malaysian LCP cover sheets, layout plan title blocks, and statutory planning submission forms, a **Custom Document Extractor (CDE)** should be trained and deployed via the Google Cloud Console.

---

## 2. Step-by-Step Custom Document Extractor (CDE) Training Protocol

### Step 1: Create Custom Document Extractor in GCP Console
1. Navigate to [Google Cloud Console -> Document AI -> Processors](https://console.cloud.google.com/ai/document-ai/processors).
2. Click **Create Processor** and select **Custom Document Extractor (CDE)** under Custom Processors.
3. Set Processor Name: `mplbp-lcp-custom-extractor`.
4. Region: Select `us` (or preferred primary region).
5. Click **Create**. Copy the generated **Processor ID** (e.g. `98234ab10c72e90f`).

---

### Step 2: Define Entity Schema
In the Document AI Workbench **Schema** tab, configure the target planning entities:

```text
┌───────────────────────────┬──────────────┬────────────────────────────────────────────────────────┐
│ Entity Name               │ Value Type   │ Description / Example                                  │
├───────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ projectTitle              │ string       │ Tajuk Cadangan Pembangunan                             │
│ applicantName             │ string       │ Nama Pemaju / Pemohon                                  │
│ consultantName            │ string       │ Jururancang Bandar / PSP                               │
│ lotNumber                 │ string       │ Nombor Lot Tanah (e.g. Lot 1042, Lot 1043)             │
│ mukim                     │ string       │ Mukim (Kuah, Kedawang, Padang Matsirat, etc.)          │
│ district                  │ string       │ Daerah (Langkawi)                                      │
│ siteAreaSqm               │ number       │ Keluasan Tapak Pembangunan (m²)                        │
│ proposedLandUse           │ string       │ Guna Tanah Dicadangkan (Hotel, Perumahan, Komersial)   │
│ grossFloorAreaSqm         │ number       │ Jumlah Keluasan Lantai Kasar / GFA (m²)                │
│ plotRatio                 │ number/string│ Nisbah Plot / Plot Ratio (e.g. 1:2.5)                  │
│ plinthAreaPercent         │ number       │ Liputan Bangunan / Plinth Area (%)                     │
│ numberOfFloors            │ number       │ Ketinggian Tingkat Bangunan                            │
│ maximumBuildingHeightM    │ number       │ Ketinggian Maksimum Bangunan (meter)                   │
│ carParkingProvided        │ number       │ Petak Tempat Letak Kereta                              │
│ motorcycleParkingProvided │ number       │ Petak Tempat Letak Motosikal                           │
│ disabledParkingProvided   │ number       │ Petak Tempat Letak Kereta OKU                          │
│ openSpaceAreaSqm          │ number       │ Keluasan Kawasan Lapang (m²)                           │
└───────────────────────────┴──────────────┴────────────────────────────────────────────────────────┘
```

---

### Step 3: Label Sample Training Documents
1. In the **Train** tab, upload at least **10 to 20 representative Malaysian LCP PDF documents** (cover sheets, parameter tables, and title blocks).
2. Assign 80% of documents to the **Test Set** and 20% to the **Evaluation Set**.
3. Using the Document AI Labeling Tool:
   - Highlight text bounding boxes for each entity defined in Step 2.
   - For parameter tables (Parking counts, Plinth Area, GFA), label table cells explicitly.
4. Click **Save Labeling**.

---

### Step 4: Train & Deploy Processor Version
1. Click **Train New Version**. Set Version Name: `v1.0-lcp-prod`.
2. Wait for training completion (~1 to 2 hours).
3. Review F1-Score evaluation metrics. Verify precision $\ge 95\%$ on key parameters.
4. Click **Set as Default Version** to activate `v1.0-lcp-prod`.

---

### Step 5: Environment Variable Configuration
Copy the deployed Processor ID and update your `.env.local` file:

```bash
# Update .env.local with your new Custom Document Extractor ID
DOCUMENT_AI_PROJECT_ID=osc-smartcheck-mplbp
DOCUMENT_AI_LOCATION=us
DOCUMENT_AI_PROCESSOR_ID=98234ab10c72e90f
```

Restart the Next.js development server:
```bash
npm run dev
```

---

## 3. Accuracy Evaluation & Benchmark Guidelines

To measure extraction accuracy without fabricating benchmark results:
- Run `npm run test` or `node --test tests/unit/extraction-confidence-benchmark.test.mjs`.
- The benchmark script measures empirical field-level extraction rate, evidence quote verification percentage, and confidence score distribution against active ground-truth test fixtures.
