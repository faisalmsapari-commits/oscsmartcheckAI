import type { SmartCheckReportData } from "../../../types/reports.ts";

export const SMARTCHECK_REPORT_TEMPLATE_VERSION = "1.0.0";

/**
 * Generates deterministic, beautifully styled HTML for the SmartCheck PDF Report
 */
export function generateSmartCheckReportHtml(data: SmartCheckReportData): string {
  const {
    reportMetadata,
    application,
    applicant,
    consultant,
    site,
    documents,
    spatialSummary,
    smartCheckSummary,
    categorySummaries,
    results,
    issues,
    verifiedComment,
    sourceVersions,
    verification,
  } = data;

  const classificationText =
    reportMetadata.classification === "INTERNAL"
      ? "UNTUK KEGUNAAN DALAMAN"
      : reportMetadata.classification === "APPLICANT"
      ? "SALINAN PEMOHON"
      : "REKOD AUDIT & PEMATUHAN";

  const watermarkText =
    reportMetadata.classification === "INTERNAL"
      ? "DALAMAN"
      : reportMetadata.classification === "APPLICANT"
      ? "SALINAN SISTEM"
      : "AUDIT";

  return `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <title>Laporan SmartCheck - ${application.applicationNo}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-family: Arial, sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
      @bottom-left {
        content: "OSC SmartCheck AI — Majlis Perbandaran Langkawi Bandaraya Pelancongan";
        font-family: Arial, sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      line-height: 1.4;
      font-size: 9.5pt;
      margin: 0;
      padding: 0;
      position: relative;
    }

    .watermark {
      position: fixed;
      top: 40%;
      left: 20%;
      width: 60%;
      text-align: center;
      font-size: 55pt;
      font-weight: 900;
      color: rgba(148, 163, 184, 0.08);
      transform: rotate(-35deg);
      z-index: -1000;
      pointer-events: none;
      text-transform: uppercase;
      letter-spacing: 5px;
    }

    .page-break {
      page-break-before: always;
    }

    /* Cover Page */
    .cover-page {
      text-align: center;
      padding-top: 40px;
      page-break-after: always;
      min-height: 800px;
    }

    .emblem-title {
      font-size: 13pt;
      font-weight: bold;
      color: #1e3a8a;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .emblem-subtitle {
      font-size: 10pt;
      color: #475569;
      margin-bottom: 40px;
    }

    .main-title {
      font-size: 22pt;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .sub-main-title {
      font-size: 12pt;
      color: #2563eb;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 40px;
    }

    .classification-badge {
      display: inline-block;
      padding: 6px 16px;
      font-size: 10pt;
      font-weight: bold;
      color: #1e3a8a;
      background-color: #dbeafe;
      border: 1px solid #bfdbfe;
      border-radius: 3px;
      margin-bottom: 40px;
    }

    .cover-table {
      width: 85%;
      margin: 0 auto;
      text-align: left;
      border-collapse: collapse;
      font-size: 9.5pt;
    }

    .cover-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
    }

    .cover-table td.label {
      width: 35%;
      font-weight: bold;
      color: #475569;
    }

    .cover-table td.val {
      color: #0f172a;
      font-weight: 600;
    }

    /* Standard Layout */
    .header-bar {
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 8px;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .header-logo-text {
      font-size: 9pt;
      font-weight: bold;
      color: #1e3a8a;
    }

    .header-meta {
      font-size: 8pt;
      color: #64748b;
      text-align: right;
    }

    h2.section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #1e3a8a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 18px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .disclaimer-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #3b82f6;
      padding: 8px 12px;
      font-size: 8pt;
      color: #475569;
      margin-bottom: 14px;
      border-radius: 2px;
    }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 8.5pt;
    }

    table.data-table th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: bold;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-size: 8pt;
    }

    table.data-table td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }

    .status-compliant {
      color: #065f46;
      background-color: #d1fae5;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 2px;
      display: inline-block;
      font-size: 7.5pt;
    }

    .status-non-compliant {
      color: #991b1b;
      background-color: #fee2e2;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 2px;
      display: inline-block;
      font-size: 7.5pt;
    }

    .status-review {
      color: #92400e;
      background-color: #fef3c7;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 2px;
      display: inline-block;
      font-size: 7.5pt;
    }

    .comment-block {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 12px;
      font-family: inherit;
      white-space: pre-wrap;
      font-size: 8.5pt;
      line-height: 1.5;
      color: #0f172a;
    }

    .footer-stamp {
      margin-top: 25px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #64748b;
      font-family: monospace;
    }
  </style>
</head>
<body>

  <div class="watermark">${watermarkText}</div>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="emblem-title">Majlis Perbandaran Langkawi Bandaraya Pelancongan</div>
    <div class="emblem-subtitle">Pusat Setempat (OSC) & Jabatan Perancang Bandar</div>

    <div class="main-title">LAPORAN SMARTCHECK</div>
    <div class="sub-main-title">PRA-SEMAKAN KEPATUHAN KEBENARAN MERANCANG</div>

    <div class="classification-badge">${classificationText}</div>

    <table class="cover-table">
      <tr>
        <td class="label">No. Permohonan KM:</td>
        <td class="val">${application.applicationNo}</td>
      </tr>
      <tr>
        <td class="label">Tajuk Projek:</td>
        <td class="val">${application.projectTitle}</td>
      </tr>
      <tr>
        <td class="label">Jenis Pembangunan:</td>
        <td class="val">${application.developmentType} (${application.category})</td>
      </tr>
      <tr>
        <td class="label">Pemohon / Pemaju:</td>
        <td class="val">${applicant.applicantName}${applicant.companyName ? ` (${applicant.companyName})` : ""}</td>
      </tr>
      <tr>
        <td class="label">Mukim & Daerah:</td>
        <td class="val">Mukim ${site.mukim}, Daerah ${site.district}</td>
      </tr>
      <tr>
        <td class="label">Versi Laporan:</td>
        <td class="val">Versi ${reportMetadata.reportVersion}</td>
      </tr>
      <tr>
        <td class="label">Tarikh Laporan:</td>
        <td class="val">${new Date(reportMetadata.generatedAt).toLocaleDateString("ms-MY", { day: "numeric", month: "long", year: "numeric" })}</td>
      </tr>
      <tr>
        <td class="label">Keputusan Keseluruhan:</td>
        <td class="val" style="color: #1e3a8a;">${smartCheckSummary.overallStatus}</td>
      </tr>
    </table>
  </div>

  <!-- PAGE BREAK TO CONTENT -->
  <div class="page-break"></div>

  <!-- RUNNING HEADER -->
  <div class="header-bar">
    <div class="header-logo-text">OSC SMARTCHECK AI — MPLBP</div>
    <div class="header-meta">
      ${application.applicationNo} | Lap. v${reportMetadata.reportVersion} | ${new Date(reportMetadata.generatedAt).toLocaleDateString("ms-MY")}
    </div>
  </div>

  <!-- STATUTORY DISCLAIMER -->
  <div class="disclaimer-box">
    <strong>NOTIS KERAJAAN & STATUTORI:</strong> Laporan SmartCheck ini merupakan rekod pra-semakan teknikal berasaskan data pemajuan, dokumen LCP, set data spatial RTD 2030, dan peraturan perancangan yang direkodkan dalam sistem. Keputusan rasmi statutori berkaitan Kebenaran Merancang (KM) adalah tertakluk kepada kuasa dan pertimbangan Jawatankuasa Pusat Setempat (OSC) Majlis Perbandaran Langkawi Bandaraya Pelancongan.
  </div>

  <!-- SECTION A: RINGKASAN PERMOHONAN -->
  <h2 class="section-title">A. Ringkasan Permohonan</h2>
  <table class="data-table">
    <tr>
      <th style="width: 25%;">No. Rujukan Rasmi</th>
      <td style="width: 25%; font-weight: bold;">${application.applicationNo}</td>
      <th style="width: 25%;">Status Permohonan</th>
      <td style="width: 25%;">${application.status}</td>
    </tr>
    <tr>
      <th>Tajuk Projek</th>
      <td colspan="3">${application.projectTitle}</td>
    </tr>
    <tr>
      <th>Jenis & Kategori</th>
      <td>${application.developmentType} (${application.category})</td>
      <th>Tarikh Penyerahan</th>
      <td>${application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("ms-MY") : "-"}</td>
    </tr>
    <tr>
      <th>Pemohon / Pemaju</th>
      <td>${applicant.applicantName}</td>
      <th>Perunding Perancang</th>
      <td>${consultant?.principalSubmittingPerson || "-"}</td>
    </tr>
  </table>

  <!-- SECTION B: DOKUMEN & PELAN PEMAJUAN -->
  <h2 class="section-title">B. Snapshot Dokumen & Pelan Pemajuan</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 30%;">Jenis Dokumen</th>
        <th style="width: 15%;">Versi Digunakan</th>
        <th style="width: 35%;">Nama Fail</th>
        <th style="width: 20%;">Tarikh Muat Naik</th>
      </tr>
    </thead>
    <tbody>
      ${documents.map((d) => `
        <tr>
          <td><strong>${d.documentType}</strong></td>
          <td style="text-align: center;">Versi ${d.version}</td>
          <td>${d.fileName}</td>
          <td>${new Date(d.uploadedAt).toLocaleDateString("ms-MY")}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- SECTION C: MAKLUMAT TAPAK & GIS SPATIAL -->
  <h2 class="section-title">C. Maklumat Tapak & Konteks Spatial GIS</h2>
  <table class="data-table">
    <tr>
      <th style="width: 25%;">No. Lot Terlibat</th>
      <td style="width: 25%; font-weight: bold;">${site.lotNumbers.join(", ") || "-"}</td>
      <th style="width: 25%;">Mukim & Daerah</th>
      <td style="width: 25%;">Mukim ${site.mukim}, ${site.district}</td>
    </tr>
    <tr>
      <th>Keluasan Tapak GIS</th>
      <td>${site.siteAreaSqm.toLocaleString("ms-MY")} m²</td>
      <th>Status Pengesahan Tapak</th>
      <td>${spatialSummary.siteVerificationStatus}</td>
    </tr>
    <tr>
      <th>Zon RTD 2030 (Primer)</th>
      <td><strong>${spatialSummary.primaryZoneCode || "-"}</strong> (${spatialSummary.primaryZoneName || "-"})</td>
      <th>Pertindihan Zon</th>
      <td>${spatialSummary.primaryZonePercent}%</td>
    </tr>
  </table>

  <!-- SECTION D: RINGKASAN SMARTCHECK -->
  <h2 class="section-title">D. Ringkasan Status Pra-Semakan SmartCheck</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>Kategori Garis Panduan</th>
        <th style="text-align: center;">Jumlah Kriteria</th>
        <th style="text-align: center;">Patuh</th>
        <th style="text-align: center;">Tidak Patuh</th>
        <th style="text-align: center;">Perlu Pengesahan</th>
        <th style="text-align: center;">Status Kategori</th>
      </tr>
    </thead>
    <tbody>
      ${categorySummaries.map((cat) => `
        <tr>
          <td><strong>${cat.categoryName}</strong></td>
          <td style="text-align: center;">${cat.totalRules}</td>
          <td style="text-align: center; color: #065f46; font-weight: bold;">${cat.compliantCount}</td>
          <td style="text-align: center; color: #991b1b; font-weight: bold;">${cat.nonCompliantCount}</td>
          <td style="text-align: center; color: #92400e; font-weight: bold;">${cat.requiresReviewCount}</td>
          <td style="text-align: center;">
            <span class="${cat.status === "COMPLIANT" ? "status-compliant" : cat.status === "NON_COMPLIANT" ? "status-non-compliant" : "status-review"}">
              ${cat.status}
            </span>
          </td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- SECTION E: MATRIKS PEMATUHAN TERPERINCI -->
  <h2 class="section-title">E. Matriks Pematuhan Kriteria Perancangan</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 15%;">Kod & Kriteria</th>
        <th style="width: 15%;">Kategori</th>
        <th style="width: 15%;">Data Projek</th>
        <th style="width: 15%;">Keperluan Piawai</th>
        <th style="width: 15%;">Perbezaan</th>
        <th style="width: 10%;">Status</th>
        <th style="width: 15%;">Rujukan Garis Panduan</th>
      </tr>
    </thead>
    <tbody>
      ${results.map((r) => `
        <tr>
          <td><strong>${r.ruleCode}</strong><br><span style="font-size: 7.5pt; color: #64748b;">${r.ruleName}</span></td>
          <td>${r.category}</td>
          <td><strong>${String(r.actualValue ?? "-")}</strong> ${r.unit || ""}</td>
          <td>${String(r.requiredValue ?? "-")} ${r.unit || ""}</td>
          <td>${r.difference !== null && r.difference !== undefined ? `${r.difference > 0 ? "+" : ""}${r.difference} ${r.unit || ""}` : "-"}</td>
          <td>
            <span class="${r.machineStatus === "COMPLIANT" ? "status-compliant" : r.machineStatus === "NON_COMPLIANT" ? "status-non-compliant" : "status-review"}">
              ${r.machineStatus}
            </span>
          </td>
          <td style="font-size: 7.5pt;">${r.sourceClause} ${r.sourcePage ? `(ms ${r.sourcePage})` : ""}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- SECTION F: RINGKASAN ISU -->
  <h2 class="section-title">F. Ringkasan Isu & Keperluan Tindakan</h2>
  ${issues.length === 0 ? `
    <p style="font-size: 8.5pt; color: #065f46; font-style: italic;">Tiada isu atau ketidakpatuhan dikesan dalam larian semakan ini.</p>
  ` : `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 25%;">Tajuk Isu</th>
          <th style="width: 15%;">Keutamaan</th>
          <th style="width: 15%;">Status</th>
          <th style="width: 45%;">Tindakan Diperlukan Pemohon</th>
        </tr>
      </thead>
      <tbody>
        ${issues.map((iss) => `
          <tr>
            <td><strong>${iss.title}</strong></td>
            <td>${iss.severity}</td>
            <td>${iss.status}</td>
            <td>${iss.requiredAction || iss.description}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `}

  <!-- SECTION G: ULASAN RASMI OSC -->
  <h2 class="section-title">G. Ulasan Rasmi Pusat Setempat (OSC)</h2>
  ${verifiedComment ? `
    <div style="font-size: 8pt; color: #475569; margin-bottom: 4px;">
      Disahkan oleh <strong>${verifiedComment.verifiedBy}</strong> pada ${new Date(verifiedComment.verifiedAt).toLocaleDateString("ms-MY")} (Versi Ulasan ${verifiedComment.version}).
    </div>
    <div class="comment-block">${verifiedComment.finalText}</div>
  ` : `
    <div class="comment-block" style="color: #64748b; font-style: italic;">Ulasan teknikal OSC belum disahkan untuk permohonan ini.</div>
  `}

  <!-- SECTION H: PUNCA KUASA & RUJUKAN -->
  <h2 class="section-title">H. Punca Kuasa & Versi Sumber Rujukan</h2>
  <table class="data-table">
    <tr>
      <th style="width: 25%;">Enjin Peraturan (Engine)</th>
      <td style="width: 25%;">v${sourceVersions.ruleEngineVersion}</td>
      <th style="width: 25%;">Set Peraturan Pematuhan</th>
      <td style="width: 25%;">${sourceVersions.ruleSetVersions.join(", ")}</td>
    </tr>
    <tr>
      <th>Set Data Spatial RTD</th>
      <td>${sourceVersions.gisDatasetVersions.join(", ")}</td>
      <th>Templat Laporan Rasmi</th>
      <td>v${sourceVersions.templateVersion}</td>
    </tr>
  </table>

  <!-- SECTION I: REKOD PENGESAHAN -->
  <h2 class="section-title">I. Rekod Pengesahan Pegawai</h2>
  <table class="data-table">
    <tr>
      <th style="width: 35%;">Pengesahan Tapak & Lot Cadastral</th>
      <td style="width: 65%;">${verification.siteVerifiedBy ? `Disahkan oleh ${verification.siteVerifiedBy} (${verification.siteVerifiedAt ? new Date(verification.siteVerifiedAt).toLocaleDateString("ms-MY") : ""})` : "Belum Disahkan"}</td>
    </tr>
    <tr>
      <th>Pengesahan Ulasan Teknikal OSC</th>
      <td>${verification.commentVerifiedBy ? `Disahkan oleh ${verification.commentVerifiedBy} (${verification.commentVerifiedAt ? new Date(verification.commentVerifiedAt).toLocaleDateString("ms-MY") : ""})` : "Belum Disahkan"}</td>
    </tr>
  </table>

  <!-- SECTION J: REKOD SISTEM & INTEGRITI -->
  <h2 class="section-title">J. Integriti Rekod Digital Sistem</h2>
  <div class="footer-stamp">
    <div>
      <div>ID Laporan: <strong>${reportMetadata.reportId}</strong></div>
      <div>ID SmartCheck: <strong>${smartCheckSummary.smartCheckId}</strong></div>
    </div>
    <div style="text-align: right;">
      <div>Dijana Oleh: <strong>${reportMetadata.generatedBy}</strong></div>
      <div>Tarikh & Masa: <strong>${reportMetadata.generatedAt}</strong></div>
    </div>
  </div>

</body>
</html>`;
}
