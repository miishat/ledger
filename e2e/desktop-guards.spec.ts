import { test, expect } from '@playwright/test'
import { seedApp } from './seed'
import { installContrastHelpers } from './contrast'

test.beforeEach(async ({ page }) => {
  await seedApp(page)
  await installContrastHelpers(page)
})

test('no account name is squeezed below its own text width', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const squeezed = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid^="account-name-"]')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => ({ name: el.textContent, shown: el.clientWidth, needs: el.scrollWidth })),
  )
  expect(squeezed).toEqual([])
})

test('every visible form control has a programmatic label', async ({ page }) => {
  const unlabelled = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('input, select, textarea')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
        })
        .filter((el) => {
          if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false
          if (el.closest('label')) return false
          return !(el.id && document.querySelector(`label[for="${el.id}"]`))
        })
        .map((el) => ({ tag: el.tagName, type: (el as HTMLInputElement).type, cls: (el.className + '').slice(0, 60) })),
    )

  await page.goto('/#/compensation')
  await page.waitForLoadState('networkidle')
  expect(await unlabelled()).toEqual([])

  await page.goto('/#/budget')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Add Transaction' }).first().click()
  await page.waitForTimeout(400)
  expect(await unlabelled()).toEqual([])
})

test('submitting Add Transaction empty explains itself', async ({ page }) => {
  await page.goto('/#/budget')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Add Transaction' }).first().click()
  await page.waitForTimeout(400)
  await page.locator('[data-testid=sheet-panel] button[type=submit]').click()
  await expect(page.getByRole('alert')).toHaveText('Enter an amount greater than zero.')
  await expect(page.locator('#tx-amount')).toHaveAttribute('aria-invalid', 'true')
})

test('no focusable control is invisible while focused', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const invisible: Array<{ label: string | null; opacity: string }> = []
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    const hit = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const s = getComputedStyle(el)
      if (parseFloat(s.opacity) > 0.01 && s.visibility !== 'hidden') return null
      return { label: el.getAttribute('aria-label'), opacity: s.opacity }
    })
    if (hit) invisible.push(hit)
  }
  expect(invisible).toEqual([])
})

test('a sheet never renders its header twice', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Settings' }).first().click()
  await page.waitForTimeout(500)
  const visibleHeadings = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid=sheet-panel]')
    if (!panel) return []
    return [...panel.querySelectorAll('h2')]
      .filter((h) => h.getBoundingClientRect().width > 0)
      .map((h) => (h.textContent || '').trim())
  })
  expect(visibleHeadings).toEqual(['Settings'])
})

const THEMES = ['geometric', 'tactical', 'luxury', 'aurora', 'glass'] as const

// The routes a control might live on. Task 9's original guard only ever
// visited /#/budget, so the Customize button on / and the two investments
// controls were fixed by inspection and never actually measured.
const ROUTES = ['/', '/#/budget', '/#/investments'] as const

for (const theme of THEMES) {
  test(`interactive borders reach 3:1 in the ${theme} theme`, async ({ page }) => {
    await page.addInitScript((t) => {
      window.localStorage.setItem('financial-dashboard-theme', JSON.stringify({ state: { theme: t }, version: 0 }))
    }, theme)

    const failures: { label: string; tag: string; ratio: number; route: string; theme: string }[] = []

    for (const route of ROUTES) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      const routeFailures: { label: string; tag: string; ratio: number; route: string }[] = await page.evaluate((r) => {
        const c = (window as unknown as {
          __contrast: { borderRatio(el: Element): number | null; backgroundRatio(el: Element): number }
        }).__contrast

        const isVisible = (el: Element) => {
          const rect = el.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden'
        }
        const labelFor = (el: Element) =>
          (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30) || el.tagName

        const out: { label: string; tag: string; ratio: number; route: string }[] = []

        // Half one: every element that already carries the strong-border
        // utility must actually measure 3:1. This is task 9's original
        // assertion, now run over every route instead of just one.
        for (const el of document.querySelectorAll('.control-border')) {
          if (!isVisible(el)) continue
          const ratio = c.borderRatio(el)
          if (ratio !== null && ratio < 3) out.push({ label: labelFor(el), tag: el.tagName, ratio, route: r })
        }

        // Half two: no visible interactive control may rely on a sub-3:1
        // border to be identifiable, whether or not it was ever given the
        // utility class. A control with no real top border has nothing to
        // measure (skip). A control whose own fill already reaches 3:1
        // against the surface behind it identifies itself by that fill, not
        // by its edge, so a weak border on it is not a defect (skip).
        for (const el of document.querySelectorAll('button, input, select, textarea')) {
          if (!isVisible(el)) continue
          const ratio = c.borderRatio(el)
          if (ratio === null) continue
          if (c.backgroundRatio(el) >= 3) continue
          if (ratio < 3) out.push({ label: labelFor(el), tag: el.tagName, ratio, route: r })
        }

        return out
      }, route)
      failures.push(...routeFailures.map((f) => ({ ...f, theme })))
    }

    expect(failures).toEqual([])
  })
}

test('tab strips are real tabs and survive a reload', async ({ page }) => {
  await page.goto('/#/budget')
  await page.waitForLoadState('networkidle')

  const strip = page.getByRole('tablist', { name: 'Budgeting sections' })
  await expect(strip).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('tab', { name: 'Transactions' }).click()
  await expect(page).toHaveURL(/tab=transactions/)

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('tab', { name: 'Transactions' })).toHaveAttribute('aria-selected', 'true')
})

test('Investments opens on Portfolio when that is the only tab with data', async ({ page }) => {
  await page.goto('/#/investments')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('tab', { name: 'Portfolio' })).toHaveAttribute('aria-selected', 'true')
})

test('each route names itself in the title and to a screen reader', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(await page.title()).toBe('Dashboard - Ledger')

  await page.getByRole('link', { name: 'Budgeting' }).first().click()
  await page.waitForTimeout(500)
  expect(await page.title()).toBe('Budgeting - Ledger')

  const announced = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-live="polite"]')].map((el) => (el.textContent || '').trim()),
  )
  expect(announced).toContain('Budgeting')
})

test('no chart text escapes its chart container', async ({ page }) => {
  await page.goto('/#/compensation')
  await page.waitForLoadState('networkidle')
  // The pie animates in; measure only once it has settled.
  await page.waitForTimeout(1500)
  const escaped = await page.evaluate(() => {
    // The document viewport is the wrong frame to measure against: main has
    // overflow-x-hidden (see Layout.tsx), which clips a label's paint long
    // before the label's own un-clipped getBoundingClientRect() reaches the
    // document edge. A label can be visibly cut off inside its card while
    // this measurement still says it fits. The chart's own ChartFigure
    // wrapper (role="img") is the frame that actually clips it, so measure
    // against that instead, falling back to the nearest ancestor whose
    // overflow-x is not visible for any chart not wrapped in ChartFigure.
    const findFrame = (el: Element): Element | null => {
      const figure = el.closest('[role="img"]')
      if (figure) return figure
      let cur = el.parentElement
      while (cur) {
        if (getComputedStyle(cur).overflowX !== 'visible') return cur
        cur = cur.parentElement
      }
      return null
    }
    const out: { txt: string | null; left: number; right: number; frameLeft: number; frameRight: number }[] = []
    for (const t of document.querySelectorAll('svg text')) {
      const frame = findFrame(t)
      if (!frame) continue
      const r = t.getBoundingClientRect()
      const f = frame.getBoundingClientRect()
      if (r.width === 0) continue
      if (r.left < f.left - 1 || r.right > f.right + 1) {
        out.push({
          txt: t.textContent,
          left: Math.round(r.left),
          right: Math.round(r.right),
          frameLeft: Math.round(f.left),
          frameRight: Math.round(f.right),
        })
      }
    }
    return out
  })
  expect(escaped).toEqual([])
})
