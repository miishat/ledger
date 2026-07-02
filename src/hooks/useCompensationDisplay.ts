import { useCallback, useMemo } from 'react'
import { useCompensationStore } from '../store/useCompensationStore'
import { convertPackageToCad } from '../store/compensationFx'
import { useCurrentPrice, useFxRate } from '../services/marketData'
import type { FetchStatus } from '../services/marketData'

export function useCompensationDisplay() {
  const primaryPackage = useCompensationStore((s) => s.primaryPackage)
  const useCadConversion = useCompensationStore((s) => s.useCadConversion)

  const ticker = primaryPackage.companyTicker?.trim() ?? ''
  const price = useCurrentPrice(ticker)
  const fx = useFxRate('USD', 'CAD')

  // Live/override/cached USD price when a ticker is set; otherwise fall back
  // to the manually-entered companyCurrentPrice already stored on the package.
  const rawPrice = price.data?.value.price ?? primaryPackage.companyCurrentPrice
  const fxRate = fx.data?.value.rate ?? 1

  // Use rawPrice only if conversion is enabled; otherwise use store price
  const displayPrice = useCadConversion ? rawPrice : primaryPackage.companyCurrentPrice

  const basePkg = useMemo(
    () => ({ ...primaryPackage, companyCurrentPrice: displayPrice }),
    [primaryPackage, displayPrice],
  )

  const pkg = useMemo(
    () => convertPackageToCad(basePkg, fxRate, useCadConversion),
    [basePkg, fxRate, useCadConversion],
  )

  const refreshPrice = useCallback((force?: boolean) => price.refresh(force), [price])
  const setManualPrice = useCallback((value: number) => price.setManual(value), [price])
  const clearManualPrice = useCallback(() => price.clearManual(), [price])

  return {
    pkg,
    rawPrice,
    fxRate,
    fxStatus: fx.status as FetchStatus,
    priceStatus: price.status as FetchStatus,
    priceSource: price.data?.source,
    priceStale: price.data?.stale ?? false,
    refreshPrice,
    setManualPrice,
    clearManualPrice,
  }
}
