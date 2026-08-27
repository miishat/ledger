import { test, expect, type Page } from '@playwright/test'
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

  // The compensation edit modal is its own form, opened only by this button,
  // and earlier passes of this guard never opened it. It ships plenty of
  // sibling <label> elements with no htmlFor of its own.
  await page.getByRole('button', { name: 'Edit Package' }).click()
  await page.waitForTimeout(400)
  expect(await unlabelled()).toEqual([])
  await page.keyboard.press('Escape')

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
  // The modal opens on Expense, where a negative amount is a valid refund, so the
  // zero-amount message says so. Income still uses "greater than zero".
  await expect(page.getByRole('alert')).toHaveText('Enter an amount. Use a negative amount for a refund.')
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

const THEMES = ['geometric', 'tactical', 'luxury', 'aurora', 'glass', 'nouveau'] as const

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
      // Controls carrying `transition-colors` are mid-fade for a few frames
      // after they mount, and getComputedStyle happily reports the
      // in-between border colour. Measuring then is not a measurement of the
      // design, it is a measurement of an animation frame, which made this
      // guard fail roughly one run in seven on the glass theme while the
      // settled value sat at 3.77:1. Wait for every running transition and
      // animation to finish before reading any colour.
      await page.evaluate(async () => {
        // Only finite animations. The aurora and glass themes run looping
        // gradient animations whose `finished` promise never resolves, so
        // awaiting those hangs until the test times out. The cap is a
        // safety net: a transition this guard cares about lasts a few
        // hundred milliseconds, and nothing here should block on paint.
        const settled = document
          .getAnimations()
          .filter((a) => {
            if (a.playState !== 'running') return false
            const iterations = a.effect?.getTiming().iterations
            return iterations !== Infinity
          })
          .map((a) => a.finished.catch(() => undefined))
        await Promise.race([
          Promise.all(settled),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ])
      })
      const routeFailures: { label: string; tag: string; ratio: number; route: string }[] = await page.evaluate((r) => {
        const c = (window as unknown as {
          __contrast: {
            borderRatio(el: Element): number | null
            controlBorderRatio(el: Element): number
            backgroundRatio(el: Element): number
          }
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
        // controlBorderRatio (unlike borderRatio below) never skips: a
        // `.control-border` element with no visible border at all, e.g. one
        // missing the `border` utility that gives the colour a width to
        // paint, is exactly the defect this half exists to catch, so it
        // measures 0 and fails rather than being silently dropped.
        for (const el of document.querySelectorAll('.control-border')) {
          if (!isVisible(el)) continue
          const ratio = c.controlBorderRatio(el)
          if (ratio < 3) out.push({ label: labelFor(el), tag: el.tagName, ratio, route: r })
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

// Pins the composition that let 8 tab panels ship keyboard-focusable with no
// focus indicator: each panel carries tabIndex={0} (so tabbing off the strip
// lands somewhere), and used to also carry focus-visible:outline-none with
// no replacement ring. That suppression was inert under the old universal
// :focus-visible rule (an unlayered selector always won regardless), so
// nobody noticed until the focus-ring unification scoped that rule to read a
// component's own suppression, at which point the panels resolved to
// outline-style: none and became a real WCAG 2.4.7 failure. A future
// Tailwind upgrade, or a new outline-none slipped onto a panel, would
// reintroduce exactly this without this guard.
const TAB_PANEL_CASES: { route: string; tabName: string; panelId: string }[] = [
  { route: '/#/budget', tabName: 'Overview', panelId: 'panel-overview' },
  { route: '/#/budget', tabName: 'Insights', panelId: 'panel-insights' },
  { route: '/#/budget', tabName: 'Transactions', panelId: 'panel-transactions' },
  { route: '/#/budget', tabName: 'Setup', panelId: 'panel-setup' },
  { route: '/#/investments', tabName: 'Plan vs Actual', panelId: 'panel-journal' },
  { route: '/#/investments', tabName: 'Portfolio', panelId: 'panel-portfolio' },
  { route: '/#/investments', tabName: 'Trades', panelId: 'panel-trades' },
  { route: '/#/investments', tabName: 'Options', panelId: 'panel-wheel' },
]

test('a tab panel that suppresses the default outline still shows a focus indicator', async ({ page }) => {
  const bad: { panelId: string; outlineStyle: string; outlineWidth: string; boxShadow: string }[] = []
  for (const { route, tabName, panelId } of TAB_PANEL_CASES) {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: tabName }).click()
    await page.waitForTimeout(200)

    // Tab forward from the tab strip, via the real keyboard, until the
    // panel itself is focused. Real Tab presses (rather than a scripted
    // .focus() call) are what actually drive :focus-visible.
    let reached = false
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press('Tab')
      reached = await page.evaluate((id) => document.activeElement?.id === id, panelId)
    }
    expect(reached).toBe(true)

    const style = await page.evaluate((id) => {
      const el = document.getElementById(id)!
      const s = getComputedStyle(el)
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow }
    }, panelId)
    const suppressed = style.outlineStyle === 'none' || parseFloat(style.outlineWidth) === 0
    const hasReplacement = style.boxShadow !== 'none'
    if (suppressed && !hasReplacement) bad.push({ panelId, ...style })
  }
  expect(bad).toEqual([])
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
    // overflow-x-hidden (see Layout.tsx), which is the boundary that actually
    // clips a label's paint, well before the label's own un-clipped
    // getBoundingClientRect() would reach the document edge. A label can be
    // visibly cut off inside its card while this measurement still says it
    // fits. ChartFigure's role="img" wrapper sets no overflow itself, so it
    // clips nothing, but it is still the right frame to measure against: it
    // is the chart's own card, and staying inside your own card is the
    // property this check wants. Fall back to the nearest ancestor whose
    // overflow-x is not visible for any chart not wrapped in ChartFigure
    // (main, ultimately, which is where actual clipping happens).
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
      const r = t.getBoundingClientRect()
      if (r.width === 0) continue
      const frame = findFrame(t)
      if (!frame) {
        // No role="img" ancestor and no ancestor that clips overflow-x: this
        // text has nothing to be measured against. That is itself a defect
        // (a chart rendered somewhere, e.g. a portal, this check cannot see),
        // not a reason to skip it, so it fails loud instead of being dropped.
        out.push({
          txt: t.textContent,
          left: Math.round(r.left),
          right: Math.round(r.right),
          frameLeft: NaN,
          frameRight: NaN,
        })
        continue
      }
      const f = frame.getBoundingClientRect()
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

test('money axes are formatted, not raw digits', async ({ page }) => {
  await page.goto('/#/planner/mortgage')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1200)
  // Recharts renders tick labels in a separate z-index layer, not nested
  // under .recharts-yAxis (that group holds only the axis line and tick
  // marks), so the label text has to be found via its own tick-labels group.
  const ticks = await page.evaluate(() =>
    [...document.querySelectorAll('.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value')]
      .map((t) => (t.textContent || '').trim())
      .filter(Boolean),
  )
  expect(ticks.length).toBeGreaterThan(1)
  // "600000" is the defect. Every money tick should carry a currency symbol.
  expect(ticks.every((t) => t.startsWith('$'))).toBe(true)
})

// Task 11's grep sweep wrapped every ResponsiveContainer in the app (16
// files) in ChartFigure. This guard reaches every one of those files that
// the app's own navigation can put on screen with seeded data alone, so a
// later change that strips ChartFigure off any of them gets caught here
// instead of by a screen reader user. Each route below is commented with
// which of the 16 files it exercises.
//
// Left out on purpose: ReportAllocations, ReportContributors, and
// ReportPerformance (src/components/investments/report/). All three render
// only inside PortfolioReport, which itself renders nothing until a
// PortfolioAnalyst CSV has been uploaded and the report section has been
// expanded by click. That is exactly the kind of "needs an existing
// analysis, a generated report" state this guard is not supposed to
// contort itself to reach. They stay uncovered here.
const CHART_ROUTES: { path: string; afterNav?: (page: Page) => Promise<void> }[] = [
  // MortgageCalculator (AreaChart)
  { path: '#/planner/mortgage' },
  // CompHeroWidget's annualized Pie (its default view)
  { path: '#/compensation' },
  // CompHeroWidget's monthly Bar (the other half of its view toggle) and
  // EquityVestingWidget's ComposedChart, both on the same route.
  {
    path: '#/compensation',
    afterNav: async (page) => {
      await page.getByRole('button', { name: 'Monthly Cash Flow View' }).click()
    },
  },
  // NetWorthTrendWidget (AreaChart). The seeded account history is
  // deliberately empty (see e2e/seed.ts) so every other guard starts from
  // its empty state; this widget needs 2+ points to render a chart at all,
  // so this test overrides just its own page with two points before the
  // loop below, the same way e2e/offline.spec.ts already does for the same
  // reason.
  { path: '' },
  // CashFlowWidget (Sankey) and SavingsRateWidget (Area trend + Bar split),
  // both on the Budgeting Overview tab, which is the default with no
  // ?tab= param.
  { path: '#/budget' },
  // CategoryTrendsWidget (one sparkline LineChart per category), behind the
  // Budgeting Insights tab.
  {
    path: '#/budget',
    afterNav: async (page) => {
      await page.getByRole('tab', { name: 'Insights' }).click()
    },
  },
  // AllocationChart (Pie), behind the Investments Portfolio tab.
  {
    path: '#/investments',
    afterNav: async (page) => {
      await page.getByRole('tab', { name: 'Portfolio' }).click()
    },
  },
  // CompoundInterestCalculator (Area)
  { path: '#/planner/compound-interest' },
  // DebtPayoffCalculator (Line)
  { path: '#/planner/debt-payoff' },
  // RentVsBuyCalculator (Line)
  { path: '#/planner/rent-vs-buy' },
  // ForecastChart and MonteCarloSection (both ComposedChart), both render
  // unconditionally on the Forecaster tool with no input required.
  { path: '#/planner/forecaster' },
]

test('every chart has an accessible name', async ({ page }) => {
  await page.addInitScript(() => {
    const raw = window.localStorage.getItem('accounts-storage')
    if (!raw) return
    const parsed = JSON.parse(raw)
    parsed.state.history = [
      { date: '2026-06-01', value: 550000 },
      { date: '2026-08-01', value: 572000 },
    ]
    window.localStorage.setItem('accounts-storage', JSON.stringify(parsed))
  })

  const unnamed: { route: string; count: number }[] = []
  // Counts every rendered chart regardless of naming, so a route that
  // renders zero charts at all (a selector typo, a seed regression, a route
  // that stopped rendering its chart) fails loud here instead of quietly
  // matching "zero unnamed" the same way a fully-named route would.
  const wrapped: { route: string; count: number }[] = []
  for (const route of CHART_ROUTES) {
    await page.goto(`/${route.path}`)
    await page.waitForLoadState('networkidle')
    if (route.afterNav) await route.afterNav(page)
    await page.waitForTimeout(1000)
    const counts = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('.recharts-wrapper')].filter(
        (w) => w.getBoundingClientRect().width > 0,
      )
      return {
        total: visible.length,
        unnamed: visible.filter((w) => !w.closest('[role="img"][aria-label]')).length,
      }
    })
    if (counts.unnamed > 0) unnamed.push({ route: route.path || '/', count: counts.unnamed })
    wrapped.push({ route: route.path || '/', count: counts.total })
  }
  expect(unnamed).toEqual([])
  expect(wrapped.filter((w) => w.count === 0)).toEqual([])
})

test('no element inside a chart figure is focusable', async ({ page }) => {
  await page.addInitScript(() => {
    const raw = window.localStorage.getItem('accounts-storage')
    if (!raw) return
    const parsed = JSON.parse(raw)
    parsed.state.history = [
      { date: '2026-06-01', value: 550000 },
      { date: '2026-08-01', value: 572000 },
    ]
    window.localStorage.setItem('accounts-storage', JSON.stringify(parsed))
  })

  // ChartFigure sets role="img", which prunes the subtree from the
  // accessibility tree: `label` on the wrapper is the only thing a screen
  // reader is meant to see. Recharts 3 defaults accessibilityLayer to true,
  // which renders the chart's own <svg> (and, for Pie, its sector group)
  // with tabIndex={0}: a keyboard user tabs onto something a screen reader
  // never announces. No element inside a role="img" chart wrapper may be
  // focusable, full stop.
  const found: { route: string; tag: string; role: string | null }[] = []
  for (const route of CHART_ROUTES) {
    await page.goto(`/${route.path}`)
    await page.waitForLoadState('networkidle')
    if (route.afterNav) await route.afterNav(page)
    await page.waitForTimeout(1000)
    const focusable = await page.evaluate(() =>
      [...document.querySelectorAll('[role="img"]')].flatMap((figure) =>
        [...figure.querySelectorAll('*')]
          .filter((el) => el.getBoundingClientRect().width > 0)
          .filter((el) => {
            if (el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1') return true
            return ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
          })
          .map((el) => ({ tag: el.tagName, role: el.getAttribute('role') })),
      ),
    )
    for (const f of focusable) found.push({ route: route.path || '/', ...f })
  }
  expect(found).toEqual([])
})

test('data tables carry header semantics', async ({ page }) => {
  for (const [hash, tabName] of [['#/budget', 'Transactions'], ['#/investments', 'Portfolio']] as const) {
    await page.goto(`/${hash}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: tabName }).click()
    await page.waitForTimeout(600)
    const problems = await page.evaluate(() =>
      [...document.querySelectorAll('table')].map((t) => ({
        caption: !!t.querySelector('caption'),
        headersWithoutScope: [...t.querySelectorAll('thead th')].filter((th) => !th.getAttribute('scope')).length,
      })).filter((r) => !r.caption || r.headersWithoutScope > 0),
    )
    expect(problems).toEqual([])
  }
})

test('the transaction table can be sorted from the keyboard', async ({ page }) => {
  await page.goto('/#/budget?tab=transactions')
  await page.waitForLoadState('networkidle')
  const amount = page.getByRole('button', { name: /sort by amount/i })
  await amount.click()
  await expect(page.locator('th[aria-sort]')).toHaveCount(1)
  await expect(page.locator('th[aria-sort]')).toHaveAttribute('aria-sort', /ascending|descending/)
})

test('every scrollable region is reachable from the keyboard', async ({ page }) => {
  for (const hash of ['', '#/budget', '#/investments']) {
    await page.goto(`/${hash}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    const unreachable = await page.evaluate(() =>
      [...document.querySelectorAll('*')]
        .filter((el) => {
          const s = getComputedStyle(el)
          if (!['auto', 'scroll'].includes(s.overflowY)) return false
          if (el.scrollHeight <= el.clientHeight + 4) return false
          if (el.hasAttribute('tabindex')) return false
          // A region containing its own focusable content is already reachable.
          return !el.querySelector('a[href], button, input, select, textarea, [tabindex]')
        })
        .map((el) => (el.className + '').slice(0, 60)),
    )
    expect(unreachable).toEqual([])
  }
})

test('state toggles announce their state instead of spelling it in the label', async ({ page }) => {
  await page.goto('/#/compensation')
  await page.waitForLoadState('networkidle')
  const labelled = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim())
      .filter((t) => /:\s*(ON|OFF)\b/i.test(t) || /\b(On|Off)$/.test(t)),
  )
  expect(labelled).toEqual([])

  const cad = page.getByRole('button', { name: /convert to cad/i })
  await expect(cad).toHaveAttribute('aria-pressed', 'false')
  await cad.click()
  await expect(cad).toHaveAttribute('aria-pressed', 'true')
})

test('the destructive transaction action says what it destroys', async ({ page }) => {
  await page.goto('/#/budget?tab=transactions')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: 'Delete all transactions' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear All' })).toHaveCount(0)
})

test('the Setup tab shows its content without a hunt', async ({ page }) => {
  await page.goto('/#/budget?tab=setup')
  await page.waitForLoadState('networkidle')
  // The budget paradigm picker is the point of this tab. It must be on screen,
  // not behind a chevron with no affordance.
  await expect(page.getByRole('button', { name: /budget setup/i })).toHaveAttribute('aria-expanded', 'true')
})

test('the Planner grid keeps one column count down the page', async ({ page }) => {
  await page.goto('/#/planner')
  await page.waitForLoadState('networkidle')
  // Every full row must use the same column count, so every card that is not
  // alone on a short final row must have the same width. Before the fix, the
  // two-tool sections rendered 2 columns and the three-tool sections rendered
  // 3, so card widths differed by roughly 200px halfway down the page.
  const widths = await page.evaluate(() =>
    [...document.querySelectorAll('section > div.grid')].map((g) => ({
      cols: getComputedStyle(g).gridTemplateColumns.split(' ').length,
      cardWidths: [...g.querySelectorAll(':scope > a')].map((a) => Math.round(a.getBoundingClientRect().width)),
    })),
  )
  expect(widths.length).toBeGreaterThan(2)
  // Every section must agree with every other section at whatever width the
  // page is being viewed at. The count itself is allowed to step with the
  // viewport, so this pins agreement rather than a specific number: pinning 3
  // would force 133px cards onto a 768px tablet.
  const colCounts = new Set(widths.map((w) => w.cols))
  expect(colCounts.size).toBe(1)
  const allCardWidths = new Set(widths.flatMap((w) => w.cardWidths))
  expect(allCardWidths.size).toBe(1)
})
