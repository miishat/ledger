import { describe, expect, it } from 'vitest'
import { dueReminders } from './reminders'

const now = new Date('2026-08-16T09:00:00Z')

describe('dueReminders', () => {
  const items = [
    { key: 'rent', label: 'Rent', nextDate: '2026-08-18' },
    { key: 'gym', label: 'Gym', nextDate: '2026-09-30' },
    { key: 'phone', label: 'Phone', nextDate: '2026-08-17' },
  ]

  it('returns only items inside the lead window', () => {
    const due = dueReminders(items, { now, leadDays: 3, ignoredKeys: [] })
    expect(due.map((d) => d.key).sort()).toEqual(['phone', 'rent'])
  })

  it('respects the ignore list', () => {
    const due = dueReminders(items, { now, leadDays: 3, ignoredKeys: ['rent'] })
    expect(due.map((d) => d.key)).toEqual(['phone'])
  })

  it('skips items already in the past', () => {
    const due = dueReminders([{ key: 'old', label: 'Old', nextDate: '2026-08-01' }], {
      now,
      leadDays: 3,
      ignoredKeys: [],
    })
    expect(due).toEqual([])
  })

  it('ignores unparseable dates instead of throwing', () => {
    const due = dueReminders([{ key: 'bad', label: 'Bad', nextDate: 'nope' }], {
      now,
      leadDays: 3,
      ignoredKeys: [],
    })
    expect(due).toEqual([])
  })
})
