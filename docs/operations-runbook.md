# Runbook Operasi & Penyelenggaraan — OSC SmartCheck AI
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

## 1. Senarai Semak Harian (Daily Operational Checklist)
- [ ] **Semakan Kesihatan Sistem:** Buka `/api/admin/health` untuk memastikan Firestore, Storan, dan PostGIS beroperasi lancar.
- [ ] **Semakan Isu & Eskalasi:** Semak halaman `/management/escalations` bagi memantau permohonan yang melebihi sasaran masa dalaman (SLA).
- [ ] **Semakan Tugasan Tergantung:** Kenal pasti kerja pemprosesan dokumen AI yang berstatus `PROCESSING` melebihi 30 minit.
- [ ] **Integriti Data:** Semak log diagnostik orphan records melalui `/admin/operations`.

## 2. Pengurusan Sandaran & Penyelenggaraan Mingguan
- [ ] **Verifikasi Sandaran:** Sahkan status sandaran automatik Firestore di Google Cloud Storage.
- [ ] **Kajian Semula Akses Pengguna Istimewa:** Laksanakan `reviewPrivilegedUsers()` untuk mengaudit akaun pegawai pentadbir dan perancang yang aktif.
- [ ] **Semakan Kapasiti & Kos:** Pantau kuota panggilan Vertex AI dan penggunaan storan PDF.
