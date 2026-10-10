import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NetWorthTrendWidget } from './NetWorthTrendWidget'
import { useAccountsStore } from '../../../store/useAccountsStore'
import { trendDomain } from './trendDomain'

describe('trendDomain', () => {
  it('pads min and max by 8% of the range and never forces zero', () => {
    const [lo, hi] = trendDomain([100000, 110000])
    expect(lo).toBeCloseTo(99200) // 100000 - 800
    expect(hi).toBeCloseTo(110800)
    expect(lo).toBeGreaterThan(0)
  })

  it('handles a flat series with a value-relative pad', () => {
    const [lo, hi] = trendDomain([50000, 50000])
    expect(lo).toBeLessThan(50000)
    expect(hi).toBeGreaterThan(50000)
  })

  it('handles an all-zero series without collapsing', () => {
    const [lo, hi] = trendDomain([0, 0])
    expect(hi).toBeGreaterThan(lo)
  })
})

describe('currency history marker', () => {
  it('explains earlier history beside the trend', () => {
    useAccountsStore.setState({ currencySupportStartedAt: '2026-10-06', history: [{ date: '2026-09-01', value: 100 }] })
    render(<NetWorthTrendWidget />)
    expect(screen.getByText(/Earlier totals may have treated foreign balances as CAD/)).toBeTruthy()
  })

  it('omits the explanation when history begins after currency support', () => {
    useAccountsStore.setState({ currencySupportStartedAt: '2026-10-06', history: [{ date: '2026-10-07', value: 100 }] })
    render(<NetWorthTrendWidget />)
    expect(screen.queryByText(/Earlier totals may have treated foreign balances as CAD/)).toBeNull()
  })
})
