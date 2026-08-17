import { test, expect } from '@playwright/test'

const DISCLAIMER_ACK_KEY = 'ledger-disclaimer-ack'

// Acknowledge the disclaimer before first paint so this spec starts on the app.
test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, new Date().toISOString())
  }, DISCLAIMER_ACK_KEY)
})

// Regression guard for the offline-blank-page bug: the PWA's precache
// deliberately excludes the recharts chart chunk (fetched on demand and
// cached after first use), but the entry point used to statically import
// that chunk via the eager Dashboard route's NetWorthTrendWidget. A
// first-time visitor who installed the PWA and went offline before a second
// online visit would see a blank page, because the entry needed the
// uncached chart chunk synchronously. NetWorthTrendWidget is now lazy so the
// chart chunk is only ever fetched once the widget actually mounts.
test('dashboard renders after going offline once the service worker is active', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()

  // Wait for the service worker to finish installing and take control so the
  // precached assets are actually served from the cache on the next load.
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false
    const registration = await navigator.serviceWorker.ready
    return !!registration.active
  }, { timeout: 30_000 })

  // A reload while still online lets an already-installed worker take
  // control of this page (workbox's default is not to control the page that
  // triggered the initial install).
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()

  await context.setOffline(false)
})
