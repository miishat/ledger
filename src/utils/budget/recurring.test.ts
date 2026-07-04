import type { Transaction } from '../../types/budget'
import { detectRecurring, normalizeDescription } from './recurring'

let id = 0
const tx = (date: string, amount: number, description: string, type: 'expense' | 'income' = 'expense'): Transaction =>
  ({ id: `t${id++}`, date, amount, description, type })

const asRecord = (list: Transaction[]) => Object.fromEntries(list.map((t) => [t.id, t]))

describe('normalizeDescription', () => {
  it('strips reference numbers and case', () => {
    expect(normalizeDescription('NETFLIX.COM #12345')).toBe(normalizeDescription('netflix.com #99999'))
    expect(normalizeDescription('  Spotify   P2B4C ')).toContain('SPOTIFY')
  })
})

describe('detectRecurring', () => {
  it('finds a monthly subscription with jittered dates and amounts', () => {
    const txs = asRecord([
      tx('2026-03-01', 16.99, 'NETFLIX.COM #111'),
      tx('2026-04-02', 16.99, 'NETFLIX.COM #222'),
      tx('2026-05-01', 17.99, 'NETFLIX.COM #333'),
      tx('2026-06-01', 17.99, 'NETFLIX.COM #444'),
    ])
    const items = detectRecurring(txs)
    expect(items).toHaveLength(1)
    expect(items[0].occurrences).toBe(4)
    expect(items[0].intervalDays).toBeGreaterThanOrEqual(28)
    expect(items[0].intervalDays).toBeLessThanOrEqual(32)
    expect(items[0].nextExpected > '2026-06-01').toBe(true)
    expect(items[0].monthlyEstimate).toBeCloseTo(items[0].avgAmount * (30 / items[0].intervalDays), 6)
  })

  it('detects biweekly income (paycheque)', () => {
    const txs = asRecord([
      tx('2026-05-01', 2500, 'ACME PAYROLL', 'income'),
      tx('2026-05-15', 2500, 'ACME PAYROLL', 'income'),
      tx('2026-05-29', 2500, 'ACME PAYROLL', 'income'),
      tx('2026-06-12', 2500, 'ACME PAYROLL', 'income'),
    ])
    const items = detectRecurring(txs)
    expect(items).toHaveLength(1)
    expect(items[0].type).toBe('income')
    expect(items[0].intervalDays).toBe(14)
  })

  it('rejects fewer than 3 occurrences, irregular gaps, and swinging amounts', () => {
    const txs = asRecord([
      tx('2026-05-01', 50, 'ONE OFF STORE'),
      tx('2026-05-02', 50, 'ONE OFF STORE'),
      // irregular
      tx('2026-01-01', 40, 'RANDOM SHOP'),
      tx('2026-01-05', 40, 'RANDOM SHOP'),
      tx('2026-06-01', 40, 'RANDOM SHOP'),
      // amount swings
      tx('2026-03-01', 10, 'GROCERY MART'),
      tx('2026-04-01', 300, 'GROCERY MART'),
      tx('2026-05-01', 80, 'GROCERY MART'),
    ])
    expect(detectRecurring(txs)).toHaveLength(0)
  })
})
