# Changelog

All notable changes to Ledger are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
pre-1.0 beta.

## [Unreleased]

## [0.4.0] - 2026-07-11

### Added
- Debt Payoff: pick a debt type — Credit Card and Line of Credit minimums are calculated for you (3% of balance / interest-only, updated as the balance falls); Loans take either your known payment or your amortization term.
- Mortgage: Biweekly (Accelerated) payment toggle — see the per-paycheque amount, how many years sooner you're done, and the interest saved.
- "Check for Updates" button in What's New, plus an update check every time the app launches — installed-app updates no longer depend on visiting the website.
- First-launch disclaimer and a persistent "Estimates Only — Not Financial Advice" link.

### Changed
- What's New shows only the latest version expanded; older releases are collapsible. The panel and tool info popovers are wider.
- One capitalization rule everywhere: labels, buttons, and headings are Title Case.
- Plan vs Actual: the card's add button follows the tab — "+ Position" on Plan, "+ Trade" on Actual.
- Mobile: theme selector and the version link sit on their own rows.

### Fixed
- Tool list and info popovers are opaque and readable in Glassmorphism and Aurora themes.
- New Analysis dialog no longer shakes while typing a ticker or exchange.
- Mobile pages no longer get cut off behind the bottom navigation bar.

## [0.3-beta] - 2026-07-10

### Added
- "New version available" toast — the app now tells you when an update is ready instead of silently serving an old build.
- Total Return in dollars (alongside %) in the investing Plan/Actual summary.
- Initial Investment vs Extra Investment split in the Actual tab, derived from your recorded trade dates.
- Income days now appear on the spending calendar as a green marker (they were previously invisible there).
- Separate income and expense categories, driven by your Budget Setup groups.
- What's New panel (this one!) and in-app version display.
- Two new Planner utilities: **Inflation Adjuster** (what today's dollars cost later — e.g., what your savings goal will really be worth when you reach it) and **Rate & Return Converter** (APR ⇄ APY across compounding frequencies, plus CAGR from any start/end value).

### Changed
- Planned Budget is now edited directly in the summary strip; the standalone input is gone.
- Numeric fields can be empty while you type — no more leading-zero (0100) glitch — and spinner arrows are removed.
- Income Flow chart sits beside Budget Progress on desktop instead of taking a full row.

### Fixed
- Dropdown menus are opaque and readable in the Aurora theme; the mobile bottom navigation is opaque in the Glass theme.
- Chart hover tooltips are readable in dark themes.
- The New Analysis dialog no longer shakes while typing.
- Budgeting page no longer scrolls sideways on mobile.

## [0.2-beta] - 2026-07-06

### Added
- Plan vs Actual tracking for investment analyses: planned budget with per-ticker allocation %, trade lots, swap what-if simulator.
- Upcoming Vests dashboard widget; spending calendar color legend.

### Changed
- Position cards collapse by default; new-analysis flow mirrors the plan table.
- Planner: Income & Tax moved above Debt & Housing; clearer info popups; Title Case labels app-wide.

### Fixed
- Net worth trend Y-axis starts at the data range instead of zero.
- Forecaster source labels; expenses widget $0 layout.

## [0.1-beta] - 2026-07-01

### Added
- Initial release: Dashboard, Budgeting (transactions, categories, insights), Investments, Planner tools, Compensation tracking.
- Five visual themes, PWA install/offline support, CSV import, local-first storage with backup/restore.
