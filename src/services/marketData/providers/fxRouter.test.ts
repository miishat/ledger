import { describe, expect, it, vi } from 'vitest'

vi.mock('./frankfurter', () => ({ fetchFxRate: vi.fn().mockResolvedValue({ from: 'USD', to: 'EUR', rate: 0.9, date: '2026-07-15', asOf: 'x' }) }))
vi.mock('./erApi', () => ({ fetchErApiFxRate: vi.fn().mockResolvedValue({ from: 'USD', to: 'BDT', rate: 117.5, date: '2026-07-15', asOf: 'x' }) }))

import { fetchFxRateRouted, FRANKFURTER_CURRENCIES } from './fxRouter'
import { fetchFxRate } from './frankfurter'
import { fetchErApiFxRate } from './erApi'

describe('fetchFxRateRouted', () => {
  it('routes pairs Frankfurter supports to Frankfurter (with the date)', async () => {
    await fetchFxRateRouted('USD', 'EUR', '2026-01-02')
    expect(fetchFxRate).toHaveBeenCalledWith('USD', 'EUR', '2026-01-02')
    expect(fetchErApiFxRate).not.toHaveBeenCalled()
  })

  it('routes any pair involving an unsupported currency to er-api (date dropped)', async () => {
    await fetchFxRateRouted('USD', 'BDT', '2026-01-02')
    expect(fetchErApiFxRate).toHaveBeenCalledWith('USD', 'BDT')
  })

  it('knows BDT is not a Frankfurter currency', () => {
    expect(FRANKFURTER_CURRENCIES.has('BDT')).toBe(false)
    expect(FRANKFURTER_CURRENCIES.has('KRW')).toBe(true)
  })
})
