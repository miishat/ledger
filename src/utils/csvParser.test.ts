import { describe, expect, it } from 'vitest'
import { PARSERS } from './csvParser'

const CHASE_HEADERS = ['Transaction Date', 'Post Date', 'Description', 'Category', 'Type', 'Amount', 'Memo']

const chase = () => {
  const p = PARSERS.find((x) => x.name === 'Chase Credit Card')
  if (!p) throw new Error('Chase Credit Card parser not registered')
  return p
}

const row = (over: Record<string, string> = {}) => ({
  'Transaction Date': '08/22/2026',
  'Post Date': '08/23/2026',
  Description: 'LIDL #1590',
  Category: 'Groceries',
  Type: 'Sale',
  Amount: '-4.29',
  Memo: '',
  ...over,
})

describe('Chase Credit Card parser detection', () => {
  it('detects the Chase header shape', () => {
    expect(chase().detect(CHASE_HEADERS, row())).toBe(true)
  })

  it('does not claim a Visa download file', () => {
    const visa = ['Account Type', 'Transaction Date', 'Description 1', 'CAD$']
    expect(chase().detect(visa, undefined)).toBe(false)
  })

  it('is registered ahead of Standard Ledger CSV', () => {
    const chaseIdx = PARSERS.findIndex((p) => p.name === 'Chase Credit Card')
    const stdIdx = PARSERS.findIndex((p) => p.name === 'Standard Ledger CSV')
    expect(chaseIdx).toBeGreaterThanOrEqual(0)
    expect(chaseIdx).toBeLessThan(stdIdx)
  })
})

describe('Chase Credit Card parser rows', () => {
  it('converts the transaction date and ignores the post date', () => {
    expect(chase().parse(row())?.date).toBe('2026-08-22')
  })

  it('reads a Sale as a positive expense', () => {
    const r = chase().parse(row())
    expect(r?.type).toBe('expense')
    expect(r?.amount).toBe(4.29)
  })

  it('reads a Return as a negative expense', () => {
    const r = chase().parse(
      row({ Description: 'AMAZON MKTPLACE PMTS', Category: 'Shopping', Type: 'Return', Amount: '39.99' }),
    )
    expect(r?.type).toBe('expense')
    expect(r?.amount).toBe(-39.99)
  })

  it('flags a Payment instead of importing it as plain income', () => {
    const r = chase().parse(
      row({ Description: 'Payment Thank You-Mobile', Category: '', Type: 'Payment', Amount: '50.00' }),
    )
    expect(r?.type).toBe('income')
    expect(r?.amount).toBe(50)
    expect(r?.flag).toBe('card-payment')
  })

  it('falls back to the sign for an unrecognized Type rather than dropping the row', () => {
    const r = chase().parse(row({ Type: 'Fee', Amount: '-1.50' }))
    expect(r?.type).toBe('expense')
    expect(r?.amount).toBe(1.5)
    expect(r?.flag).toBeUndefined()
  })

  it('decodes HTML entities in the description', () => {
    expect(chase().parse(row({ Description: 'H&amp;M  0500NEW YORK' }))?.description).toBe('H&M  0500NEW YORK')
  })

  it('returns null when the amount is not a number', () => {
    expect(chase().parse(row({ Amount: '' }))).toBeNull()
  })
})
