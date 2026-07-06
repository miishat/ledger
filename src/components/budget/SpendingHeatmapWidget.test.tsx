import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpendingHeatmapWidget } from './SpendingHeatmapWidget'
import { useBudgetStore } from '../../store/useBudgetStore'

describe('SpendingHeatmapWidget legend', () => {
  it('shows a color-swatch legend instead of the darker-equals-more text', () => {
    useBudgetStore.setState({
      transactions: {
        t1: { id: 't1', date: '2026-07-03', amount: 50, type: 'expense', description: '', categoryId: undefined },
      } as never,
    })
    render(<SpendingHeatmapWidget selectedMonth="2026-07" />)
    expect(screen.queryByText(/Darker = more/i)).toBeNull()
    expect(screen.getByTestId('heatmap-legend')).toBeTruthy()
    expect(screen.getByText('$0')).toBeTruthy()
  })
})
