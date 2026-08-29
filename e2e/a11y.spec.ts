import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { seedApp } from './seed'

const DISCLAIMER_ACK_KEY = 'ledger-disclaimer-ack'
const BUDGET_KEY = 'ledger-budget'

// A small set of transactions with varied fields (categorized, tagged,
// neither) so the axe scan exercises the real populated transaction table
// instead of the EmptyState that renders when txList.length === 0.
const SEED_TRANSACTIONS: Record<string, unknown> = {
  t1: { id: 't1', date: '2026-08-01', amount: 12.5, description: 'Coffee shop', type: 'expense', categoryId: 'groceries' },
  t2: { id: 't2', date: '2026-08-02', amount: 45, description: 'Gas station', type: 'expense', tags: ['car'] },
  t3: { id: 't3', date: '2026-08-03', amount: 2500, description: 'Paycheck', type: 'income' },
  t4: { id: 't4', date: '2026-08-04', amount: 89.99, description: 'Electric bill', type: 'expense', categoryId: 'utilities', tags: ['home'] },
  t5: { id: 't5', date: '2026-08-05', amount: 15, description: 'Streaming service', type: 'expense' },
  t6: { id: 't6', date: '2026-08-06', amount: 60, description: 'Restaurant', type: 'expense', categoryId: 'dining', note: 'Dinner with friends' },
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, new Date().toISOString())
  }, DISCLAIMER_ACK_KEY)
})

const routes = [
  ['dashboard', ''],
  ['budgeting', '#/budget'],
  ['investments', '#/investments'],
  ['planner', '#/planner'],
  ['compensation', '#/compensation'],
] as const

for (const [name, hash] of routes) {
  test(`${name} has no serious or critical accessibility violations`, async ({ page }) => {
    if (name === 'budgeting') {
      await page.addInitScript(
        ([budgetKey, payload]) => {
          window.localStorage.setItem(
            budgetKey as string,
            JSON.stringify({
              state: { transactions: payload, categories: {}, categoryGroups: {} },
              version: 3,
            }),
          )
        },
        [BUDGET_KEY, SEED_TRANSACTIONS],
      )
    }
    await page.goto(`/${hash}`)
    await page.waitForLoadState('networkidle')
    if (name === 'budgeting') {
      await page.getByRole('tab', { name: 'Transactions' }).click()
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(blocking.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
}

// Every theme, not just the default. The contrast helpers in e2e/contrast.ts
// measure borders, and a composited text helper measures text against the
// element's own background, which is right for text on an opaque surface and
// wrong for `bg-accent/10`: a translucent fill layered over a card. Neither
// can see that pattern, and the 2026-08-28 audit found it failing on all
// eight routes in the geometric theme. Only axe catches it, and only when
// axe is actually pointed at each theme.
const THEMES = ['geometric', 'tactical', 'luxury', 'aurora', 'glass', 'nouveau'] as const

const THEME_ROUTES = [
  ['dashboard', ''],
  ['budget', '#/budget'],
  ['investments', '#/investments'],
  ['salary-tax', '#/planner/salary-tax'],
  ['mortgage', '#/planner/mortgage'],
  ['forecaster', '#/planner/forecaster'],
  ['compensation', '#/compensation'],
  ['planner', '#/planner'],
] as const

for (const theme of THEMES) {
  test(`no serious or critical accessibility violations in the ${theme} theme`, async ({ page }) => {
    // Without seeding, several routes render an empty state instead of the
    // populated UI (e.g. Investments defaults to an empty journal tab, not
    // the portfolio tab), so an unseeded scan misses the surfaces the
    // defects actually live on. seedApp matches what desktop-guards.spec.ts
    // already does for the same reason.
    await seedApp(page)
    await page.addInitScript((t) => {
      window.localStorage.setItem('financial-dashboard-theme', JSON.stringify({ state: { theme: t }, version: 0 }))
    }, theme)

    const found: string[] = []
    for (const [name, hash] of THEME_ROUTES) {
      await page.goto(`/${hash}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(400)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      for (const v of results.violations) {
        if (v.impact !== 'serious' && v.impact !== 'critical') continue
        // axe groups every node that breaks the same rule into one violation
        // object. Printing only v.nodes[0] hid an entire family of failures
        // (bg-accent/10 + text-accent tabs, chips, and panels) behind a
        // single kbd line, and two readers concluded kbd was the only
        // offender. List one entry per node so every selector surfaces.
        for (const node of v.nodes) {
          found.push(`${name}: ${v.id} (${v.impact}) - ${node.target?.[0] ?? ''}`)
        }
      }
    }
    expect(found).toEqual([])
  })
}
