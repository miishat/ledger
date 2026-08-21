import type { Page } from '@playwright/test'

/** One realistic dataset shared by every desktop guard, so a guard that only
 *  passes on an empty app cannot exist. Long account names are deliberate:
 *  they are what exposed the tablet row collapse. */
export async function seedApp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const ls = window.localStorage
    ls.setItem('ledger-disclaimer-ack', new Date().toISOString())

    ls.setItem('accounts-storage', JSON.stringify({
      state: {
        accounts: [
          { id: 'a1', name: 'Main Checking', value: 15230.44, type: 'bank' },
          { id: 'a2', name: 'EQ Bank High Interest Savings', value: 48210, type: 'bank' },
          { id: 'a3', name: 'Questrade TFSA', value: 96430.12, type: 'investment' },
          { id: 'a4', name: 'Mortgage - 12 Maplewood Crescent', value: 412500, type: 'debt' },
        ],
        history: [],
      },
    }))

    const holding = (ticker: string, quantity: number, avgCost: number, currency: string) =>
      ({ id: ticker, ticker, quantity, avgCost, currency, account: 'Questrade TFSA' })
    ls.setItem('ledger-portfolio', JSON.stringify({
      state: {
        holdings: [holding('VFV', 210, 98.4, 'CAD'), holding('AAPL', 60, 171.2, 'USD')],
        importedAt: new Date().toISOString(),
        currencyReviewPending: false,
      },
      version: 2,
    }))

    const now = new Date()
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    ls.setItem('ledger-budget', JSON.stringify({
      state: {
        categoryGroups: {
          'g-house': { id: 'g-house', name: 'Housing', kind: 'expense' },
          'g-inc': { id: 'g-inc', name: 'Income', kind: 'income' },
        },
        categories: {
          'c-rent': { id: 'c-rent', groupId: 'g-house', name: 'Rent', targetAmount: 2100 },
          'c-sal': { id: 'c-sal', groupId: 'g-inc', name: 'Salary', targetAmount: 0 },
        },
        transactions: {
          t1: { id: 't1', date: `${prefix}-01`, amount: 2100, description: 'Rent - 12 Maplewood Crescent', type: 'expense', categoryId: 'c-rent' },
          t2: { id: 't2', date: `${prefix}-15`, amount: 4820.55, description: 'Paycheque', type: 'income', categoryId: 'c-sal' },
          t3: { id: 't3', date: `${prefix}-18`, amount: 77.89, description: 'Metro', type: 'expense', categoryId: 'c-rent' },
        },
      },
      version: 3,
    }))

    ls.setItem('ledger-compensation', JSON.stringify({
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
}
