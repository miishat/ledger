import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type VestingPreset = '4yr-1yr-cliff' | '3yr-no-cliff' | 'custom'
export type VestingFrequency = 'monthly' | 'quarterly'
export type TimeMode = 'current-year' | 'next-1-year'

export interface VestingSchedule {
  preset: VestingPreset
  totalVestMonths: number
  cliffMonths: number
  frequency: VestingFrequency
}

export interface RSUGrant {
  id: string
  grantName: string
  grantShares: number
  grantPrice: number
  vestingSchedule: VestingSchedule
  grantStartDate: string
}

export interface PastSalary {
  id: string;
  salary: number;
  changeMonth: number;
}

export interface CompensationPackage {
  id: string
  name: string
  companyTicker?: string
  companyCurrentPrice: number
  baseSalary: number
  pastSalaryChanges: PastSalary[]
  cashBonusPercent: number
  cashBonusMonth: number
  esppContributionPercent: number
  esppDiscountPercent: number
  esppLockedInPrice: number
  esppLockInEndDate?: string
  rrspMatchPercent: number
  rrspMatchCap: number
  rsuGrants: RSUGrant[]
}

export interface VestEvent {
  monthIndex: number
  date?: string
  label: string
  vestValue: number
  cumulativeVested: number
}

export function getBaseSalaryForMonth(pkg: CompensationPackage, year: number, monthIndex: number): number {
  const currentYear = new Date().getFullYear();
  if (year > currentYear) return pkg.baseSalary;
  
  const changes = (pkg.pastSalaryChanges || [])
    .filter(c => c.salary > 0 && c.changeMonth >= 1 && c.changeMonth <= 12)
    .sort((a, b) => a.changeMonth - b.changeMonth);
    
  if (changes.length === 0) return pkg.baseSalary;

  if (year < currentYear) {
    return changes[0].salary;
  }

  // Current year
  for (const change of changes) {
    if (monthIndex < change.changeMonth - 1) {
      return change.salary;
    }
  }
  
  return pkg.baseSalary;
}

export function calcAnnualBaseSalary(pkg: CompensationPackage, timeMode: TimeMode = 'current-year'): number {
  if (timeMode === 'next-1-year') {
    return pkg.baseSalary;
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  
  let totalBase = 0;
  for (let i = 0; i < 12; i++) {
    totalBase += getBaseSalaryForMonth(pkg, currentYear, i) / 12;
  }
  return totalBase;
}

export function calcAnnualBonus(pkg: CompensationPackage, timeMode: TimeMode = 'current-year'): number {
  return calcAnnualBaseSalary(pkg, timeMode) * (pkg.cashBonusPercent / 100)
}

export function calcAnnualESPP(pkg: CompensationPackage, timeMode: TimeMode = 'current-year'): number {
  const companyCurrentPrice = pkg.companyCurrentPrice || 0;
  const esppLockedInPrice = pkg.esppLockedInPrice || 0;

  if (pkg.esppContributionPercent === 0 || companyCurrentPrice === 0) return 0;
  const contributionAmount = calcAnnualBaseSalary(pkg, timeMode) * (pkg.esppContributionPercent / 100);
  
  const today = new Date();
  const isLockInActive = esppLockedInPrice > 0 && (!pkg.esppLockInEndDate || new Date(pkg.esppLockInEndDate) >= today);

  const purchasePrice = isLockInActive
    ? esppLockedInPrice
    : companyCurrentPrice * (1 - (pkg.esppDiscountPercent / 100));

  if (purchasePrice <= 0) return 0;
  const sharesBought = contributionAmount / purchasePrice;
  const currentValue = sharesBought * companyCurrentPrice;
  return Math.max(0, currentValue - contributionAmount);
}

export function calcAnnualRRSP(pkg: CompensationPackage, timeMode: TimeMode = 'current-year'): number {
  return Math.min(calcAnnualBaseSalary(pkg, timeMode) * (pkg.rrspMatchPercent / 100), pkg.rrspMatchCap)
}

export function calcAnnualRSU(pkg: CompensationPackage, timeMode: TimeMode = 'current-year'): number {
  const companyCurrentPrice = pkg.companyCurrentPrice || 0;
  const today = new Date();
  
  return pkg.rsuGrants.reduce((total, grant) => {
    const events = generateVestEvents(grant, companyCurrentPrice)
    
    const filteredEvents = events.filter((e) => {
      if (!e.date) return e.monthIndex <= 12; // Fallback if date is missing
      
      const eventDate = new Date(e.date);
      if (timeMode === 'current-year') {
        return eventDate.getFullYear() === today.getFullYear();
      } else {
        const nextYear = new Date(today);
        nextYear.setFullYear(today.getFullYear() + 1);
        return eventDate >= today && eventDate <= nextYear;
      }
    });
    
    return total + filteredEvents.reduce((sum, e) => sum + e.vestValue, 0)
  }, 0)
}

export function calcTotalComp(pkg: CompensationPackage, timeMode: TimeMode = 'current-year'): number {
  return (
    calcAnnualBaseSalary(pkg, timeMode) +
    calcAnnualBonus(pkg, timeMode) +
    calcAnnualESPP(pkg, timeMode) +
    calcAnnualRRSP(pkg, timeMode) +
    calcAnnualRSU(pkg, timeMode)
  )
}

export function generateVestEvents(grant: RSUGrant, currentPrice: number): VestEvent[] {
  const { grantShares, vestingSchedule: sched, grantStartDate } = grant
  const { totalVestMonths, cliffMonths, frequency } = sched

  const totalShares = grantShares || 0;
  const safeCurrentPrice = currentPrice || 0;
  
  const startDate = grantStartDate ? new Date(grantStartDate) : new Date();

  const freqMonths = frequency === 'quarterly' ? 3 : 1
  const events: VestEvent[] = []
  let cumulativeShares = 0

  if (cliffMonths > 0) {
    const cliffPct = cliffMonths / totalVestMonths
    const cliffShares = totalShares * cliffPct
    cumulativeShares += cliffShares
    
    const eventDate = new Date(startDate);
    eventDate.setMonth(startDate.getMonth() + cliffMonths);
    
    events.push({
      monthIndex: cliffMonths,
      date: eventDate.toISOString(),
      label: `Month ${cliffMonths} (Cliff)`,
      vestValue: cliffShares * safeCurrentPrice,
      cumulativeVested: cumulativeShares * safeCurrentPrice,
    })
  }

  const postCliffMonths = totalVestMonths - cliffMonths
  const postCliffShares =
    cliffMonths > 0
      ? totalShares * ((totalVestMonths - cliffMonths) / totalVestMonths)
      : totalShares
  const vestCountPostCliff = Math.floor(postCliffMonths / freqMonths)
  const perEventShares = vestCountPostCliff > 0 ? postCliffShares / vestCountPostCliff : 0

  for (let m = cliffMonths + freqMonths; m <= totalVestMonths; m += freqMonths) {
    cumulativeShares += perEventShares
    
    const eventDate = new Date(startDate);
    eventDate.setMonth(startDate.getMonth() + m);
    
    events.push({
      monthIndex: m,
      date: eventDate.toISOString(),
      label: `Month ${m}`,
      vestValue: perEventShares * safeCurrentPrice,
      cumulativeVested: cumulativeShares * safeCurrentPrice,
    })
  }

  return events
}

interface CompensationState {
  primaryPackage: CompensationPackage
  comparePackage: CompensationPackage | null
  compareMode: boolean
  timeMode: TimeMode
  useCadConversion: boolean

  setPrimaryPackage: (updates: Partial<CompensationPackage>) => void
  setComparePackage: (pkg: CompensationPackage | null) => void
  toggleCompareMode: () => void
  setTimeMode: (mode: TimeMode) => void
  addRSUGrant: (grant: RSUGrant) => void
  removeRSUGrant: (id: string) => void
  updateRSUGrant: (id: string, updates: Partial<RSUGrant>) => void
  toggleCadConversion: () => void
}

const defaultPrimaryPackage: CompensationPackage = {
  id: 'primary',
  name: 'Current Offer',
  companyCurrentPrice: 100,
  baseSalary: 0,
  pastSalaryChanges: [],
  cashBonusPercent: 0,
  cashBonusMonth: 12,
  esppContributionPercent: 0,
  esppDiscountPercent: 15,
  esppLockedInPrice: 100,
  rrspMatchPercent: 0,
  rrspMatchCap: 0,
  rsuGrants: [],
}

export const useCompensationStore = create<CompensationState>()(
  persist(
    (set) => ({
      primaryPackage: defaultPrimaryPackage,
      comparePackage: null,
      compareMode: false,
      timeMode: 'current-year',
      useCadConversion: false,

      setPrimaryPackage: (updates) =>
        set((state) => ({
          primaryPackage: { ...state.primaryPackage, ...updates },
        })),
      setComparePackage: (pkg) => set({ comparePackage: pkg }),
      toggleCompareMode: () => set((state) => ({ compareMode: !state.compareMode })),
      setTimeMode: (mode) => set({ timeMode: mode }),
      toggleCadConversion: () => set((state) => ({ useCadConversion: !state.useCadConversion })),
      addRSUGrant: (grant) =>
        set((state) => ({
          primaryPackage: {
            ...state.primaryPackage,
            rsuGrants: [...state.primaryPackage.rsuGrants, grant],
          },
        })),
      removeRSUGrant: (id) =>
        set((state) => ({
          primaryPackage: {
            ...state.primaryPackage,
            rsuGrants: state.primaryPackage.rsuGrants.filter((g) => g.id !== id),
          },
        })),
      updateRSUGrant: (id, updates) =>
        set((state) => ({
          primaryPackage: {
            ...state.primaryPackage,
            rsuGrants: state.primaryPackage.rsuGrants.map((g) =>
              g.id === id ? { ...g, ...updates } : g
            ),
          },
        })),
    }),
    {
      name: 'ledger-compensation',
    }
  )
)
