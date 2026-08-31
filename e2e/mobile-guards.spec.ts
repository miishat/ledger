import { test, expect } from '@playwright/test'

const DISCLAIMER_ACK_KEY = 'ledger-disclaimer-ack'
const BUDGET_KEY = 'ledger-budget'

// Same shape as e2e/a11y-mobile.spec.ts's SEED_TRANSACTIONS, so both suites
// exercise the same populated card list instead of an empty state.
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
  await page.addInitScript(({ key, transactions }) => {
    window.localStorage.setItem(key, JSON.stringify({
      state: { transactions, categories: {}, categoryGroups: {} },
      version: 3,
    }))
  }, { key: BUDGET_KEY, transactions: SEED_TRANSACTIONS })
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
          // The shared Checkbox component keeps a deliberately small (20px)
          // visible box inside a dedicated 44x44 hit-area wrapper <span>, so
          // a checkbox's own tap target is that wrapper, not the input.
          const target = (el as HTMLInputElement).type === 'checkbox' && el.parentElement
            ? el.parentElement
            : el
          const r = target.getBoundingClientRect()
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
  await page.getByRole('tab', { name: 'Transactions' }).click()
  const offenders = await page.evaluate((selector) => {
    return [...document.querySelectorAll(selector)]
      .filter((el) => {
        if (el.classList.contains('tap-exempt')) return false
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none') return false
        // The shared Checkbox component keeps a deliberately small (20px)
        // visible box inside a dedicated 44x44 hit-area wrapper <span>, so a
        // checkbox's own tap target is that wrapper, not the input itself.
        const target = (el as HTMLInputElement).type === 'checkbox' && el.parentElement
          ? el.parentElement
          : el
        const r = target.getBoundingClientRect()
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

// Task 10's desktop guard for this same defect measured a chart label
// against the document viewport, but main's overflow-x-hidden clips a
// label's paint before its un-clipped getBoundingClientRect() ever reaches
// the document edge at desktop widths, so that guard could pass even while
// a label had escaped the app. The escape is real; it just needs a phone
// width to reach the true document edge, and mobile-narrow (320px) and
// mobile-landscape both land in that range.
test('no chart text escapes the document viewport', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('ledger-compensation', JSON.stringify({
      state: {
        primaryPackage: {
          id: 'p1', name: 'Current Offer', companyTicker: 'MSFT', companyCurrentPrice: 428.5,
          baseSalary: 165000, pastSalaryChanges: [], cashBonusPercent: 12, cashBonusMonth: 2,
          esppContributionPercent: 10, esppDiscountPercent: 15, esppLockedInPrice: 0,
          rrspMatchPercent: 5, rrspMatchCap: 12000,
          rsuGrants: [{
            id: 'g1', grantName: '2024 Refresh', grantShares: 1200, grantPrice: 310,
            grantStartDate: '2024-03-01',
            vestingSchedule: { preset: '4yr-1yr-cliff', totalVestMonths: 48, cliffMonths: 12, frequency: 'quarterly' },
          }],
        },
        comparePackage: null, compareMode: false, timeMode: 'current-year',
        useCadConversion: false, showAfterTax: false,
      },
      version: 0,
    }))
  })
  await page.goto('/#/compensation')
  await page.waitForLoadState('networkidle')
  // The pie animates in; measure only once it has settled.
  await page.waitForTimeout(1500)
  const escaped = await page.evaluate(() => {
    const w = document.documentElement.clientWidth
    return [...document.querySelectorAll('svg text')]
      .map((t) => ({ txt: t.textContent, r: t.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.left < -1 || r.right > w + 1))
      .map(({ txt, r }) => ({ txt, left: Math.round(r.left), right: Math.round(r.right), viewport: w }))
  })
  expect(escaped).toEqual([])
})

// The whole app cleared this at 375px and 320px when the audit ran, and
// exactly one screen did not: the Compensation toggle row. This keeps the
// zero at both widths and in landscape.
for (const [name, hash] of ROUTES) {
  test(`${name} never scrolls sideways`, async ({ page }) => {
    await page.goto(`/${hash}`)
    await page.waitForLoadState('networkidle')
    const { scrollW, clientW, past } = await page.evaluate(() => {
      const de = document.documentElement
      const past = [...document.querySelectorAll('*')]
        .filter((el) => {
          const cs = getComputedStyle(el)
          if (cs.visibility === 'hidden' || cs.display === 'none') return false
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height > 0 && r.right > de.clientWidth + 1
        })
        .map((el) => `${(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30)} right=${Math.round(el.getBoundingClientRect().right)}`)
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, past: past.slice(0, 10) }
    })
    expect(past).toEqual([])
    expect(scrollW).toBe(clientW)
  })
}

// The blocker this plan opened with: at 844x390 the sidebar appeared, the
// tab bar vanished, and Settings sat at y=410 in a 390px viewport with
// nothing to scroll. Settings must be tappable at every phone size.
test('settings is reachable and inside the viewport', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const settings = page.locator('[data-testid="mobile-topbar"] button[aria-label="Settings"]')
  await expect(settings).toBeVisible()
  const box = (await settings.boundingBox())!
  const viewport = page.viewportSize()!
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  await settings.click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('search is reachable without a keyboard', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-testid="mobile-topbar"] button[aria-label="Search"]').click()
  await expect(page.getByPlaceholder('Jump to a page or tool…')).toBeVisible()
})

// 0.9.7 made the Dashboard's Customize button the same size as other header
// buttons, which left it 5px too narrow for its own label at 320px: it
// rendered a 76px box for an 81px label, hard against the screen edge with
// its right padding eaten.
test('no header button is squeezed below its own label', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const squeezed = await page.evaluate(() =>
    [...document.querySelectorAll('header button, main button')]
      .filter((b) => b.getBoundingClientRect().width > 0)
      .filter((b) => b.scrollWidth > b.clientWidth + 1)
      .map((b) => ({ text: (b.textContent || '').trim(), shown: b.clientWidth, needs: b.scrollWidth })),
  )
  expect(squeezed).toEqual([])
})
