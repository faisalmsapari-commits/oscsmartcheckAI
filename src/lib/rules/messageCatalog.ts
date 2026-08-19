export const RULE_MESSAGE_TEMPLATES: Record<string, string> = {
  MISSING_INPUT_FACT: "Maklumat perancangan wajib ({key}) tidak ditemui dalam dokumen LCP atau data tapak.",
  INPUT_FACT_CONFLICT: "Terdapat percanggahan atau ketidakpastian nilai ({key}) yang memerlukan semakan pegawai.",
  THRESHOLD_SATISFIED: "Nilai projek ({actual} {unit}) mematuhi piawaian yang ditetapkan ({required} {unit}).",
  BELOW_MINIMUM_THRESHOLD: "Nilai projek ({actual} {unit}) adalah kurang {difference} {unit} daripada had minimum yang ditetapkan ({required} {unit}).",
  EXCEEDS_MAXIMUM_THRESHOLD: "Nilai projek ({actual} {unit}) melebihi had maksimum yang dibenarkan ({required} {unit}) sebanyak {difference} {unit}.",
  RANGE_SATISFIED: "Nilai projek ({actual} {unit}) berada dalam julat yang dibenarkan.",
  OUTSIDE_RANGE: "Nilai projek ({actual} {unit}) berada di luar julat yang dibenarkan.",
  RATIO_SATISFIED: "Nisbah plot cadangan mematuhi had kawalan pembangunan zon berkenaan.",
  RATIO_EXCEEDED: "Nisbah plot cadangan melebihi had kawalan pembangunan zon berkenaan.",
  FORMULA_REQUIREMENT_SATISFIED: "Penyediaan komponen projek mematuhi kiraan formula piawaian garis panduan.",
  FORMULA_REQUIREMENT_FAILED: "Penyediaan komponen projek tidak mencukupi berbanding kiraan formula piawaian garis panduan.",
  RTD_ZONE_ALLOWED: "Cadangan aktiviti {devType} adalah DIBENARKAN di bawah Zon RTD {zone} ({percent}% pertindihan tapak).",
  RTD_ZONE_CONDITIONAL: "Cadangan aktiviti {devType} adalah BERSYARAT di bawah Zon RTD {zone} dan memerlukan semakan jawatankuasa.",
  RTD_ZONE_PROHIBITED: "Cadangan aktiviti {devType} adalah TIDAK DIBENARKAN di bawah Zon RTD {zone}.",
  RTD_ZONE_REVIEW_REQUIRED: "Semakan pegawai perancang diperlukan bagi pengezonan tanah tapak.",
};

export function formatRuleMessage(code: string, params: Record<string, unknown> = {}): string {
  let template = RULE_MESSAGE_TEMPLATES[code] || "Semakan peraturan selesai.";
  for (const [key, val] of Object.entries(params)) {
    template = template.replaceAll(`{${key}}`, String(val));
  }
  return template;
}
