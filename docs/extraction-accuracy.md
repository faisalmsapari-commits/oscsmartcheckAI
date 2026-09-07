# Document AI Processor Configuration & Extraction Accuracy Documentation

**Document Version:** 2.0.0  
**Target Platform:** Google Cloud Document AI & Gemini 1.5 Pro API  
**Application:** OSC SmartCheck AI (Majlis Perbandaran Langkawi Bandar Pelancongan - MPLBP)  

---

## 1. Pipeline Accuracy Testing Architecture

To ensure strict engineering integrity and prevent misrepresenting offline test results as real AI accuracy, the test harness is separated into two distinct layers:

### (a) Offline Smoke Test (`tests/unit/golden-dataset-offline-smoketest.test.mjs`)
- **Purpose**: Validates local code execution paths, normalization functions, and regex fallback parsing without making network requests.
- **Console Label**: `OFFLINE SMOKE TEST — NOT AN ACCURACY BENCHMARK`
- **Known Limitations**: **Does NOT measure live Gemini AI model accuracy.** Historical 50.0% output in early commits was an offline harness self-test result, not an AI accuracy benchmark.

### (b) Live Gemini 1.5 Pro Accuracy Benchmark (`tests/unit/golden-dataset-live.test.mjs`)
- **Purpose**: Evaluates actual Gemini 1.5 Pro inference accuracy against 3 representative golden planning fixtures (`fixture-hotel-chenang`, `fixture-housing-kuah`, `fixture-commercial-bandar`).
- **Prerequisites**: Requires `GEMINI_API_KEY` environment variable.
- **Skip Behavior**: If `GEMINI_API_KEY` is not present, the test explicitly skips with console notice:
  `SKIPPED: GEMINI_API_KEY not set — live accuracy benchmark not run`
- **Session Execution Status (2026-09-07)**: **SKIPPED** (No `GEMINI_API_KEY` configured in current local environment).

---

## 2. How to Run Live Model Accuracy Benchmark

To execute the live accuracy benchmark against Gemini 1.5 Pro:

1. Obtain a valid Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Set `GEMINI_API_KEY` in your `.env.local` file or command line:
   ```bash
   # Windows PowerShell
   $env:GEMINI_API_KEY="AIzaSy..."
   node --test tests/unit/golden-dataset-live.test.mjs

   # Linux / macOS / Bash
   GEMINI_API_KEY="AIzaSy..." node --test tests/unit/golden-dataset-live.test.mjs
   ```
3. GitHub Actions CI/CD Integration:
   - Configured in `.github/workflows/ci.yml` under `live-accuracy-benchmark` job.
   - Triggered via GitHub Actions `workflow_dispatch` (Manual Trigger) using GitHub Secret `${{ secrets.GEMINI_API_KEY }}`.

---

## 3. Custom Document Extractor (CDE) GCP Training Protocol

To achieve maximum Document AI OCR accuracy on scanned Malaysian LCP cover sheets and layout plan title blocks:

### Step 1: Create Processor
1. Go to [GCP Console -> Document AI -> Processors](https://console.cloud.google.com/ai/document-ai/processors).
2. Create a **Custom Document Extractor (CDE)** named `mplbp-lcp-custom-extractor`.
3. Set region `us` and copy Processor ID.

### Step 2: Define Schema Entities
Configure schema fields: `projectTitle`, `applicantName`, `consultantName`, `lotNumber`, `mukim`, `district`, `siteAreaSqm`, `grossFloorAreaSqm`, `plotRatio`, `buildingCoveragePercent`, `numberOfFloors`, `maximumBuildingHeightM`, `carParkingProvided`, `motorcycleParkingProvided`, `disabledParkingProvided`, `openSpaceAreaSqm`.

### Step 3: Label & Train
1. Upload 10-20 sample Malaysian LCP documents.
2. Label bounding boxes and parameter table cells.
3. Train new version `v1.0-lcp-prod` and set as default.

### Step 4: Set Environment Variable
Update `.env.local`:
```bash
DOCUMENT_AI_PROJECT_ID=osc-smartcheck-mplbp
DOCUMENT_AI_LOCATION=us
DOCUMENT_AI_PROCESSOR_ID=<your-processor-id>
```
