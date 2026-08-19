import React from "react";
import { ApplicantInfo, ConsultantInfo, ApplicantType } from "@/types/application";

interface Section2Props {
  applicantInfo: Partial<ApplicantInfo>;
  consultantInfo: Partial<ConsultantInfo>;
  onChangeApplicant: (fields: Partial<ApplicantInfo>) => void;
  onChangeConsultant: (fields: Partial<ConsultantInfo>) => void;
  disabled?: boolean;
}

export function Section2ApplicantInfo({
  applicantInfo,
  consultantInfo,
  onChangeApplicant,
  onChangeConsultant,
  disabled = false,
}: Section2Props) {
  return (
    <div className="space-y-6">
      {/* 2A. Maklumat Pemohon / Pemaju */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-sm font-bold text-slate-800">2A. Maklumat Pemohon / Pemaju</h3>
          <p className="text-xs text-slate-500">
            Maklumat pemilik tanah atau entiti berdaftar yang mengemukakan permohonan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Jenis Pemohon <span className="text-red-500">*</span>
            </label>
            <select
              value={applicantInfo.applicantType || "COMPANY"}
              disabled={disabled}
              onChange={(e) => onChangeApplicant({ applicantType: e.target.value as ApplicantType })}
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            >
              <option value="COMPANY">Syarikat / Pemaju Berhad</option>
              <option value="INDIVIDUAL">Individu / Pemilik Tunggal</option>
              <option value="CONSULTANT">Firma Perunding Perancang / Arkitek</option>
              <option value="GOVERNMENT_AGENCY">Agensi Kerajaan / Badan Berkanun</option>
              <option value="OTHER">Lain-Lain</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Nama Penuh Pemohon / Wakil <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={applicantInfo.applicantName || ""}
              disabled={disabled}
              onChange={(e) => onChangeApplicant({ applicantName: e.target.value })}
              placeholder="Contoh: Ir. Ahmad bin Razak"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          {applicantInfo.applicantType === "COMPANY" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Nama Syarikat / Firma
                </label>
                <input
                  type="text"
                  value={applicantInfo.companyName || ""}
                  disabled={disabled}
                  onChange={(e) => onChangeApplicant({ companyName: e.target.value })}
                  placeholder="Contoh: Langkawi Gateway Development Sdn Bhd"
                  className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  No. Pendaftaran Syarikat (SSM)
                </label>
                <input
                  type="text"
                  value={applicantInfo.registrationNumber || ""}
                  disabled={disabled}
                  onChange={(e) => onChangeApplicant({ registrationNumber: e.target.value })}
                  placeholder="Contoh: 202101009988 (1412233-X)"
                  className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Alamat Emel Rasmi <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={applicantInfo.email || ""}
              disabled={disabled}
              onChange={(e) => onChangeApplicant({ email: e.target.value })}
              placeholder="pemohon@syarikat.com.my"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Nombor Telefon Bimbit / Pejabat <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={applicantInfo.phone || ""}
              disabled={disabled}
              onChange={(e) => onChangeApplicant({ phone: e.target.value })}
              placeholder="012-3456789 atau 04-9661234"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">
              Alamat Surat-Menyurat
            </label>
            <textarea
              rows={2}
              value={applicantInfo.address || ""}
              disabled={disabled}
              onChange={(e) => onChangeApplicant({ address: e.target.value })}
              placeholder="No. 12, Jalan Pandak Mayah 5, Pusat Bandar Kuah, 07000 Langkawi, Kedah"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>
        </div>
      </div>

      {/* 2B. Maklumat Orang Utama Yang Mengemukakan (PSP / Perunding) */}
      <div className="space-y-4 rounded-sm border border-slate-200 bg-slate-50 p-4">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            2B. Maklumat Orang Utama Yang Mengemukakan (PSP / Perunding Perancang)
          </h3>
          <p className="text-[11px] text-slate-500">
            Sekiranya permohonan dikemukakan oleh Arkitek / Perancang Bandar Bertauliah (Pilihan semasa draf).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Nama PSP / Arkitek / Perancang
            </label>
            <input
              type="text"
              value={consultantInfo.principalSubmittingPerson || ""}
              disabled={disabled}
              onChange={(e) => onChangeConsultant({ principalSubmittingPerson: e.target.value })}
              placeholder="Contoh: Ar. Mohd Fazil bin Hashim"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Firma Perunding
            </label>
            <input
              type="text"
              value={consultantInfo.consultantCompany || ""}
              disabled={disabled}
              onChange={(e) => onChangeConsultant({ consultantCompany: e.target.value })}
              placeholder="Contoh: Fazil Architect & Planning Associates"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              No. Pendaftaran Lembaga (LAM / LPBM)
            </label>
            <input
              type="text"
              value={consultantInfo.professionalRegistrationNo || ""}
              disabled={disabled}
              onChange={(e) => onChangeConsultant({ professionalRegistrationNo: e.target.value })}
              placeholder="Contoh: A/F 1422"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Emel Perunding
            </label>
            <input
              type="email"
              value={consultantInfo.email || ""}
              disabled={disabled}
              onChange={(e) => onChangeConsultant({ email: e.target.value })}
              placeholder="arkitek@perunding.com"
              className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-gov-700 focus:outline-none focus:ring-1 focus:ring-gov-700 disabled:bg-slate-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
