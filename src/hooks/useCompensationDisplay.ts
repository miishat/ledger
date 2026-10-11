import { useCallback, useMemo } from 'react'
import { useCompensationStore } from '../store/useCompensationStore'
import { convertPackageToCad } from '../store/compensationFx'
import { useCurrentPrice, useFxRate } from '../services/marketData'
import type { FetchStatus } from '../services/marketData'
import { usePlannerStore } from '../store/usePlannerStore'
import { resolveCompensationOffers } from '../utils/finance/compensationRetirement'

export function useCompensationDisplay() {
  const primaryPackage = useCompensationStore((s) => s.primaryPackage)
  const useCadConversion = useCompensationStore((s) => s.useCadConversion)
  const rawComparePkg = useCompensationStore((s) => s.comparePackage)
  const timeMode = useCompensationStore((s) => s.timeMode)
  const includePersonalDeductions = useCompensationStore((s) => s.includePersonalDeductions)
  const profile = usePlannerStore((s) => s.sharedTaxProfile)
  const personalScenario = usePlannerStore((s) => s.salaryRetirementScenario)
  const personalInputs = usePlannerStore((s) => s.inputs['salary-tax'])

  const ticker = primaryPackage.companyTicker?.trim() ?? ''
  const price = useCurrentPrice(ticker)
  const fx = useFxRate('USD', 'CAD')

  // Live/override/cached USD price when a ticker is set; otherwise fall back
  // to the manually-entered companyCurrentPrice already stored on the package.
  const rawPrice = price.data?.value.price ?? primaryPackage.companyCurrentPrice
  const fxAvailable = typeof fx.data?.value.rate === 'number' && Number.isFinite(fx.data.value.rate) && fx.data.value.rate > 0
  const fxRate = fx.data?.value.rate ?? 1

  const basePkg = useMemo(
    () => ({ ...primaryPackage, companyCurrentPrice: rawPrice }),
    [primaryPackage, rawPrice],
  )

  // CAD conversion only engages when a real rate exists; otherwise the
  // package stays in USD and the UI says the rate is unavailable.
  const pkg = useMemo(
    () => convertPackageToCad(basePkg, fxRate, useCadConversion && fxAvailable),
    [basePkg, fxRate, useCadConversion, fxAvailable],
  )
  const retirementOptions = useMemo(() => ({ timeMode, fx: { stockCurrency: 'USD' as const, cadPerStockUnit: fxAvailable ? fxRate : null }, profile,
    personalRrsp: personalScenario?.personalRrsp ?? Number(personalInputs?.rrsp ?? 0),
    personalFhsa: personalScenario?.personalFhsa ?? Number(personalInputs?.fhsa ?? 0), includePersonalDeductions }),
  [timeMode, fxAvailable, fxRate, profile, personalScenario, personalInputs, includePersonalDeductions])
  const retirement = useMemo(() => resolveCompensationOffers(basePkg, rawComparePkg, retirementOptions), [basePkg, rawComparePkg, retirementOptions])

  const refreshPrice = useCallback((force?: boolean) => price.refresh(force), [price])
  const setManualPrice = useCallback((value: number) => price.setManual(value), [price])
  const clearManualPrice = useCallback(() => price.clearManual(), [price])

  return {
    pkg,
    rawPkg: basePkg,
    rawComparePkg,
    retirementOptions,
    retirement,
    rawPrice,
    fxRate,
    fxStatus: fx.status as FetchStatus,
    fxAvailable,
    fxDate: fx.data?.value.date,
    fxSource: fx.data?.source,
    fxStale: fx.data?.stale ?? false,
    refreshFx: fx.refresh,
    priceStatus: price.status as FetchStatus,
    priceSource: price.data?.source,
    priceStale: price.data?.stale ?? false,
    refreshPrice,
    setManualPrice,
    clearManualPrice,
  }
}
