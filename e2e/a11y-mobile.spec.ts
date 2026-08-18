import { test, expect, devices } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const DISCLAIMER_ACK_KEY = 'ledger-disclaimer-ack'

// The desktop scan cannot see the mobile card list, the bottom tab bar, or
// anything a narrow viewport reveals, so those routes are scanned again here.
test.use({ ...devices['Pixel 5'] })

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
  test(`${name} has no serious or critical accessibility violations on mobile`, async ({ page }) => {
    await page.goto(`/${hash}`)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )
    expect(blocking.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
}
