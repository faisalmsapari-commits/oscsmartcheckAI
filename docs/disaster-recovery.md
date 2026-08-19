# Pelan Pemulihan Bencana (Disaster Recovery Plan) — OSC SmartCheck AI
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

## 1. Objektif & Sasaran RPO / RTO
- **RPO (Recovery Point Objective):** $\le 1$ jam bagi data transaksi permohonan; 0 minit bagi dokumen rasmi dan laporan PDF ber-hash digital.
- **RTO (Recovery Time Objective):** $\le 4$ jam bagi pemulihan perkhidmatan kritikal; $\le 2$ jam bagi mod sandaran manual.

## 2. Senario Bencana & Prosedur Pemulihan

### Senario A: Kehilangan / Kerosakan Data Firestore
1. **Pemberitahuan & Pembekuan:** Isytiharkan insiden SEV1; aktifkan halaman penyelenggaraan.
2. **Eksport Sandaran:** Kenal pasti snapshot sandaran automatik GCP Firestore terkini (`gs://osc-smartcheck-prod-backups/firestore/`).
3. **Pemulihan Data:**
   ```bash
   gcloud firestore import gs://osc-smartcheck-prod-backups/firestore/YYYY-MM-DD-HHMM/
   ```
4. **Pengesahan Integriti:** Laksanakan ujian integriti data (`findOrphanedRecords()`) untuk mengesahkan hubungan dokumen dan laporan.

### Senario B: Kegagalan Pengkalan Data Spatial PostGIS / Cloud SQL
1. **Pemulihan Titik Masa (PITR):** Laksanakan pemulihan titik masa pada Cloud SQL instance gantian.
2. **Pengesahan Indeks GIST:** Jalankan `REINDEX TABLE gis_cadastral_lots; REINDEX TABLE gis_rtd_zones;`.
3. **Penyelarasan:** Sambungkan semula Cloud Run / API endpoint ke instance baharu.

### Senario C: Gangguan Perkhidmatan AI / Document AI / Vertex AI
1. **Aktifkan Kill Switch:** Sistem beralih ke mod semakan manual tanpa menjejaskan enjin peraturan SmartCheck.
2. **Kebenaran Merancang Berterusan:** Pegawai memasukkan fakta dan draf ulasan secara manual mengikut SOP Sandaran Manual ([`docs/manual-fallback.md`](file:///c:/antigravity/oscsmartchecker/docs/manual-fallback.md)).
