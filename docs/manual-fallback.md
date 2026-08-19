# Prosedur Sandaran Manual (Manual Fallback SOP) — OSC SmartCheck AI
**Majlis Perbandaran Langkawi Bandaraya Pelancongan (MPLBP)**

## 1. Prinsip Kesinambungan Perkhidmatan
> [!IMPORTANT]
> Ketiadaan capaian perkhidmatan AI (Gemini / Vertex AI) atau perkhidmatan awan pihak ketiga **TIDAK BOLEH** menghalang pelaksanaan tugas statutori semakan permohonan Kebenaran Merancang (KM) di bawah Akta 172.

## 2. Pelaksanaan Mod Manual

### 1. Semakan Dokumen & Ekstraksi Fakta LCP
- Sekiranya Google Document AI tidak beroperasi, pegawai penilai membuka dokumen PDF LCP secara langsung melalui PDF viewer.
- Pegawai memasukkan parameter perancangan (nisbah plot, anjakan, tempat letak kereta, kawasan lapang) secara manual dalam borang pengesahan fakta.

### 2. Penilaian Peraturan SmartCheck
- Enjin peraturan deterministik SmartCheck tetap berfungsi 100% secara kendiri di pelayan.
- Pematuhan dijana berdasarkan fakta yang disahkan oleh pegawai.

### 3. Penggubalan Ulasan OSC
- Sekiranya AI Assistant ditutup (`FEATURE_AI_COMMENT_ENABLED=false`), kotak teks ulasan pegawai memaparkan templat standard perancangan kosong untuk diisi secara manual oleh Pegawai OSC / Perancang.
- Pengesahan manusia tetap beroperasi dengan tandatangan digital dan hash SHA-256.
