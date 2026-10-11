import { test, expect, type Page, type Locator } from '@playwright/test'
import { defaultPrimaryPackage } from '../src/store/useCompensationStore'
import type { CompensationPackage } from '../src/store/useCompensationStore'
import { createMatchingContract, createRetirementScenario, createSharedTaxProfile, createWorkplacePlan } from '../src/utils/finance/retirementTypes'
const ready = { schemaVersion: 1 as const, review: { status: 'ready' as const, issues: [] } }
const contract = createMatchingContract({ ...createWorkplacePlan(), name: 'Example RRSP', withdrawalRestriction: 'restricted' })
contract.employee.value = 5000
contract.tiers = [{ lowerPercent: 0, upperPercent: 6, matchRatio: 1 }]
const pkg = { ...defaultPrimaryPackage, baseSalary: 100000, rsuGrants: [], retirement: { ...ready, contracts: [contract] } }
const scenario = { ...createRetirementScenario(), cashEmploymentIncome: 80000, personalRrsp: 1234.56, personalFhsa: 1000, workplacePlans: [{ ...createWorkplacePlan('dc-rpp', 'existing'), name: 'Old Pension', employeeContribution: 3000, employerContribution: 2000 }] }
const profile = { ...createSharedTaxProfile(), rrspDeductionLimit: { state: 'known' as const, value: 25000, sourceYear: 2026 }, rrspContributionRoom: { state: 'known' as const, value: 20000, sourceYear: 2026 } }
async function seed(page: Page, theme = 'luxury', primary: CompensationPackage = pkg, fx = false) {
 await page.clock.install({ time: new Date('2026-10-11T12:00:00Z') })
 await page.route('https://**/*', route => route.abort())
 await page.addInitScript(({ primary, scenario, profile, theme, fx }) => {
  if (localStorage.getItem('retirement-test-seeded')) return
  localStorage.setItem('retirement-test-seeded', 'yes')
  localStorage.setItem('ledger-disclaimer-ack', '2026-10-11T12:00:00Z')
  localStorage.setItem('financial-dashboard-theme', JSON.stringify({ state: { theme }, version: 0 }))
  localStorage.setItem('ledger-compensation', JSON.stringify({ state: { primaryPackage: primary, comparePackage: { ...primary, id: 'compare', name: 'Saved Compare', baseSalary: 110000, retirement: { schemaVersion: 1, contracts: [], review: { status: 'ready', issues: [] } } }, compareMode: false, timeMode: 'current-year', useCadConversion: false, showAfterTax: false, includePersonalDeductions: false }, version: 2 }))
  localStorage.setItem('ledger-planner', JSON.stringify({ state: { inputs: {}, sharedTaxProfile: profile, salaryRetirementScenario: scenario }, version: 2 }))
  if (fx) localStorage.setItem('ledger-market-data', JSON.stringify({ state: { quotes: {}, historical: {}, fx: {}, overrides: { 'USD-CAD@2026-10-11': 1.35 } }, version: 1 }))
 }, { primary, scenario, profile, theme, fx })
}
async function step(scope: Locator | Page, name: string) { await scope.getByRole('button', { name: new RegExp(`^[1-5]\\s*${name}`) }).click() }
async function stored(page: Page, key: string) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state, key) }
async function noOverflow(page: Page) {
 expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width)
 expect(await page.locator('main').evaluate(main => [...main.querySelectorAll<HTMLElement>('input,select,button,.retirement-plan-card,.retirement-summary-card')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > innerWidth + 1) }).map(el => el.outerHTML.slice(0, 100)))).toEqual([])
}
test('matching participation updates exact employer funding, cap and saved terms', async ({ page }) => {
 await seed(page); await page.goto('./#/compensation')
 const workspace = page.getByRole('region', { name: 'Compensation Benefits Workspace' })
 await expect(workspace.locator('[data-key-figure]')).toContainText('$105,000')
 await step(workspace, 'Workplace Plan')
 await workspace.getByLabel('Employee Annual Contribution', { exact: true }).fill('3000')
 await expect(workspace.locator('[data-key-figure]')).toContainText('$103,000')
 await step(workspace, 'Employer Funding')
 await workspace.getByLabel('No Annual Cap', { exact: true }).uncheck()
 await expect(workspace.locator('[data-key-figure]')).toContainText('$100,000')
 await workspace.getByLabel('Annual Employer Cap', { exact: true }).fill('2000')
 await expect(workspace.locator('[data-key-figure]')).toContainText('$102,000')
 await page.reload(); await step(workspace, 'Workplace Plan')
 await expect(workspace.getByLabel('Employee Annual Contribution', { exact: true })).toHaveValue('3000')
 expect((await stored(page, 'ledger-compensation')).primaryPackage.retirement.contracts[0].employerAnnualCap).toBe(2000)
})
test('transfer cancel and keep preserve saved rows, replace reconciles cash, personal inclusion and edited provenance', async ({ page }) => {
 await seed(page); await page.goto('./#/compensation')
 await page.getByRole('button', { name: 'After-Tax', exact: true }).click()
 const before = await stored(page, 'ledger-planner')
 const transfer = page.getByRole('button', { name: 'Full breakdown in Salary & Tax' })
 await transfer.click(); await page.getByRole('button', { name: 'Cancel', exact: true }).click()
 expect(await stored(page, 'ledger-planner')).toEqual(before)
 await transfer.click(); await page.getByRole('button', { name: 'Keep Existing', exact: true }).click()
 await expect(page.getByLabel('Gross Annual Income', { exact: true })).toHaveValue('80000')
 expect((await stored(page, 'ledger-planner')).salaryRetirementScenario.workplacePlans[0].name).toBe('Old Pension')
 await page.goto('./#/compensation'); await transfer.click(); await page.getByRole('button', { name: 'Replace Scenario', exact: true }).click()
 await expect(page.getByLabel('Gross Annual Income', { exact: true })).toHaveValue('100000')
 await expect(page.getByLabel('Personal RRSP Contribution', { exact: true })).toHaveValue('1234.56')
 await expect(page.getByText('Excluded From This Scenario', { exact: true }).first()).toBeVisible()
 await expect(page.locator('section[data-key-figure]')).toContainText('$70,714')
 const replaced = await stored(page, 'ledger-planner')
 expect(replaced.sharedTaxProfile).toEqual(profile)
 expect(replaced.salaryRetirementScenario.workplacePlans).toHaveLength(1)
 expect(replaced.salaryRetirementScenario.workplacePlans[0].name).toBe('Example RRSP')
 await page.getByLabel('Gross Annual Income', { exact: true }).fill('90000')
 await step(page, 'Review'); await expect(page.getByText('Edited After Transfer', { exact: true })).toBeVisible()
 await page.reload(); await step(page, 'Review'); await expect(page.getByText('Edited After Transfer', { exact: true })).toBeVisible()
 await page.goto('./#/compensation'); await page.getByLabel('Include Personal Deductions', { exact: true }).check()
 const cash = await page.locator('section[data-key-figure]').innerText()
 await transfer.click(); await page.getByRole('button', { name: 'Replace Scenario', exact: true }).click()
 await expect(page.getByLabel('Include Personal Deductions', { exact: true })).toBeChecked()
 const salaryCash = await page.locator('section[data-key-figure]').innerText()
 expect(salaryCash.match(/\$[\d,]+/g)?.[0]).toBe(cash.match(/Cash After Contributions\s*(\$[\d,]+)/)?.[1])
 await step(page, 'CRA Limits'); await page.getByLabel('CRA RRSP Deduction Limit', { exact: true }).fill('0')
 expect((await stored(page, 'ledger-planner')).sharedTaxProfile.rrspDeductionLimit.value).toBe(0)
 await page.goto('./#/compensation'); await step(page.getByRole('region', { name: 'Compensation Benefits Workspace' }), 'CRA Limits')
 await expect(page.getByLabel('CRA RRSP Deduction Limit', { exact: true })).toHaveValue('0')
})
test('comparison names equity controls, saves independent plan, survives toggle and reload', async ({ page }) => {
 await seed(page); await page.goto('./#/compensation'); await page.getByRole('button', { name: 'Compare Another Offer' }).click()
 const compare = page.locator('.themed-card').filter({ has: page.getByRole('heading', { name: 'Offer Comparison', exact: true }) }).last()
 for (const name of ['Grant Name', 'Number of Shares', 'Grant Price ($)', 'Grant Start Date', 'Vesting', 'Frequency']) await expect(compare.getByLabel(name, { exact: true })).toBeVisible()
 await step(compare, 'Workplace Plan'); await compare.getByRole('button', { name: 'Add Workplace Plan' }).click()
 await compare.getByLabel('Employee Annual Contribution', { exact: true }).fill('3000.12345')
 await compare.getByRole('button', { name: 'Calculate Comparison' }).click()
 expect((await stored(page, 'ledger-compensation')).primaryPackage.retirement.contracts[0].employee.value).toBe(5000)
 await page.reload(); await step(compare, 'Workplace Plan')
 await expect(compare.getByLabel('Employee Annual Contribution', { exact: true })).toHaveValue('3000.12345')
 await compare.getByRole('button', { name: 'After-Tax', exact: true }).click()
 await expect(compare.getByRole('region', { name: 'Offer Comparison Results' })).toContainText('Cash After Contributions')
 for (const width of [320, 360, 390]) {
  await page.setViewportSize({ width, height: 800 })
  for (const pane of ['Pay & Deductions', 'Workplace Plan', 'Employer Funding', 'CRA Limits', 'Review']) {
   await step(compare, pane); await noOverflow(page)
  }
 }
})
test('file restore returns exact primary, comparison and shared capacity through the actual settings boundary', async ({ page }) => {
 await seed(page); await page.goto('./#/compensation')
 const savedCompensation = await page.evaluate(() => JSON.parse(localStorage.getItem('ledger-compensation')!))
 const savedPlanner = await page.evaluate(() => JSON.parse(localStorage.getItem('ledger-planner')!))
 await page.getByLabel('Annual Base Salary (CAD)', { exact: true }).fill('99999')
 await page.getByRole('button', { name: 'Settings', exact: true }).click()
 await page.getByLabel('Import backup', { exact: true }).setInputFiles({ name: 'retirement.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'ledger', version: 2, exportedAt: '2026-10-11T12:00:00Z', data: { 'ledger-compensation': savedCompensation, 'ledger-planner': savedPlanner } })) })
 await expect(page.getByLabel('Annual Base Salary (CAD)', { exact: true })).toHaveValue('100000')
 const restored = await stored(page, 'ledger-compensation')
 expect(restored.primaryPackage.retirement).toEqual(savedCompensation.state.primaryPackage.retirement)
 expect(restored.comparePackage).toEqual(savedCompensation.state.comparePackage)
 expect((await stored(page, 'ledger-planner')).sharedTaxProfile).toEqual(profile)
 await page.goto('./#/planner/salary-tax'); await expect(page.getByLabel('Gross Annual Income', { exact: true })).toHaveValue('80000')
})
test('deferred Settings opens from the keyboard and restores trigger focus after Escape', async ({ page }) => {
 await seed(page); await page.goto('./#/compensation')
 const trigger = page.getByRole('button', { name: 'Settings', exact: true })
 await trigger.focus(); await page.keyboard.press('Enter')
 const dialog = page.getByRole('dialog', { name: 'Settings', exact: true })
 await expect(dialog).toBeVisible()
 await expect(dialog.getByRole('button', { name: 'Export data', exact: true })).toBeVisible()
 expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true)
 await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused()
})
test('Escape cancels Settings while its deferred controls are still loading', async ({ page }) => {
 let release!: () => void
 let requested!: () => void
 const requestSeen = new Promise<void>(resolve => { requested = resolve })
 const releaseChunk = new Promise<void>(resolve => { release = resolve })
 await page.route('**/assets/SettingsSheet-*.js', async route => { requested(); await releaseChunk; await route.continue() })
 await seed(page); await page.goto('./#/compensation')
 const trigger = page.getByRole('button', { name: 'Settings', exact: true })
 await trigger.click(); await requestSeen; await page.keyboard.press('Escape'); release()
 await page.getByRole('link', { name: 'Investments', exact: true }).first().click()
 await expect(page.getByRole('heading', { name: 'Investments', level: 1 })).toBeVisible()
 await expect(page.getByRole('dialog', { name: 'Settings', exact: true })).not.toBeVisible()
})
test('October Next 1 Year and January stale-table scenarios retain explicit 2026 rules and source capacity', async ({ page }) => {
 await seed(page); await page.goto('./#/compensation')
 await page.getByRole('button', { name: 'Next 1 Year', exact: true }).click()
 await step(page.getByRole('region', { name: 'Compensation Benefits Workspace' }), 'Review')
 await expect(page.getByText(/Annualized Using 2026 Rules/).first()).toBeVisible()
 // A second tab shares saved inputs but starts with January's clock, just
 // as returning in a later year does, without reinstalling October's clock.
 const january = await page.context().newPage()
 await january.clock.install({ time: new Date('2027-01-11T12:00:00Z') })
 await january.route('https://**/*', route => route.abort())
 await january.goto('./#/compensation')
 expect(await january.evaluate(() => new Date().getFullYear())).toBe(2027)
 await expect(january.getByText(/These are 2026 rates/).first()).toBeVisible()
 await step(january.getByRole('region', { name: 'Compensation Benefits Workspace' }), 'CRA Limits')
 await expect(january.getByLabel('Deduction Limit Source Year', { exact: true })).toHaveValue('2026')
 expect((await stored(january, 'ledger-planner')).sharedTaxProfile.rrspDeductionLimit.value).toBe(25000)
 await january.close()
})
test('unknown restriction branches survive transfer and employer/restriction edits rebuild the saved calculation', async ({ page }) => {
 const unknown = { ...pkg, baseSalary: 50000, retirement: { ...ready, contracts: [{ ...contract, employee: { mode: 'dollars' as const, value: 0 }, tiers: [], unconditionalEmployer: { mode: 'dollars' as const, value: 2500 }, plan: { ...contract.plan, withdrawalRestriction: 'unknown' as const } }] } }
 await seed(page, 'luxury', unknown); await page.goto('./#/compensation')
 await expect(page.locator('section[data-key-figure]')).toContainText(' to ')
 await page.getByRole('button', { name: 'After-Tax', exact: true }).click()
 await page.getByRole('button', { name: 'Full breakdown in Salary & Tax' }).click()
 await expect(page.getByRole('dialog', { name: 'Replace Salary & Tax Scenario' })).toContainText('All 2 withdrawal-treatment combinations')
 await page.getByRole('button', { name: 'Replace Scenario', exact: true }).click()
 await expect(page.locator('section[data-key-figure]')).toContainText(' to ')
 await step(page, 'Employer Funding'); await page.getByLabel('Employer Annual Contribution', { exact: true }).fill('3000')
 await step(page, 'Workplace Plan'); await page.getByLabel('Withdrawal Restrictions', { exact: true }).selectOption('restricted')
 await step(page, 'Review'); await expect(page.getByText('Edited After Transfer', { exact: true })).toBeVisible()
 await expect(page.locator('section[data-key-figure]')).not.toContainText(' to ')
 const saved = (await stored(page, 'ledger-planner')).salaryRetirementScenario
 expect(saved.workplacePlans[0].employerContribution).toBe(3000)
 expect(saved.workplacePlans[0].withdrawalRestriction).toBe('restricted')
})
test('mixed CAD salary, USD RSU and ESPP cancel and keep preserve full saved data before exact replacement with both personal selections', async ({ page }) => {
 const mixed: CompensationPackage = { ...pkg, cashBonusPercent: 10, companyCurrentPrice: 100, esppContributionPercent: 5, esppLockedInPrice: 80, rsuGrants: [{ id: 'grant', grantName: 'Annual', grantShares: 120, grantPrice: 90, grantStartDate: '2026-01-01', vestingSchedule: { preset: 'custom', totalVestMonths: 12, cliffMonths: 0, frequency: 'monthly' } }] }
 await seed(page, 'luxury', mixed, true); await page.goto('./#/compensation')
 await page.getByRole('button', { name: 'After-Tax', exact: true }).click()
 for (const include of [false, true]) {
  await page.getByLabel('Include Personal Deductions', { exact: true }).setChecked(include)
  const summary = await page.locator('section[data-key-figure]').innerText()
  const expectedCash = summary.match(/Cash After Contributions\s*(\$[\d,]+)/)![1]
  const plannerBefore = await stored(page, 'ledger-planner')
  const compensationBefore = await stored(page, 'ledger-compensation')
  const transfer = page.getByRole('button', { name: 'Full breakdown in Salary & Tax' })
  await transfer.click()
  const review = page.getByRole('dialog', { name: 'Replace Salary & Tax Scenario' })
  await expect(review).toContainText('CAD Per USD Stock Unit: 1.35')
  await expect(review).toContainText('Realized RSU Cash:')
  // Reopening creates a fresh timestamp; every financial term, classification,
  // assumption and saved/shared detail must otherwise remain identical.
  const proposalDetails = review.locator('h2,h3,h4,p').filter({ hasNotText: 'Snapshot Time:' })
  const proposal = await proposalDetails.allInnerTexts()
  expect(await stored(page, 'ledger-planner')).toEqual(plannerBefore)
  expect(await stored(page, 'ledger-compensation')).toEqual(compensationBefore)
  await review.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(review).toBeHidden()
  await expect(page).toHaveURL(/#\/compensation$/)
  expect(await stored(page, 'ledger-planner')).toEqual(plannerBefore)
  expect(await stored(page, 'ledger-compensation')).toEqual(compensationBefore)
  await transfer.click()
  await expect(proposalDetails).toHaveText(proposal, { useInnerText: true })
  await review.getByRole('button', { name: 'Keep Existing', exact: true }).click()
  await expect(page.getByLabel('Gross Annual Income', { exact: true })).toHaveValue(String(plannerBefore.salaryRetirementScenario.cashEmploymentIncome))
  expect(await stored(page, 'ledger-planner')).toEqual(plannerBefore)
  expect(await stored(page, 'ledger-compensation')).toEqual(compensationBefore)
  await page.goto('./#/compensation')
  await expect(page.locator('section[data-key-figure]')).toHaveText(summary, { useInnerText: true })
  await transfer.click()
  await expect(proposalDetails).toHaveText(proposal, { useInnerText: true })
  await page.getByRole('button', { name: 'Replace Scenario', exact: true }).click()
  await expect(page.locator('section[data-key-figure] .retirement-summary-value')).toHaveText(expectedCash)
  const saved = (await stored(page, 'ledger-planner')).salaryRetirementScenario
  const breakdown = saved.provenance.sourceBreakdown
  expect(saved.cashEmploymentIncome).toBeCloseTo(breakdown.salary + breakdown.cashBonus + breakdown.realizedEquity + breakdown.esppGain, 8)
  expect(saved.workplacePlans[0].employerContribution).toBe(5000)
  expect(saved.includePersonalDeductions).toBe(include)
  await page.goto('./#/compensation')
 }
 await page.goto('./#/planner/salary-tax'); await page.getByLabel('Gross Annual Income', { exact: true }).fill('95000')
 await step(page, 'Review'); await expect(page.getByText('Edited After Transfer', { exact: true })).toBeVisible()
 await expect(page.getByText('Cash Employment Pay', { exact: true }).locator('..')).toContainText('$95,000')
})
test('unresolved legacy matching is retained and missing FX blocks precise transfer', async ({ page }) => {
 await seed(page, 'luxury', { ...pkg, retirement: undefined, rrspMatchPercent: 5, rrspMatchCap: 4000 })
 await page.goto('./#/compensation'); await expect(page.locator('section[data-key-figure]')).toContainText('$4,000')
 await page.getByRole('button', { name: 'After-Tax', exact: true }).click()
 await expect(page.getByRole('button', { name: 'Full breakdown in Salary & Tax' })).toBeDisabled()
 await expect(page.locator('main')).toContainText('Benefits Need Review')
 for (const height of [640, 700]) {
  await page.setViewportSize({ width: 320, height })
  const figure = await page.locator('section[data-key-figure]').boundingBox()
  expect(figure!.y + figure!.height).toBeLessThanOrEqual(height - 60)
  await expect(page.getByText('Legacy Benefits Need Review', { exact: true })).toBeVisible()
 }
})
test('unconverted USD equity keeps cash salary visible while total tax and transfer need conversion', async ({ page }) => {
 await seed(page, 'luxury', { ...pkg, esppContributionPercent: 10, esppLockedInPrice: 80, companyCurrentPrice: 100 })
 await page.goto('./#/compensation'); await expect(page.locator('section[data-key-figure]')).toContainText('Conversion Needed')
 await expect(page.locator('section[data-key-figure]')).toContainText('Cash Salary (CAD): $100,000')
 await page.getByRole('button', { name: 'After-Tax', exact: true }).click()
 await expect(page.getByRole('button', { name: 'Full breakdown in Salary & Tax' })).toBeDisabled()
})
for (const theme of ['geometric', 'tactical', 'luxury', 'aurora', 'glass', 'nouveau']) for (const route of ['compensation', 'planner/salary-tax']) {
 test(`${route} populated C1 cards and keyboard errors fit 320/360/390 in ${theme}`, async ({ page }) => {
  await seed(page, theme); await page.goto(`./#/${route}`)
  const scope = route === 'compensation' ? page.getByRole('region', { name: 'Compensation Benefits Workspace' }) : page.locator('main')
  for (const width of [320, 360, 390]) {
   await page.setViewportSize({ width, height: 800 })
   for (const pane of ['Pay & Deductions', 'Workplace Plan', 'Employer Funding', 'CRA Limits', 'Review']) { await step(scope, pane); await noOverflow(page) }
  }
  const workplaceStep = scope.getByRole('button', { name: /^[1-5]\s*Workplace Plan/ })
  await workplaceStep.focus(); await page.keyboard.press('Enter')
  await expect(workplaceStep).toHaveAttribute('aria-current', 'step')
  const input = scope.getByLabel('Employee Annual Contribution', { exact: true })
  await input.focus(); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type('-1'); await page.keyboard.press('Tab')
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  const errorId = await input.getAttribute('aria-describedby'); expect(errorId).toBeTruthy()
  await expect(page.locator(`[id="${errorId!.split(' ')[0]}"]`)).toBeVisible()
  await noOverflow(page)
  await input.fill('5000'); await page.keyboard.press('Tab'); await expect(input).not.toHaveAttribute('aria-invalid', 'true')
 })
}




