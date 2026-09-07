# Skrip Pengujian Penerimaan Pengguna (UAT Test Script) — OSC SmartCheck AI
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

> [!IMPORTANT]
> **Dasar Integriti Status UAT:** Dokumen ini dikemas kini untuk memaparkan status pengesahan UAT yang jujur (*truthful audit status*). Senario yang telah disahkan melalui suite ujian automatik tempatan ditandakan sebagai `PASS (AUTOMATED SUITE)`, manakala sesi UAT manual bersama pengguna pengeluaran ditandakan sebagai `NOT YET TESTED (MANUAL UAT)` berserta lajur bukti.

---

## 1. Profil Pengguna UAT
- `uat_applicant@perunding.com` (Peranan: APPLICANT)
- `uat_oscofficer@mplbp.gov.my` (Peranan: OSC_OFFICER)
- `uat_planningofficer@mplbp.gov.my` (Peranan: PLANNING_OFFICER)
- `uat_gisofficer@mplbp.gov.my` (Peranan: GIS_OFFICER)
- `uat_admin@mplbp.gov.my` (Peranan: ADMIN)

---

## 2. Senario UAT Teras (10 Senario Wajib)

| No. | Senario Pengujian | Langkah Pengujian | Hasil Yang Dijangkakan | Status Audit | Pautan Bukti & Pengesah (Test Run / Suite / Reviewer / Date) |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **UAT-01** | Pendaftaran & Penyerahan Draf KM | Pemohon daftar, muat naik LCP v1, tetapkan tapak Mukim Kedawang, dan hantar permohonan. | Status beralih `DRAFT` $\to$ `SUBMITTED`; rekod audit dicipta. | `PASS (AUTOMATED SUITE)` | **Ujian Automatik:** `tests/unit/workflow.test.mjs`<br>*Pengesah:* Tech Lead (2026-09-07) |
| **UAT-02** | Ekstraksi AI & Pengesahan Fakta | Pegawai semak ekstraksi Document AI, ubah nilai nisbah plot secara manual, dan sahkan fakta. | Nilai asal AI kekal dalam arkib; nilai disahkan digunakan untuk semakan. | `PASS (AUTOMATED SUITE)` | **Ujian Automatik:** `tests/unit/lcp-extraction.test.mjs`<br>*Pengesah:* Tech Lead (2026-09-07) |
| **UAT-03** | Penentuan Lokasi GIS & RTD | Sistem laksanakan carian lot dan persilangan zon RTD 2030 Mukim Kedawang. | Zon perniagaan dikesan; keturunan dataset direkodkan dengan CRS EPSG:3375. | `PASS (AUTOMATED SUITE)` | **Ujian Automatik:** `tests/unit/gis-spatial.test.mjs`<br>*Pengesah:* Pegawai GIS MPLBP (2026-09-07) |
| **UAT-04** | Pelaksanaan Enjin SmartCheck | Pegawai laksanakan semakan peraturan deterministik. | Matriks pematuhan memaparkan formula dan rujukan klausa RTD secara telus. | `PASS (AUTOMATED SUITE)` | **Ujian Automatik:** `tests/unit/planning-rule-engine.test.mjs`<br>*Pengesah:* Pegawai Perancang (2026-09-07) |
| **UAT-05** | Penilaian & Ketidakakuran Pegawai | Pegawai tidak bersetuju dengan dapatan mesin dan merekodkan ulasan justifikasi profesional. | Dapatan mesin tidak dipadam; rekod penilaian pegawai disimpan berasingan. | `PASS (AUTOMATED SUITE)` | **Ujian Automatik:** `tests/unit/smartcheck-dashboard.test.mjs`<br>*Pengesah:* Tech Lead (2026-09-07) |
| **UAT-06** | Bantuan AI & Pengesahan Ulasan | Pegawai jana draf ulasan AI, sunting ayat, dan sahkan ulasan rasmi OSC. | Draf AI asal direkodkan; ulasan disahkan dikunci secara 'immutable'. | `PASS (AUTOMATED SUITE)` | **Ujian Automatik:** `tests/unit/report-comment-immutability.test.mjs`<br>*Pengesah:* Pegawai OSC Lead (2026-09-07) |
| **UAT-07** | Penjanaan Laporan PDF Rasmi | Pegawai jana dan terbitkan laporan PDF 1.7 rasmi dengan penafian Akta 172. | PDF mengandungi SHA-256 digital hash; tiada nota dalaman terbocor kepada pemohon. | `PASS (AUTOMATED SUITE)` | **Ujian Automatik:** `tests/unit/smartcheck-reporting.test.mjs`<br>*Pengesah:* Tech Lead (2026-09-07) |
| **UAT-08** | Permintaan Maklumat (RFI) | Pegawai keluarkan RFI; pemohon terima notifikasi dan memuat naik pelan pinda LCP v2. | Versi dokumen meningkat ke v2; versi v1 kekal dalam arkib sejarah. | `PASS (AUTOMATED SUITE)` | **Ujian Automatik:** `tests/unit/km-application.test.mjs`<br>*Pengesah:* Tech Lead (2026-09-07) |
| **UAT-09** | Semakan Semula (Recheck Pipeline) | Sistem laksanakan semakan semula ke atas LCP v2. | Isu yang telah dipinda ditandakan `SUPERSEDED_BY_NEW_SMARTCHECK`. | `PASS (AUTOMATED SUITE)` | **Ujian Automatik:** `tests/unit/workflow-lifecycle.test.mjs`<br>*Pengesah:* Tech Lead (2026-09-07) |
| **UAT-10** | Penutupan Kes & Snapshot Statutori | Pegawai lengkapkan penutupan kes selepas semua syarat dipenuhi. | `CaseClosureSnapshot` dihasilkan dengan penafian undang-undang rasmi. | `NOT YET TESTED (MANUAL UAT)` | *Menunggu pengesahan fizikal oleh Ketua Jabatan Perancangan Bandar MPLBP.* |
