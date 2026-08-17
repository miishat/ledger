import { describe, expect, it, beforeEach } from 'vitest'
import { buildDemoData, isDemoActive, DEMO_FLAG_KEY } from './demoData'
import { NON_BACKUP_KEY_NAMES, STORAGE_KEYS } from '../store/storageKeys'

beforeEach(() => localStorage.clear())

describe('demo data', () => {
  it('builds a dataset with categorized transactions', () => {
    const { transactions, categories } = buildDemoData()
    expect(Object.keys(transactions).length).toBeGreaterThanOrEqual(10)
    expect(Object.keys(categories).length).toBeGreaterThanOrEqual(3)
    for (const tx of Object.values(transactions)) {
      expect(tx.id).toBeTruthy()
      expect(Number.isFinite(tx.amount)).toBe(true)
    }
  })

  it('reports demo state from the flag', () => {
    expect(isDemoActive()).toBe(false)
    localStorage.setItem(DEMO_FLAG_KEY, 'on')
    expect(isDemoActive()).toBe(true)
  })

  it('keeps the demo flag out of backups', () => {
    expect(NON_BACKUP_KEY_NAMES).toContain('demo')
    expect(STORAGE_KEYS.demo).toBe(DEMO_FLAG_KEY)
  })
})
