# Senarai Semak Pelancaran Pengeluaran (Go-Live Checklist) — OSC SmartCheck AI
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

> [!IMPORTANT]
> **Dasar Integriti Status:** Dokumen ini dikemas kini mengikut status pengesahan sebenar (*truthful audit status*). Mana-mana item yang belum mempunyai bukti pengesahan pengeluaran bertulis ditandakan sebagai `PENDING` atau `NEEDS EVIDENCE`.

---

## 1. Pra-Syarat Wajib Sebelum Pelancaran (Pre-Flight Gates)

| Item | Komponen & Perihalan | Status Audit | Pautan Bukti & Pengesah (Test Run / Log / Reviewer / Date) |
| :--- | :--- | :---: | :--- |
| **01. Infrastruktur** | Projek `osc-smartcheck-prod` diasingkan daripada persekitaran pembangunan dan latihan. | `NEEDS EVIDENCE` | *Memerlukan pengesahan akaun GCP production oleh Pentadbir IT MPLBP.* |
| **02. Keselamatan** | Peraturan Firebase Firestore dan Storage dikunci tanpa sebarang capaian terbuka. | `PASS (LOCAL SUITE)` | **Ujian Automatik:** `tests/unit/firestore-rules.test.mjs`<br>*Pengesah:* Tech Lead (2026-09-07) |
| **03. Rahsia & Kunci API** | Tiada kunci API atau kata laluan pangkalan data dalam Git; Google Secret Manager digunakan. | `PASS (AUDITED)` | **Pemeriksaan Repositori:** Tiada `.env` terkod keras dalam Git.<br>*Pengesah:* Tech Lead (2026-09-07) |
| **04. Peraturan Perancangan** | Hanya set peraturan rasmi RTD 2030 v1.0.0 diaktifkan; tiada peraturan `TEST_ONLY`. | `PASS (LOCAL SUITE)` | **Ujian Automatik:** `tests/unit/planning-rule-engine.test.mjs`<br>*Pengesah:* Pegawai Perancang MPLBP (2026-09-07) |
| **05. Dataset GIS** | Lapisan kadaster Langkawi 2026 dan zon guna tanah RTD 2030 rasmi disahkan dan diterbitkan. | `PENDING EVIDENCE` | *Menunggu muat naik dataset rasmi JUPEM ke persekitaran pengeluaran.* |
| **06. Kawalan AI** | AI Kill Switch dan pelan sandaran ulasan manual sedia beroperasi sekiranya Vertex AI terputus. | `NEEDS EVIDENCE` | *Ujian simulasi terputus bekalan Vertex AI dalam staging perlu dilaksanakan.* |
| **07. Laporan PDF** | Templat laporan PDF 1.7 rasmi dengan SHA-256 digital fingerprint disahkan mematuhi format OSC. | `PASS (LOCAL SUITE)` | **Ujian Automatik:** `tests/unit/report-comment-immutability.test.mjs`<br>*Pengesah:* Tech Lead (2026-09-07) |
| **08. Pemberitahuan Emel** | Domain rasmi `@mplbp.gov.my` disahkan; templat bebas daripada pendedahan maklumat peribadi sensitif. | `PENDING EVIDENCE` | *Menunggu pengesahan rekod SPF/DKIM domain emel rasmi MPLBP.* |
| **09. Sandaran & DR** | Ujian pemulihan sandaran Firestore dan PostGIS telah berjaya dilaksanakan dalam persekitaran staging. | `NOT YET TESTED` | *Jadual ujian Pemulihan Bencana (DR) belum dijalankan.* |
| **10. UAT** | 10/10 senario ujian penerimaan pengguna melepasi kriteria tanpa sebarang isu kritikal terbuka. | `NEEDS EVIDENCE` | *Lihat skrip UAT di `docs/uat-test-script.md` untuk status mengikut senario.* |
| **11. Pemantauan** | Google Cloud Monitoring, amaran SEV1–SEV4, dan log berstruktur diaktifkan. | `PENDING EVIDENCE` | *Menunggu penetapan Webhook amaran SEV1 ke bilik operasi IT MPLBP.* |

---

## 2. Perakuan & Kelulusan Pelancaran (Sign-off Signatures)

- **Ketua Pasukan Teknikal (Tech Lead):** `DISAHKAN (TEMPATAN)` — *Faisal (2026-09-07)*
- **Pegawai Pemilik Bisnes OSC (OSC Lead):** `PENDING PRODUCTION VERIFICATION` — *Menunggu sesi semakan akhir*
- **Pegawai Perancang Bandar MPLBP:** `PENDING PRODUCTION VERIFICATION` — *Menunggu penandaan borang UAT rasmi*
- **Pegawai Keselamatan ICT:** `PENDING AUDIT CERTIFICATE` — *Menunggu sijil kelulusan ICT*
