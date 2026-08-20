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

// Truncated account names were the single most visible mobile complaint:
// nine text nodes were cut at 320px on the dashboard alone.
test('no dashboard text is clipped by its own container', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('accounts-storage', JSON.stringify({
      state: {
        accounts: [
          { id: 'a1', name: 'EQ Bank High Interest Savings', value: 32150, type: 'bank' },
          { id: 'a2', name: 'Mortgage - 12 Maplewood Crescent', value: 412000, type: 'debt' },
        ],
        history: [],
      },
    }))
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((el) => {
        if (el.children.length > 0) return false
        if (el.closest('.sr-only')) return false
        const cs = getComputedStyle(el)
        if (cs.overflow === 'visible' && cs.overflowX === 'visible') return false
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && el.scrollWidth > el.clientWidth + 1
      })
      .map((el) => `${(el.textContent || '').trim().slice(0, 30)} needs ${el.scrollWidth} has ${el.clientWidth}`),
  )
  expect(clipped).toEqual([])
})

// The audit could not verify this and flagged it as an open question: if a
// series value is only readable from a hover tooltip, it is unreadable on a
// phone. Playwright's iPhone fixture has hasTouch, so page.tap exercises the
// real touch path.
test('a chart reveals its values on tap', async ({ page }) => {
  await page.goto('/#/planner/mortgage')
  await page.waitForLoadState('networkidle')
  const chart = page.locator('.recharts-wrapper').first()
  await expect(chart).toBeVisible()
  // The mortgage chart sits below three stacked result cards on a 375px-wide
  // phone, so it starts outside the viewport. A real thumb would scroll down
  // to it before tapping; page.touchscreen.tap uses raw viewport coordinates
  // and does not scroll on its own, so do it explicitly first.
  await chart.scrollIntoViewIfNeeded()
  const box = (await chart.boundingBox())!
  await page.touchscreen.tap(box.x + box.width * 0.6, box.y + box.height * 0.5)
  await expect(page.locator('.recharts-tooltip-wrapper')).toBeVisible({ timeout: 2000 })
})
