// 2026 Canadian personal income tax estimator - employee side only.
//
// Sources (retrieved 2026-07-02):
// - Brackets (federal + all provinces/territories, ON surtax): KPMG
//   "Federal and Provincial/Territorial Income Tax Rates and Brackets for 2026"
//   (current as of 2025-12-31). BC lowest rate updated to 5.6% per BC Budget
//   2026 (TaxTips.ca). Federal lowest rate is 14% for 2026.
// - BPAs: TaxTips.ca 2026 non-refundable credits; QC BPA $18,952 from
//   Finances Québec "Parameters of the Personal Income Tax System for 2026".
// - CPP/CPP2/EI 2026: CRA release - YMPE $74,600, YAMPE $85,000, rates
//   5.95%/4.00%; EI 1.63% (QC 1.30%) on max insurable earnings $68,900.
//
// Simplifications (this is an estimator, not payroll): only the basic
// personal amount credit is modelled; Quebec uses the 16.5% federal
// abatement and approximates QPP/QPIP with CPP + the QC EI rate; no
// Ontario Health Premium or QC Health Services Fund.

export type Province =
  | 'BC' | 'AB' | 'SK' | 'MB' | 'ON' | 'QC' | 'NB'
  | 'NS' | 'PE' | 'NL' | 'YT' | 'NT' | 'NU'

export interface Bracket {
  upTo: number // upper bound of the bracket; Infinity for the top bracket
  rate: number // decimal, e.g. 0.14
}

export const FEDERAL_BRACKETS: Bracket[] = [
  { upTo: 58_523, rate: 0.14 },
  { upTo: 117_045, rate: 0.205 },
  { upTo: 181_440, rate: 0.26 },
  { upTo: 258_482, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 },
]

// Federal BPA phases from the max down to the min across the 29% bracket.
const FEDERAL_BPA_MAX = 16_452
const FEDERAL_BPA_MIN = 14_829 // 2025 floor 14,538 × 1.02 indexation
const QC_ABATEMENT = 0.165

export const PROVINCIAL_TAX: Record<Province, { name: string; brackets: Bracket[]; bpa: number }> = {
  BC: {
    name: 'British Columbia',
    bpa: 13_216,
    brackets: [
      { upTo: 50_363, rate: 0.056 }, // 5.6% per BC Budget 2026 (was 5.06%)
      { upTo: 100_728, rate: 0.077 },
      { upTo: 115_648, rate: 0.105 },
      { upTo: 140_430, rate: 0.1229 },
      { upTo: 190_405, rate: 0.147 },
      { upTo: 265_545, rate: 0.168 },
      { upTo: Infinity, rate: 0.205 },
    ],
  },
  AB: {
    name: 'Alberta',
    bpa: 22_769,
    brackets: [
      { upTo: 61_200, rate: 0.08 },
      { upTo: 154_259, rate: 0.1 },
      { upTo: 185_111, rate: 0.12 },
      { upTo: 246_813, rate: 0.13 },
      { upTo: 370_220, rate: 0.14 },
      { upTo: Infinity, rate: 0.15 },
    ],
  },
  SK: {
    name: 'Saskatchewan',
    bpa: 20_381,
    brackets: [
      { upTo: 54_532, rate: 0.105 },
      { upTo: 155_805, rate: 0.125 },
      { upTo: Infinity, rate: 0.145 },
    ],
  },
  MB: {
    name: 'Manitoba',
    bpa: 15_780,
    brackets: [
      { upTo: 47_000, rate: 0.108 },
      { upTo: 100_000, rate: 0.1275 },
      { upTo: Infinity, rate: 0.174 },
    ],
  },
  ON: {
    name: 'Ontario',
    bpa: 12_989,
    brackets: [
      { upTo: 53_891, rate: 0.0505 },
      { upTo: 107_785, rate: 0.0915 },
      { upTo: 150_000, rate: 0.1116 },
      { upTo: 220_000, rate: 0.1216 },
      { upTo: Infinity, rate: 0.1316 },
    ],
  },
  QC: {
    name: 'Quebec',
    bpa: 18_952,
    brackets: [
      { upTo: 54_345, rate: 0.14 },
      { upTo: 108_680, rate: 0.19 },
      { upTo: 132_245, rate: 0.24 },
      { upTo: Infinity, rate: 0.2575 },
    ],
  },
  NB: {
    name: 'New Brunswick',
    bpa: 13_664,
    brackets: [
      { upTo: 52_333, rate: 0.094 },
      { upTo: 104_666, rate: 0.14 },
      { upTo: 193_861, rate: 0.16 },
      { upTo: Infinity, rate: 0.195 },
    ],
  },
  NS: {
    name: 'Nova Scotia',
    bpa: 11_932,
    brackets: [
      { upTo: 30_995, rate: 0.0879 },
      { upTo: 61_991, rate: 0.1495 },
      { upTo: 97_417, rate: 0.1667 },
      { upTo: 157_124, rate: 0.175 },
      { upTo: Infinity, rate: 0.21 },
    ],
  },
  PE: {
    name: 'Prince Edward Island',
    bpa: 15_000,
    brackets: [
      { upTo: 33_928, rate: 0.095 },
      { upTo: 65_820, rate: 0.1347 },
      { upTo: 106_890, rate: 0.166 },
      { upTo: 142_250, rate: 0.1762 },
      { upTo: Infinity, rate: 0.19 },
    ],
  },
  NL: {
    name: 'Newfoundland and Labrador',
    bpa: 11_188,
    brackets: [
      { upTo: 44_678, rate: 0.087 },
      { upTo: 89_354, rate: 0.145 },
      { upTo: 159_528, rate: 0.158 },
      { upTo: 223_340, rate: 0.178 },
      { upTo: 285_319, rate: 0.198 },
      { upTo: 570_638, rate: 0.208 },
      { upTo: 1_141_275, rate: 0.213 },
      { upTo: Infinity, rate: 0.218 },
    ],
  },
  YT: {
    name: 'Yukon',
    bpa: 16_452,
    brackets: [
      { upTo: 58_523, rate: 0.064 },
      { upTo: 117_045, rate: 0.09 },
      { upTo: 181_440, rate: 0.109 },
      { upTo: 500_000, rate: 0.128 },
      { upTo: Infinity, rate: 0.15 },
    ],
  },
  NT: {
    name: 'Northwest Territories',
    bpa: 18_198,
    brackets: [
      { upTo: 53_003, rate: 0.059 },
      { upTo: 106_009, rate: 0.086 },
      { upTo: 172_346, rate: 0.122 },
      { upTo: Infinity, rate: 0.1405 },
    ],
  },
  NU: {
    name: 'Nunavut',
    bpa: 19_659,
    brackets: [
      { upTo: 55_801, rate: 0.04 },
      { upTo: 111_602, rate: 0.07 },
      { upTo: 181_439, rate: 0.09 },
      { upTo: Infinity, rate: 0.115 },
    ],
  },
}

export const PROVINCES: { code: Province; name: string }[] = (
  Object.entries(PROVINCIAL_TAX) as [Province, { name: string }][]
).map(([code, v]) => ({ code, name: v.name }))

// 2026 CPP / EI parameters
const CPP_RATE = 0.0595
const CPP_EXEMPTION = 3_500
const YMPE = 74_600
const CPP2_RATE = 0.04
const YAMPE = 85_000
const EI_RATE = 0.0163
const EI_RATE_QC = 0.013
const EI_MAX_INSURABLE = 68_900

function bracketTax(income: number, brackets: Bracket[]): number {
  let tax = 0
  let lower = 0
  for (const b of brackets) {
    if (income <= lower) break
    tax += (Math.min(income, b.upTo) - lower) * b.rate
    lower = b.upTo
  }
  return tax
}

function federalBpa(income: number): number {
  const phaseStart = 181_440 // 29% bracket start
  const phaseEnd = 258_482 // 33% bracket start
  if (income <= phaseStart) return FEDERAL_BPA_MAX
  if (income >= phaseEnd) return FEDERAL_BPA_MIN
  const f = (income - phaseStart) / (phaseEnd - phaseStart)
  return FEDERAL_BPA_MAX - f * (FEDERAL_BPA_MAX - FEDERAL_BPA_MIN)
}

export function federalTax(income: number, province: Province): number {
  const gross = bracketTax(income, FEDERAL_BRACKETS)
  const credit = federalBpa(income) * FEDERAL_BRACKETS[0].rate
  const net = Math.max(0, gross - credit)
  return province === 'QC' ? net * (1 - QC_ABATEMENT) : net
}

/** Provincial tax split into the statutory bracket tax and the ON surtax.
 *  base + surtax === provincialTax(income, province). */
export function provincialTaxParts(
  income: number,
  province: Province,
): { base: number; surtax: number } {
  const { brackets, bpa } = PROVINCIAL_TAX[province]
  const gross = bracketTax(income, brackets)
  const credit = bpa * brackets[0].rate
  const base = Math.max(0, gross - credit)
  // Ontario surtax: 20% of ON tax over $5,818 plus 36% of ON tax over $7,446.
  const surtax =
    province === 'ON' ? Math.max(0, base - 5_818) * 0.2 + Math.max(0, base - 7_446) * 0.36 : 0
  return { base, surtax }
}

export function provincialTax(income: number, province: Province): number {
  const { base, surtax } = provincialTaxParts(income, province)
  return base + surtax
}

export function cppContribution(income: number): number {
  const base = Math.max(0, Math.min(income, YMPE) - CPP_EXEMPTION) * CPP_RATE
  const second = Math.max(0, Math.min(income, YAMPE) - YMPE) * CPP2_RATE
  return base + second
}

export function eiPremium(income: number, province: Province): number {
  const rate = province === 'QC' ? EI_RATE_QC : EI_RATE
  return Math.min(income, EI_MAX_INSURABLE) * rate
}

export function totalIncomeTax(income: number, province: Province): number {
  return federalTax(income, province) + provincialTax(income, province)
}

export function marginalRate(income: number, province: Province): number {
  const delta = 100
  return ((totalIncomeTax(income + delta, province) - totalIncomeTax(income, province)) / delta) * 100
}

export interface MarginalBreakdown {
  federal: number // percentage points, e.g. 29.29
  provincialBase: number
  surtax: number
  total: number // === federal + provincialBase + surtax === marginalRate()
}

/** Decomposes the marginal rate into federal, provincial-bracket, and ON-surtax
 *  components via the same $100 finite difference marginalRate() uses, so the
 *  parts always sum to the headline number (including BPA phase-out effects). */
export function marginalRateBreakdown(income: number, province: Province): MarginalBreakdown {
  const delta = 100
  const fed = ((federalTax(income + delta, province) - federalTax(income, province)) / delta) * 100
  const p0 = provincialTaxParts(income, province)
  const p1 = provincialTaxParts(income + delta, province)
  const provincialBase = ((p1.base - p0.base) / delta) * 100
  const surtax = ((p1.surtax - p0.surtax) / delta) * 100
  return { federal: fed, provincialBase, surtax, total: fed + provincialBase + surtax }
}

export function effectiveRate(income: number, province: Province): number {
  if (income <= 0) return 0
  return (totalIncomeTax(income, province) / income) * 100
}

export interface TakeHome {
  gross: number
  federal: number
  provincial: number
  cpp: number
  ei: number
  net: number
}

export function takeHomePay(gross: number, province: Province): TakeHome {
  const federal = federalTax(gross, province)
  const provincial = provincialTax(gross, province)
  const cpp = cppContribution(gross)
  const ei = eiPremium(gross, province)
  return { gross, federal, provincial, cpp, ei, net: gross - federal - provincial - cpp - ei }
}

export interface TakeHomeWithDeductions extends TakeHome {
  taxableIncome: number
  taxSavings: number
}

/** Take-home with RRSP/FHSA deductions: income tax on (gross - contributions),
 *  CPP/EI still on gross. taxSavings = tax(gross) - tax(taxable). */
export function takeHomeWithDeductions(
  gross: number,
  province: Province,
  rrsp: number,
  fhsa: number,
): TakeHomeWithDeductions {
  const taxableIncome = Math.max(0, gross - Math.max(0, rrsp) - Math.max(0, fhsa))
  const federal = federalTax(taxableIncome, province)
  const provincial = provincialTax(taxableIncome, province)
  const cpp = cppContribution(gross)
  const ei = eiPremium(gross, province)
  const taxSavings = totalIncomeTax(gross, province) - totalIncomeTax(taxableIncome, province)
  const net = gross - federal - provincial - cpp - ei
  return { gross, federal, provincial, cpp, ei, net, taxableIncome, taxSavings }
}
