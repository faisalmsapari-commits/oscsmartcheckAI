# Senarai Semak Pelancaran Pengeluaran (Go-Live Checklist) — OSC SmartCheck AI
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

## 1. Pra-Syarat Wajib Sebelum Pelancaran (Pre-Flight Gates)
- [x] **Infrastruktur:** Projek `osc-smartcheck-prod` diasingkan daripada persekitaran pembangunan dan latihan.
- [x] **Keselamatan:** Peraturan Firebase Firestore dan Storage dikunci tanpa sebarang capaian terbuka.
- [x] **Rahsia & Kunci API:** Tiada kunci API atau kata laluan pangkalan data dalam Git; Google Secret Manager digunakan.
- [x] **Peraturan Perancangan:** Hanya set peraturan rasmi RTD 2030 v1.0.0 diaktifkan; tiada peraturan `TEST_ONLY`.
- [x] **Dataset GIS:** Lapisan kadaster Langkawi 2026 dan zon guna tanah RTD 2030 rasmi disahkan dan diterbitkan.
- [x] **Kawalan AI:** AI Kill Switch dan pelan sandaran ulasan manual sedia beroperasi sekiranya Vertex AI terputus.
- [x] **Laporan PDF:** Templat laporan PDF 1.7 rasmi dengan SHA-256 digital fingerprint disahkan mematuhi format OSC.
- [x] **Pemberitahuan Emel:** Domain rasmi `@mplbp.gov.my` disahkan; templat bebas daripada pendedahan maklumat peribadi sensitif.
- [x] **Sandaran & DR:** Ujian pemulihan sandaran Firestore dan PostGIS telah berjaya dilaksanakan dalam persekitaran staging.
- [x] **UAT:** 10/10 senario ujian penerimaan pengguna melepasi kriteria tanpa sebarang isu kritikal terbuka.
- [x] **Pemantauan:** Google Cloud Monitoring, amaran SEV1–SEV4, dan log berstruktur diaktifkan.

## 2. Perakuan & Kelulusan Pelancaran
- **Ketua Pasukan Teknikal (Tech Lead):** Disahkan & Diluluskan
- **Pegawai Pemilik Bisnes OSC (OSC Lead):** Disahkan & Diluluskan
- **Pegawai Perancang Bandar MPLBP:** Disahkan & Diluluskan
- **Pegawai Keselamatan ICT:** Disahkan & Diluluskan
