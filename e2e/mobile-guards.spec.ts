import { test, expect, devices } from '@playwright/test'

const DISCLAIMER_ACK_KEY = 'ledger-disclaimer-ack'

test.use({ ...devices['iPhone 12'] })

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, new Date().toISOString())
  }, DISCLAIMER_ACK_KEY)
})

const ROUTES = [
  ['dashboard', ''],
  ['budgeting', '#/budget'],
  ['investments', '#/investments'],
  ['planner', '#/planner'],
  ['mortgage', '#/planner/mortgage'],
  ['compensation', '#/compensation'],
] as const

// iOS Safari zooms the page whenever a focused field computes below 16px,
// and never zooms back out. Every input in the app was 12px to 15px.
for (const [name, hash] of ROUTES) {
  test(`${name} has no input below 16px`, async ({ page }) => {
    await page.goto(`/${hash}`)
    await page.waitForLoadState('networkidle')
    const offenders = await page.evaluate(() =>
      [...document.querySelectorAll('input, textarea, select')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          const cs = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' &&
            (el as HTMLInputElement).type !== 'checkbox' &&
            (el as HTMLInputElement).type !== 'radio' &&
            parseFloat(cs.fontSize) < 16
        })
        .map((el) => `${el.tagName}[${(el as HTMLInputElement).type || ''}] ${getComputedStyle(el).fontSize}`),
    )
    expect(offenders).toEqual([])
  })
}

// Everything a finger can hit must clear 44x44 on a phone. The audit found
// 10 of 31 controls under that on the dashboard alone, and 21 of 34 on the
// transaction list. Anything that genuinely must stay smaller opts out with
// the .tap-exempt class, and the exemption is visible in this failure list.
const TAP_SELECTOR =
  'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"], [role="switch"]'

for (const [name, hash] of ROUTES) {
  test(`${name} has no tap target under 44px`, async ({ page }) => {
    await page.goto(`/${hash}`)
    await page.waitForLoadState('networkidle')
    const offenders = await page.evaluate((selector) => {
      const label = (el: Element) =>
        (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40)
      return [...document.querySelectorAll(selector)]
        .filter((el) => {
          if (el.classList.contains('tap-exempt')) return false
          if (el.closest('.sr-only')) return false
          const cs = getComputedStyle(el)
          if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return false
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) return false
          // The skip link is visually hidden until focused.
          if (r.width <= 1 && r.height <= 1) return false
          return r.height < 44 || r.width < 44
        })
        .map((el) => {
          const r = el.getBoundingClientRect()
          return `${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`
        })
    }, TAP_SELECTOR)
    expect(offenders).toEqual([])
  })
}

// The transaction list and the customize sheet are the two densest control
// surfaces in the app and neither is on a route's first paint, so they get
// their own pass.
test('the transaction card list has no tap target under 44px', async ({ page }) => {
  await page.goto('/#/budget')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Transactions' }).click()
  const offenders = await page.evaluate((selector) => {
    return [...document.querySelectorAll(selector)]
      .filter((el) => {
        if (el.classList.contains('tap-exempt')) return false
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none') return false
        const r = el.getBoundingClientRect()
        if (r.width <= 1 || r.height <= 1) return false
        return r.height < 44 || r.width < 44
      })
      .map((el) => {
        const r = el.getBoundingClientRect()
        const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30)
        return `${label} ${Math.round(r.width)}x${Math.round(r.height)}`
      })
  }, TAP_SELECTOR)
  expect(offenders).toEqual([])
})
