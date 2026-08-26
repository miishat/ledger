import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setMatchMedia } from '../../test-utils/matchMedia'
import { CSVUploader } from './CSVUploader'
import { useBudgetStore } from '../../store/useBudgetStore'
import { useTriageStore } from '../../store/useTriageStore'
import { parseCSV } from '../../utils/csvParser'

vi.mock('../../utils/csvParser', async () => {
  const actual = await vi.importActual<typeof import('../../utils/csvParser')>('../../utils/csvParser')
  return { ...actual, parseCSV: vi.fn(actual.parseCSV) }
})

describe('CSVUploader mapping sheet', () => {
  it('renders when open and closes via scrim', async () => {
    setMatchMedia(true)
    vi.mocked(parseCSV).mockResolvedValueOnce({
      unrecognized: true,
      headers: ['Date', 'Amount', 'Description'],
      rows: [{ Date: '2024-01-01', Amount: '10', Description: 'Test' }],
    })
    render(<CSVUploader />)

    const file = new File(['Date,Amount,Description\n2024-01-01,10,Test'], 'test.csv', { type: 'text/csv' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    const panel = await waitFor(() => screen.getByTestId('sheet-panel'))
    expect(panel).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('sheet-scrim'))
    await waitFor(() => expect(screen.queryByTestId('sheet-panel')).not.toBeInTheDocument())
  })
})

describe('CSVUploader import button (mobile de-duplication)', () => {
  it('is accessible via aria-label and collapses its text label below sm', () => {
    render(<CSVUploader />)

    const button = screen.getByRole('button', { name: 'Import CSV' })
    expect(button).toBeInTheDocument()

    const label = button.querySelector('span')
    expect(label).toBeTruthy()
    expect(label!.className.split(/\s+/)).toContain('hidden')
    expect(label!.className.split(/\s+/)).toContain('sm:inline')
  })
})

it('flags an imported row that already exists in the budget', async () => {
  useBudgetStore.setState({
    transactions: {
      e1: { id: 'e1', date: '2026-08-04', amount: 42.5, description: 'TIM HORTONS #123', type: 'expense' },
    },
  })
  const csv = 'Date,Amount,Description\n2026-08-04,-42.50,Tim Hortons #123\n2026-08-05,-9.00,Coffee\n'
  render(<CSVUploader />)
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, { target: { files: [new File([csv], 'stmt.csv', { type: 'text/csv' })] } })

  await waitFor(() => {
    expect(Object.keys(useTriageStore.getState().pendingTransactions)).toHaveLength(2)
  })
  const pending = Object.values(useTriageStore.getState().pendingTransactions)
  expect(pending.find((p) => p.description === 'Tim Hortons #123')?.duplicate).toBe('exact')
  expect(pending.find((p) => p.description === 'Coffee')?.duplicate).toBeUndefined()
})

describe('CSVUploader Chase category fallback', () => {
  it('uses the Chase category only when no learned rule matches', async () => {
    useBudgetStore.setState({
      ...useBudgetStore.getState(),
      categories: {
        cg: { id: 'cg', groupId: 'g1', name: 'Groceries', targetAmount: 0 },
        cp: { id: 'cp', groupId: 'g1', name: 'Personal', targetAmount: 0 },
      },
    })
    useTriageStore.setState({ pendingTransactions: {}, categoryRules: { lidl: 'cp' } })

    vi.mocked(parseCSV).mockResolvedValueOnce([
      {
        id: 'r1', date: '2026-08-22', amount: 4.29, description: 'LIDL #1590', type: 'expense',
        originalRowData: { Category: 'Groceries' },
      },
      {
        id: 'r2', date: '2026-08-22', amount: 11.38, description: 'TARGET T-3284', type: 'expense',
        originalRowData: { Category: 'Shopping' },
      },
    ])

    render(<CSVUploader />)
    const file = new File(['x'], 'chase.csv', { type: 'text/csv' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      const pending = useTriageStore.getState().pendingTransactions
      // The learned "lidl" rule wins over Chase's own Groceries category.
      expect(pending['r1'].categoryId).toBe('cp')
      // No rule matches TARGET, so Chase's Shopping maps to Personal.
      expect(pending['r2'].categoryId).toBe('cp')
    })
  })
})
