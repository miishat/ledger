import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CashFlowWidget } from './CashFlowWidget'
import { useBudgetStore } from '../../store/useBudgetStore'
import { resetMatchMedia, setMatchMedia } from '../../test-utils/matchMedia'

// vi.mock factories are hoisted above every import and top-level const, so
// the capture array has to be created with vi.hoisted, and the factory must
// not use JSX (that would reach for the JSX runtime import before it exists).
const { captured } = vi.hoisted(() => ({ captured: [] as { nodes: { name: string }[] }[] }))

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => children,
    Sankey: ({ data }: { data: { nodes: { name: string }[] } }) => {
      captured.push(data)
      return null
    },
  }
})

const budgetInitial = useBudgetStore.getState()
const range = { from: '2026-08', to: '2026-08' }

function seedEightAndEight() {
  const categoryGroups: Record<string, { id: string; name: string; kind: 'income' | 'expense' }> = {
    gi: { id: 'gi', name: 'Income', kind: 'income' },
  }
  const categories: Record<string, { id: string; groupId: string; name: string; targetAmount: number }> = {}
  const transactions: Record<string, object> = {}
  for (let i = 1; i <= 8; i++) {
    categories[`i${i}`] = { id: `i${i}`, groupId: 'gi', name: `Income ${i}`, targetAmount: 0 }
    transactions[`ti${i}`] = { id: `ti${i}`, date: '2026-08-02', amount: 1000 - i, description: 'in', type: 'income', categoryId: `i${i}` }
    categoryGroups[`ge${i}`] = { id: `ge${i}`, name: `Spend ${i}`, kind: 'expense' }
    categories[`e${i}`] = { id: `e${i}`, groupId: `ge${i}`, name: `Cat ${i}`, targetAmount: 0 }
    transactions[`te${i}`] = { id: `te${i}`, date: '2026-08-03', amount: 100 - i, description: 'out', type: 'expense', categoryId: `e${i}` }
  }
  useBudgetStore.setState({ categoryGroups, categories, transactions } as never)
}

beforeEach(() => {
  captured.length = 0
  useBudgetStore.setState(budgetInitial, true)
})
afterEach(() => resetMatchMedia())

describe('CashFlowWidget on a phone', () => {
  it('draws the top three sources and top four spending groups, folding the rest', () => {
    setMatchMedia(false)
    seedEightAndEight()
    render(<CashFlowWidget range={range} />)
    const names = captured.at(-1)!.nodes.map((n) => n.name)
    expect(names).toEqual([
      'Income 1', 'Income 2', 'Income 3', 'Other sources',
      'Income',
      'Spend 1', 'Spend 2', 'Spend 3', 'Spend 4', 'Other spending',
      'Savings',
    ])
  })

  it('still describes the real counts to a screen reader', () => {
    setMatchMedia(false)
    seedEightAndEight()
    render(<CashFlowWidget range={range} />)
    expect(screen.getByRole('img', { name: /across 8 sources .* across 8 groups/ })).toBeInTheDocument()
  })

  it('draws every category on desktop', () => {
    seedEightAndEight()
    render(<CashFlowWidget range={range} />)
    expect(captured.at(-1)!.nodes).toHaveLength(8 + 1 + 8 + 1)
  })
})
