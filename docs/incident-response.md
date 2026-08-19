# Pelan Tindak Balas Insiden (Incident Response Plan) — OSC SmartCheck AI
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

## 1. Tahap Keterukan Insiden (Severity Matrix)

| Tahap | Kriteria | Contoh | Tempoh Respons |
| :--- | :--- | :--- | :--- |
| **SEV1 — Critical** | Gangguan keseluruhan sistem pengeluaran, pencerobohan keselamatan, kebocoran data pemohon atau pengubahsuaian rekod audit bersejarah. | Pelayan gagal berfungsi sepenuhnya; pelanggaran kawalan akses. | $\le 15$ minit |
| **SEV2 — Major** | Fungsi utama terjejas tetapi sebahagian sistem masih boleh digunakan (contohnya penjanaan laporan PDF terhenti atau PostGIS terputus). | Ralat 500 pada enjin SmartCheck; kegagalan penghantaran notifikasi pukal. | $\le 1$ jam |
| **SEV3 — Moderate** | Fungsi teras berfungsi, tetapi terdapat isu prestasi atau ralat antara muka pengguna yang mempunyai jalan penyelesaian sementara. | Pemuatan peta kadaster perlahan; isu susun atur butang UI. | $\le 4$ jam |
| **SEV4 — Minor** | Pertanyaan am, pembetulan ejaan pada label, atau cadangan penambahbaikan kecil. | Pembetulan tipografi pada label notifikasi. | $\le 24$ jam |

## 2. Saluran Komunikasi & Eskalasi
1. **Pengesanan Insiden:** Amaran Google Cloud Monitoring dihantar kepada `osc-tech-support@mplbp.gov.my`.
2. **Pengisytiharan:** Lead Arkitek / Admin mengisytiharkan tahap insiden dan memulakan bilik gerakan maya (War Room).
3. **Penyelesaian & Post-Mortem:** Setiap insiden SEV1/SEV2 memerlukan laporan RCA (Root Cause Analysis) bertulis dalam tempoh 48 jam.
