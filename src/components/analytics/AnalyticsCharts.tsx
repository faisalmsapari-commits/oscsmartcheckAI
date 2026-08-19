import React from "react";
import { Card } from "@/components/ui/Card";
import {
  ApplicationTrendPoint,
  StatusDistributionItem,
  CategoryComplianceMetric,
  TopNonComplianceRule,
  IssueAgeingBuckets,
  OfficerWorkloadItem,
  ProcessingTimeMetrics,
  SpatialPlanningMetric,
} from "@/types/analytics";
import { MapPin, Building2 } from "lucide-react";

/**
 * Monthly Application Volume Trend Chart
 */
export function TrendBarChart({ trend }: { trend: ApplicationTrendPoint[] }) {
  if (!trend || trend.length === 0) {
    return (
      <Card headerTitle="Trend Permohonan Bulanan" className="p-6 text-center text-xs text-slate-500">
        Data belum mencukupi untuk analisis tempoh ini.
      </Card>
    );
  }

  const maxVal = Math.max(...trend.map((t) => t.totalCount), 1);

  return (
    <Card headerTitle="Trend Jumlah Permohonan Mengikut Tempoh" className="space-y-4">
      <div className="flex h-52 items-end gap-3 pt-6 pb-2 px-4 border-b border-slate-100">
        {trend.map((t, idx) => {
          const heightPercent = Math.max(8, (t.totalCount / maxVal) * 100);
          return (
            <div key={idx} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end group">
              <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                {t.totalCount}
              </span>
              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full max-w-[42px] rounded-t-sm bg-gov-800 transition-all group-hover:bg-gov-700 relative"
              />
              <span className="text-[10px] font-semibold text-slate-500 truncate w-full text-center">
                {t.periodLabel}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-4 pb-1">
        <span>Unit: Bilangan Permohonan KM</span>
        <span>Jumlah Tempoh: {trend.reduce((a, b) => a + b.totalCount, 0)} permohonan</span>
      </div>
    </Card>
  );
}

/**
 * Application Lifecycle Status Distribution
 */
export function StatusDistributionChart({ distribution }: { distribution: StatusDistributionItem[] }) {
  if (!distribution || distribution.length === 0) {
    return (
      <Card headerTitle="Taburan Status Permohonan" className="p-6 text-center text-xs text-slate-500">
        Tiada data taburan.
      </Card>
    );
  }

  return (
    <Card headerTitle="Taburan Status Aliran Kerja Permohonan" className="space-y-3 p-4">
      <div className="space-y-2.5">
        {distribution.map((item, idx) => (
          <div key={idx} className="space-y-1 text-xs">
            <div className="flex items-center justify-between font-medium text-slate-700">
              <span>{item.label}</span>
              <span className="font-mono text-slate-900 font-bold">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                style={{ width: `${item.percentage}%` }}
                className="h-full bg-gov-800 rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Compliance Evaluation by Category
 */
export function ComplianceCategoryChart({ categories }: { categories: CategoryComplianceMetric[] }) {
  if (!categories || categories.length === 0) {
    return (
      <Card headerTitle="Prestasi Pematuhan Kategori Perancangan" className="p-6 text-center text-xs text-slate-500">
        Tiada rekod penilaian peraturan bagi tempoh ini.
      </Card>
    );
  }

  return (
    <Card headerTitle="Keputusan Pra-Semakan Mengikut Kategori Perancangan" className="space-y-3 p-4">
      <div className="space-y-3 text-xs">
        {categories.map((cat, idx) => (
          <div key={idx} className="rounded-sm border border-slate-200 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{cat.categoryName}</span>
              <span className="rounded-sm bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Pematuhan: {cat.complianceRate}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-[11px] text-center pt-1 border-t border-slate-100">
              <div className="rounded-xs bg-slate-50 p-1">
                <span className="text-slate-400 block text-[9px]">JUMLAH</span>
                <strong className="text-slate-800">{cat.totalEvaluated}</strong>
              </div>
              <div className="rounded-xs bg-emerald-50 p-1">
                <span className="text-emerald-700 block text-[9px]">PATUH</span>
                <strong className="text-emerald-800">{cat.compliantCount}</strong>
              </div>
              <div className="rounded-xs bg-red-50 p-1">
                <span className="text-red-700 block text-[9px]">TIDAK PATUH</span>
                <strong className="text-red-800">{cat.nonCompliantCount}</strong>
              </div>
              <div className="rounded-xs bg-amber-50 p-1">
                <span className="text-amber-700 block text-[9px]">SEMAKAN</span>
                <strong className="text-amber-800">{cat.requiresReviewCount}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Top Non-Compliance Technical Issues Table
 */
export function TopIssuesTable({ topRules }: { topRules: TopNonComplianceRule[] }) {
  if (!topRules || topRules.length === 0) {
    return (
      <Card headerTitle="Top Isu Ketidakpatuhan Perancangan" className="p-6 text-center text-xs text-slate-500">
        Tiada rekod ketidakpatuhan dikesan dalam tempoh ini.
      </Card>
    );
  }

  return (
    <Card headerTitle="Top Isu Ketidakpatuhan Perancangan (Punca Kuasa Mandatori)" className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Kod & Nama Peraturan</th>
              <th className="py-2.5 px-3">Kategori</th>
              <th className="py-2.5 px-3 text-center">Dinilai</th>
              <th className="py-2.5 px-3 text-center">Tidak Patuh</th>
              <th className="py-2.5 px-3 text-right">Kadar Ketidakpatuhan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {topRules.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3">
                  <span className="font-mono text-[11px] font-bold text-gov-800 block">
                    {r.ruleCode}
                  </span>
                  <span className="text-slate-800 font-medium">{r.ruleName}</span>
                </td>
                <td className="py-2.5 px-3 text-slate-600 font-medium">{r.category}</td>
                <td className="py-2.5 px-3 text-center font-mono">{r.timesEvaluated}</td>
                <td className="py-2.5 px-3 text-center font-mono font-bold text-red-700">
                  {r.nonCompliantCount}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="rounded-sm bg-red-50 px-2 py-0.5 font-bold text-red-700 font-mono text-[11px]">
                    {r.nonComplianceRate}%
                  </span>
                  <span className="block text-[9px] text-slate-400 mt-0.5">
                    {r.sampleDenominatorText}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * Issue Ageing Breakdown
 */
export function IssueAgeingChart({ ageing }: { ageing: IssueAgeingBuckets }) {
  const buckets = [
    { label: "0–3 Hari", count: ageing.bucket_0_3_days, color: "bg-emerald-600" },
    { label: "4–7 Hari", count: ageing.bucket_4_7_days, color: "bg-blue-600" },
    { label: "8–14 Hari", count: ageing.bucket_8_14_days, color: "bg-amber-500" },
    { label: "15–30 Hari", count: ageing.bucket_15_30_days, color: "bg-orange-500" },
    { label: "> 30 Hari", count: ageing.bucket_over_30_days, color: "bg-red-600" },
  ];

  const total = ageing.totalOpenIssues || 1;

  return (
    <Card headerTitle="Analisis Usia Isu Belum Selesai (Ageing)" className="space-y-4 p-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
        <span className="text-slate-500">Jumlah Isu Terbuka:</span>
        <strong className="font-mono text-sm text-slate-900">{ageing.totalOpenIssues} Isu</strong>
      </div>

      <div className="space-y-2 text-xs">
        {buckets.map((b, i) => {
          const percent = Number(((b.count / total) * 100).toFixed(1));
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between font-medium text-slate-700">
                <span>{b.label}</span>
                <span className="font-mono font-bold">
                  {b.count} ({percent}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div style={{ width: `${percent}%` }} className={`h-full rounded-full ${b.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-sm bg-slate-50 p-2 text-center text-[11px] text-slate-600 border border-slate-200">
        Median Usia Isu Terbuka: <strong>{ageing.medianAgeDays} Hari</strong>
      </div>
    </Card>
  );
}

/**
 * Officer Workload Table (Non-Punitive Operational Queue Context)
 */
export function OfficerWorkloadTable({ workload }: { workload: OfficerWorkloadItem[] }) {
  if (!workload || workload.length === 0) {
    return (
      <Card headerTitle="Taburan Beban Kerja Operasi Pegawai" className="p-6 text-center text-xs text-slate-500">
        Tiada maklumat pengagihan tugas pegawai.
      </Card>
    );
  }

  return (
    <Card headerTitle="Status Pengagihan & Beban Kerja Semakan OSC" className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Pegawai Perancang / OSC</th>
              <th className="py-2.5 px-3 text-center">Permohonan Diagihkan</th>
              <th className="py-2.5 px-3 text-center">Semakan Menunggu</th>
              <th className="py-2.5 px-3 text-center">Isu Terbuka</th>
              <th className="py-2.5 px-3 text-right">Median Masa Semakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {workload.map((w, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                <td className="py-2.5 px-3 font-semibold text-slate-900">{w.officerName}</td>
                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                  {w.assignedApplicationsCount}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-amber-700 font-bold">
                  {w.pendingReviewCount}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-700">{w.openIssuesCount}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                  {w.medianReviewDurationHours} Jam
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50/80 p-2 text-[10px] text-slate-500 border-t border-slate-100 text-center">
        * Nota: Metrik di atas adalah untuk perancangan kapasiti operasi dan agihan giliran semakan.
      </div>
    </Card>
  );
}

/**
 * Processing Duration by Workflow Stages
 */
export function ProcessingTimeChart({ processingTimes }: { processingTimes: ProcessingTimeMetrics }) {
  const stages = [
    { label: "Penerimaan Permohonan → Semakan Dokumen", duration: `${processingTimes.avgSubmissionToDocCheckHours} Jam` },
    { label: "Semakan Dokumen → Penilaian SmartCheck", duration: `${processingTimes.avgDocCheckToSmartCheckMinutes} Minit` },
    { label: "SmartCheck Selesai → Semakan & Ulasan Pegawai", duration: `${processingTimes.avgSmartCheckToReviewHours} Jam` },
    { label: "Draf Ulasan → Pengesahan Rasmi Ulasan", duration: `${processingTimes.avgReviewToCommentHours} Jam` },
    { label: "Pengesahan Ulasan → Penerbitan Laporan", duration: `${processingTimes.avgCommentToPublicationHours} Jam` },
  ];

  return (
    <Card headerTitle="Purata Tempoh Pemprosesan Mengikut Peringkat Aliran Kerja" className="p-4 space-y-3">
      <div className="space-y-2 text-xs">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-sm border border-slate-100 bg-slate-50/70 p-2.5">
            <span className="font-medium text-slate-700">{s.label}</span>
            <span className="font-mono font-bold text-gov-800">{s.duration}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
        <span>Median Keseluruhan Tempoh Pemprosesan:</span>
        <strong className="font-mono text-sm text-slate-900">
          {processingTimes.medianTotalTurnaroundDays} Hari
        </strong>
      </div>
    </Card>
  );
}

/**
 * Planning Activity & Spatial Mukim Map Summary
 */
export function PlanningActivityMap({ spatial }: { spatial: SpatialPlanningMetric }) {
  return (
    <Card headerTitle="Aktiviti & Taburan Perancangan Mengikut Mukim & Zon RTD" className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Mukim Summary */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gov-800" />
            <span>Taburan Mukim</span>
          </h4>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {spatial.mukimDistribution.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-sm bg-slate-50 p-2 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-900 block">{m.mukim}</span>
                  <span className="text-[10px] text-slate-500">
                    Aktiviti Utama: {m.topDevelopmentType} • Luas: {(m.totalSiteAreaSqm / 10000).toFixed(1)} Ha
                  </span>
                </div>
                <span className="rounded-sm bg-gov-800 px-2 py-0.5 font-bold text-white text-[11px] font-mono">
                  {m.applicationCount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RTD Zoning */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-gov-800" />
            <span>Zon Guna Tanah RTD 2030</span>
          </h4>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {spatial.rtdZoneDistribution.map((z, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-sm bg-slate-50 p-2 border border-slate-100">
                <div>
                  <span className="font-mono text-[10px] font-bold text-gov-800 block">{z.zoneCode}</span>
                  <span className="font-medium text-slate-800 text-[11px]">{z.zoneName}</span>
                </div>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {z.applicationCount} Permohonan
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
        <div className="rounded-sm bg-emerald-50 p-2">
          <span className="text-[10px] text-emerald-700 block">LOKASI DISAHKAN</span>
          <strong className="font-mono text-emerald-900 text-sm">{spatial.verifiedSiteLocationsCount}</strong>
        </div>
        <div className="rounded-sm bg-amber-50 p-2">
          <span className="text-[10px] text-amber-700 block">LOKASI BELUM SAH</span>
          <strong className="font-mono text-amber-900 text-sm">{spatial.unresolvedGisLocationsCount}</strong>
        </div>
        <div className="rounded-sm bg-blue-50 p-2">
          <span className="text-[10px] text-blue-700 block">PELBAGAI LOT</span>
          <strong className="font-mono text-blue-900 text-sm">{spatial.multiLotApplicationsCount}</strong>
        </div>
      </div>
    </Card>
  );
}
