import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type VestingPreset = '4yr-1yr-cliff' | '3yr-no-cliff' | 'custom'
export type VestingFrequency = 'monthly' | 'quarterly'

export interface VestingSchedule {
  preset: VestingPreset
  totalVestMonths: number
  cliffMonths: number
  frequency: VestingFrequency
}

export interface RSUGrant {
  id: string
  grantName: string
  totalGrantValue: number
  vestingSchedule: VestingSchedule
  grantStartDate: string
}

export interface CompensationPackage {
  id: string
  name: string
  baseSalary: number
  cashBonusPercent: number
  esppContributionPercent: number
  esppDiscountPercent: number
  rrspMatchPercent: number
  rrspMatchCap: number
  rsuGrants: RSUGrant[]
}

export interface VestEvent {
  monthIndex: number
  label: string
  vestValue: number
  cumulativeVested: number
}

export function calcAnnualBonus(pkg: CompensationPackage): number {
  return pkg.baseSalary * (pkg.cashBonusPercent / 100)
}

export function calcAnnualESPP(pkg: CompensationPackage): number {
  const contribution = pkg.baseSalary * (pkg.esppContributionPercent / 100)
  return contribution * (pkg.esppDiscountPercent / 100)
}

export function calcAnnualRRSP(pkg: CompensationPackage): number {
  return Math.min(pkg.baseSalary * (pkg.rrspMatchPercent / 100), pkg.rrspMatchCap)
}

export function calcAnnualRSU(pkg: CompensationPackage): number {
  return pkg.rsuGrants.reduce((total, grant) => {
    const events = generateVestEvents(grant)
    const firstYearVests = events.filter((e) => e.monthIndex <= 12)
    return total + firstYearVests.reduce((sum, e) => sum + e.vestValue, 0)
  }, 0)
}

export function calcTotalComp(pkg: CompensationPackage): number {
  return (
    pkg.baseSalary +
    calcAnnualBonus(pkg) +
    calcAnnualESPP(pkg) +
    calcAnnualRRSP(pkg) +
    calcAnnualRSU(pkg)
  )
}

export function generateVestEvents(grant: RSUGrant): VestEvent[] {
  const { totalGrantValue, vestingSchedule: sched } = grant
  const { totalVestMonths, cliffMonths, frequency } = sched

  const freqMonths = frequency === 'quarterly' ? 3 : 1
  const events: VestEvent[] = []
  let cumulative = 0

  if (cliffMonths > 0) {
    const cliffPct = cliffMonths / totalVestMonths
    const cliffValue = totalGrantValue * cliffPct
    cumulative += cliffValue
    events.push({
      monthIndex: cliffMonths,
      label: `Month ${cliffMonths} (Cliff)`,
      vestValue: cliffValue,
      cumulativeVested: cumulative,
    })
  }

  const postCliffMonths = totalVestMonths - cliffMonths
  const postCliffValue =
    cliffMonths > 0
      ? totalGrantValue * ((totalVestMonths - cliffMonths) / totalVestMonths)
      : totalGrantValue
  const vestCountPostCliff = Math.floor(postCliffMonths / freqMonths)
  const perEventValue = vestCountPostCliff > 0 ? postCliffValue / vestCountPostCliff : 0

  for (let m = cliffMonths + freqMonths; m <= totalVestMonths; m += freqMonths) {
    cumulative += perEventValue
    events.push({
      monthIndex: m,
      label: `Month ${m}`,
      vestValue: perEventValue,
      cumulativeVested: cumulative,
    })
  }

  return events
}

interface CompensationState {
  primaryPackage: CompensationPackage
  comparePackage: CompensationPackage | null
  compareMode: boolean

  setPrimaryPackage: (updates: Partial<CompensationPackage>) => void
  setComparePackage: (pkg: CompensationPackage | null) => void
  toggleCompareMode: () => void
  addRSUGrant: (grant: RSUGrant) => void
  removeRSUGrant: (id: string) => void
  updateRSUGrant: (id: string, updates: Partial<RSUGrant>) => void
}

const defaultPrimaryPackage: CompensationPackage = {
  id: 'primary',
  name: 'Current Offer',
  baseSalary: 0,
  cashBonusPercent: 0,
  esppContributionPercent: 0,
  esppDiscountPercent: 15,
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

      setPrimaryPackage: (updates) =>
        set((state) => ({
          primaryPackage: { ...state.primaryPackage, ...updates },
        })),
      setComparePackage: (pkg) => set({ comparePackage: pkg }),
      toggleCompareMode: () => set((state) => ({ compareMode: !state.compareMode })),
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
