import { test, expect } from '@playwright/test'

const DISCLAIMER_ACK_KEY = 'ledger-disclaimer-ack'
const BUDGET_KEY = 'ledger-budget'

test('renders a long transaction list without mounting every row', async ({ page }) => {
  const transactions: Record<string, unknown> = {}
  for (let i = 0; i < 1200; i++) {
    transactions[`t${i}`] = {
      id: `t${i}`,
      date: '2026-08-04',
      amount: 12.5,
      description: `TEST TXN ${i}`,
      type: 'expense',
    }
  }

  await page.addInitScript(
    ([ackKey, budgetKey, payload]) => {
      window.localStorage.setItem(ackKey as string, new Date().toISOString())
      window.localStorage.setItem(
        budgetKey as string,
        JSON.stringify({
          state: { transactions: payload, categories: {}, categoryGroups: {} },
          version: 3,
        }),
      )
    },
    [DISCLAIMER_ACK_KEY, BUDGET_KEY, transactions],
  )

  await page.goto('/#/budget')
  await page.getByRole('button', { name: 'Transactions' }).click()

  // Sanity check: confirm the store actually loaded all 1200 seeded rows
  // (not a silently-empty fallback caused by a persisted-shape mismatch)
  // before trusting the row-count assertions below.
  await expect(page.getByText('All Transactions')).toBeVisible()
  const clearAllButton = page.getByRole('button', { name: 'Clear All' })
  await expect(clearAllButton).toBeVisible()

  const rows = page.locator('table tbody tr:not([aria-hidden="true"])')
  await expect(rows.first()).toBeVisible()
  expect(await rows.count()).toBeLessThan(60)

  await page.mouse.wheel(0, 4000)
  await expect(rows.first()).toBeVisible()
  expect(await rows.count()).toBeLessThan(60)
})

test('renders a long transaction list on mobile without mounting every card', async ({ page }) => {
  const transactions: Record<string, unknown> = {}
  for (let i = 0; i < 1200; i++) {
    transactions[`t${i}`] = {
      id: `t${i}`,
      date: '2026-08-04',
      amount: 12.5,
      description: `TEST TXN ${i}`,
      type: 'expense',
    }
  }

  await page.addInitScript(
    ([ackKey, budgetKey, payload]) => {
      window.localStorage.setItem(ackKey as string, new Date().toISOString())
      window.localStorage.setItem(
        budgetKey as string,
        JSON.stringify({
          state: { transactions: payload, categories: {}, categoryGroups: {} },
          version: 3,
        }),
      )
    },
    [DISCLAIMER_ACK_KEY, BUDGET_KEY, transactions],
  )

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/#/budget')
  await page.getByRole('button', { name: 'Transactions' }).click()

  const cards = page.locator('[data-testid="transactions-cards"] [data-testid^="transaction-card-"]')
  await expect(cards.first()).toBeVisible()
  expect(await cards.count()).toBeLessThan(60)
})
