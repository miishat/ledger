import { test, expect } from '@playwright/test'
import { seedApp } from './seed'

test.beforeEach(async ({ page }) => { await seedApp(page) })

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
