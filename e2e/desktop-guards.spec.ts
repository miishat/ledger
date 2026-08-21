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
