# Changelog

All notable changes to Ledger are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
pre-1.0 beta.

## [Unreleased]

## [0.7.4-beta] - 2026-07-22

### Added
- Budgeting: the Overview tab has a new Savings Rate widget showing what share of your income you kept over the trailing six months, with paired income and expense bars per month

### Changed
- Tooling: eslint now ignores the .claude tooling directory, so lint reports only real application issues

## [0.7.3-beta] - 2026-07-21

### Added
- Budgeting: categories can be budgeted annually instead of monthly; a /mo /yr toggle on the Setup tab lets you pick the cadence. Annual categories like vacations are tracked against calendar-year spend in their own Annual budgets section, with a set-aside pace line showing what you should have put aside by now, while still contributing one twelfth to each month's budget total
- Investments: the Portfolio tab now has an allocation donut above your holdings, with a toggle to group by holding, by account, or by currency
- Investments: holdings table columns are now sortable, each account shows a value and P/L subtotal, and each row has an allocation micro-bar

### Changed
- Investments: portfolio holdings now support every currency your broker reports, not just USD and CAD. Each currency is converted to CAD with its own live rate; a live quote in a different currency than your cost basis is converted correctly; and holdings whose currency has no available rate are shown in their own currency and clearly excluded from the CAD totals instead of being silently miscounted. You can set a holding's currency inline if an import got it wrong
- Investments: the PortfolioAnalyst report was reworked around a summary hero, allocation donuts, and a top contributors and detractors chart, and it is collapsed by default so it no longer stretches the page

### Fixed
- Compensation: converted stock prices now display to three decimals instead of overflowing their input box. Full precision is kept for the underlying calculations
- Investments: portfolio imports (both broker CSVs and PortfolioAnalyst reports) no longer store every foreign-currency position as Canadian dollars. A one-time notice flags holdings imported before this release so you can re-check their currency

## [0.7.2-beta] - 2026-07-19

### Added
- Budgeting: shared bills. Mark an expense as shared, set your share (50/33/25% quick buttons), and name who owes you; only your share counts in the budget. An Owed to Me widget tracks per-person balances with one-click settle-up, and income can be marked as a reimbursement so paybacks never inflate your income
- Budgeting: period picker on the Budgeting page (This month, Last month, Last 3/6/12 months, Year to date); Overview and Insights widgets aggregate over the chosen range, and the spending calendar becomes a month-by-month grid for multi-month periods
- Budgeting: Budget vs. Actual shows your total monthly budget with its own progress bar, plus an Unbudgeted spending row so money outside targeted categories is visible; the Setup tab shows the same total
- Budgeting: Clear All button on the triage inbox with a confirm dialog
- Investments: the Portfolio tab now recognizes IBKR PortfolioAnalyst report CSVs: key statistics, benchmark comparison chart and table, allocations by asset class/sector/region, performance by symbol, dividends and projected income, and fees, with an optional one-click holdings update from the report's open positions

### Changed
- Compensation: the USD to CAD conversion now shows where its rate came from (live, cached with date, or manual) and offers an inline manual-rate field; the app falls back to the most recent known rate instead of silently converting at 1.0 when the rate service is unreachable

### Fixed
- Investments: uploading an Activity Statement in the Options tab can no longer hang on "Parsing CSV(s)"; the upload reports how many rows were added or what went wrong
- Budgeting: Income Flow chart no longer clips category labels on the left side
- Clicking buttons and inputs no longer draws the browser's default white focus box in dark themes; keyboard navigation shows a themed accent ring instead
- Luxury theme: Save buttons and RSU preset buttons now use black text on the gold accent for readability

## [0.7.1-beta] - 2026-07-18

### Added
- Net-Worth / FIRE Forecaster chart now has a legend naming each series (Projected line, Conservative to Optimistic band, Contributed vs Growth areas, Actual history)
- Compensation: switching to Monthly Cash Flow View with After-Tax on shows a note explaining the bars stay gross (monthly withholding varies too much to estimate honestly)

### Changed
- Confirmation popups are now themed in-app dialogs instead of browser popups: replacing the Salary & Tax income from Compensation, clearing all transactions in Budgeting, and clearing wheel tracker data in Investments
- Forecaster: the comp event tax controls (after-tax toggle, marginal or manual rate) moved behind a small gear popover next to the Comp Events and Debt Drag toggles
- Budgeting: every paradigm description now fits on one line, and the 50/30/20 status bar spans the full width of its banner

### Fixed
- Forecaster: in Real (Today's Dollars) mode the conservative and optimistic scenario bands are now inflation-deflated like the projected line, so the projection no longer dips below its own conservative band

## [0.7.0-beta] - 2026-07-17

### Added
- Budget paradigms are now functional: pick Ledger Custom, Zero-Based, Target-Based, or the 50/30/20 Rule in Budget Setup and the Budgeting page enforces it with status banners (unassigned dollars, buffer health, or needs/wants/savings ratios)
- Zero-Based overspending shows a Cover button that moves budget from another category via a new reallocation dialog; the setup tab lists the month's reallocations with delete
- 50/30/20 mode adds Need / Want / Savings chips on expense groups to classify spending
- Compensation: a Gross / After-Tax toggle on the Total Compensation widget estimates take-home pay using the Salary & Tax calculator's math and your saved province, with net monthly and biweekly figures
- A "Full breakdown in Salary & Tax" link pre-fills the calculator with your total compensation (asking before replacing a different saved income)
- Net-Worth / FIRE Forecaster: goals and life events show their projected calendar date inside the list cards
- Forecaster comp events can be taxed: an After-Tax toggle applies your marginal rate (auto-detected with province, or a manual rate); RSU/ESPP treated as employment income

### Fixed
- PWA app icon now shows the new logo on fresh installs (icon files renamed so installs stop serving the cached old lightning icon; existing installs may need a reinstall)
- Forecaster: stacked Contributions vs Growth view now respects Real (Today's Dollars) mode; the "today" label stays anchored to the today line; y-axis uses compact labels ($1.5M instead of $1,500,000)
- Forecaster: Monte Carlo footnote sits inside its card instead of overflowing it

## [0.6.2-beta] - 2026-07-17

### Added
- New logo: an L that doubles as chart axes with a rising trend line. In the sidebar next to the wordmark (drawn in the active theme's accent), as the favicon, and in the app icons (gold on black)
- Budgeting: a Today button jumps back to the current month after paging away

### Changed
- Page headers now match the sidebar labels: Dashboard, Budgeting, Compensation (previously "Master Dashboard", "Budgeting Module", "Total Compensation Calculator")
- Planner and Compensation swapped nav icons: the calculator now marks the calculators page, Compensation gets a briefcase
- The search shortcut hint shows Ctrl K on Windows and ⌘K on Mac; the sidebar version number explains it opens What's New

### Fixed
- Negative net worth reads -$210,000.00 instead of $-210,000.00
- Budgeting month arrows no longer stick on the same month in timezones ahead of UTC

## [0.6.1-beta] - 2026-07-16

### Changed
- Settings popup reorganized into cards: Appearance, Market data (key status badge, setup guide collapsed behind "How to get a free key"), Backup, and a compact About footer
- Theme picker tiles now preview the app in each theme (header bar and sparkline in the theme's own colors)
- Sidebar: new Search button reveals the Ctrl/Cmd+K command palette, active page gets an accent bar, settings dock flattened to one row, "Command Center" tagline removed

## [0.6.0-beta] - 2026-07-16

### Added
- Options tab in Investments: wheel strategy tracker ported from the standalone tool — upload IBKR activity statement CSVs to see per-ticker premium collected, true breakeven, and live-price Net P/L (PDF export not carried over)
- Currency converter now supports USD, CAD, EUR, GBP, AUD, JPY, KRW, INR and BDT with From/To selectors (BDT via a fallback rate source, latest rates only)
- Settings hub: theme picker, market data key, backup and about consolidated into one sheet (gear in the sidebar dock / a new Settings tab on mobile)

### Changed
- Theme picker shows preview swatch cards for all themes
- Mortgage payment-frequency toggle moved beside the Payment/Affordability toggle
- 0.4.0 and 0.5.0 releases relabeled as betas

### Fixed
- Edit Compensation modal pre-fills the live stock price instead of a stale manual value
- Debt payoff rows no longer leave empty columns for credit cards, lines of credit and payment-mode loans
- Mobile: pages scroll fully clear of the bottom tab bar
- Planner date picker placeholder capitalization ("Select Date")

## [0.5.0-beta] - 2026-07-13

### Added
- Live stock prices via your own Alpha Vantage API key (free, 25 lookups a day); a new Market Data settings modal in the sidebar dock and mobile settings row lets you add and manage it. Quotes refresh automatically at most once every 4 hours (and when the app comes back online); the refresh button still updates on demand.

### Changed
- The "Estimates Only · Not Financial Advice" disclaimer link moved from the desktop sidebar into the What's New modal; mobile keeps its button.
- What's New modal now has a blurred backdrop.
- Em dashes removed app-wide, with wording adjusted case by case.

### Fixed
- Currency conversion rates work again: the Frankfurter API moved to api.frankfurter.dev/v1, and the old domain was silently breaking requests from the browser.

### Removed
- The Yahoo Finance provider, which never worked from a static site due to browser CORS restrictions.

## [0.4.0-beta] - 2026-07-11

### Added
- Debt Payoff: pick a debt type: Credit Card and Line of Credit minimums are calculated for you (3% of balance / interest-only, updated as the balance falls); Loans take either your known payment or your amortization term.
- Mortgage: Biweekly (Accelerated) payment toggle: see the per-paycheque amount, how many years sooner you're done, and the interest saved.
- "Check for Updates" button in What's New, plus an update check every time the app launches, so installed-app updates no longer depend on visiting the website.
- First-launch disclaimer and a persistent "Estimates Only · Not Financial Advice" link.

### Changed
- What's New shows only the latest version expanded; older releases are collapsible. The panel and tool info popovers are wider.
- One capitalization rule everywhere: labels, buttons, and headings are Title Case.
- Plan vs Actual: the card's add button follows the tab: "+ Position" on Plan, "+ Trade" on Actual.
- Mobile: theme selector and the version link sit on their own rows.

### Fixed
- Tool list and info popovers are opaque and readable in Glassmorphism and Aurora themes.
- New Analysis dialog no longer shakes while typing a ticker or exchange.
- Mobile pages no longer get cut off behind the bottom navigation bar.

## [0.3.0-beta] - 2026-07-10

### Added
- "New version available" toast: the app now tells you when an update is ready instead of silently serving an old build.
- Total Return in dollars (alongside %) in the investing Plan/Actual summary.
- Initial Investment vs Extra Investment split in the Actual tab, derived from your recorded trade dates.
- Income days now appear on the spending calendar as a green marker (they were previously invisible there).
- Separate income and expense categories, driven by your Budget Setup groups.
- What's New panel (this one!) and in-app version display.
- Two new Planner utilities: **Inflation Adjuster** (what today's dollars cost later, e.g. what your savings goal will really be worth when you reach it) and **Rate & Return Converter** (APR ⇄ APY across compounding frequencies, plus CAGR from any start/end value).

### Changed
- Planned Budget is now edited directly in the summary strip; the standalone input is gone.
- Numeric fields can be empty while you type, with no leading-zero (0100) glitch, and spinner arrows are removed.
- Income Flow chart sits beside Budget Progress on desktop instead of taking a full row.

### Fixed
- Dropdown menus are opaque and readable in the Aurora theme; the mobile bottom navigation is opaque in the Glass theme.
- Chart hover tooltips are readable in dark themes.
- The New Analysis dialog no longer shakes while typing.
- Budgeting page no longer scrolls sideways on mobile.

## [0.2.0-beta] - 2026-07-06

### Added
- Plan vs Actual tracking for investment analyses: planned budget with per-ticker allocation %, trade lots, swap what-if simulator.
- Upcoming Vests dashboard widget; spending calendar color legend.

### Changed
- Position cards collapse by default; new-analysis flow mirrors the plan table.
- Planner: Income & Tax moved above Debt & Housing; clearer info popups; Title Case labels app-wide.

### Fixed
- Net worth trend Y-axis starts at the data range instead of zero.
- Forecaster source labels; expenses widget $0 layout.

## [0.1.0-beta] - 2026-07-01

### Added
- Initial release: Dashboard, Budgeting (transactions, categories, insights), Investments, Planner tools, Compensation tracking.
- Five visual themes, PWA install/offline support, CSV import, local-first storage with backup/restore.
