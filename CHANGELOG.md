# Changelog

All notable changes to Ledger are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
pre-1.0 beta.

## [Unreleased]

## [0.9.6-beta] - 2026-08-25

Support for Chase credit card statements, and the groundwork refunds needed in
order to be recorded honestly.

### Added
- Chase credit card activity exports now import directly, instead of falling through to the manual column-mapping dialog. Merchant names arrive readable rather than HTML-escaped
- A credit card bill payment is now recognized for what it is. It arrives in triage badged "card payment, not income", is held back from Accept All so it can never be swept in as earnings, and can be cleared in one click with "Reject N card payments"
- Where you have no rule of your own for a merchant, Chase's own category is now used as a starting guess. Your own learned rules always win

### Changed
- A refund is now recorded as money returning to the category it left, rather than as income. Your income figure no longer counts refunds, and the category the money came back to reflects it
- A transaction amount may now be negative when it is an expense, so a refund can be entered or corrected by hand. Income still has to be greater than zero
- Amounts ending in exactly 50 cents now round the same way whether they are money in or money out. An expense of 21.50 and an income of 21.50 used to round to different dollar figures; now they match

### Fixed
- Amounts no longer render with two minus signs where a transaction is negative
- A month whose refunds outweigh its spending no longer shows a broken figure in the Monthly Summary, and an expense group in the same position is now left out of the Cash Flow chart instead of being drawn as a flow that cannot exist
- A budget progress bar can no longer render backwards when refunds exceed what was spent in a category, while the figure beside it still correctly reads as the negative amount it is

## [0.9.5-beta] - 2026-08-22

A desktop and tablet pass. The previous release fixed the phone experience; an audit of the
same app on a laptop, a desktop monitor and an iPad found a separate set of problems, and
this release closes them.

### Added
- Transactions and holdings can now be sorted by clicking a column heading, on date, description, category, amount, ticker, value or allocation. Sorting works from the keyboard and is announced to a screen reader
- The section you are looking at on Budgeting and Investments is now part of the address, so you can bookmark the Transactions tab or the Portfolio tab, share a link to it, and use the browser's Back button to undo a tab switch. A reload keeps you where you were instead of returning you to the first tab
- Investments now opens on Portfolio when you have imported holdings but written no analyses, instead of always opening on an empty Plan vs Actual
- The Compensation chart now lists each component beside it with its amount and share of the total, so you can read the breakdown without hovering
- The exchange-rate notice on the Investments page now has a Retry control, rather than only telling you rates were unavailable

### Changed
- The browser tab, your history and your bookmarks now show which page you are on. Every page used to be called just "Ledger"
- Tab strips are now real tabs: arrow keys move between them, and a screen reader says which one is selected
- Buttons and fields now share one visible outline when you reach them with the keyboard, in place of a mix of gold rings, grey browser outlines and, in several places, nothing at all
- Outlined buttons and inputs now have a border you can actually see. The old one sat at roughly a fifth of the contrast that guidance asks for, in every theme
- Scrollable panels, such as the expense list and the allocation breakdown, can now be scrolled with the keyboard
- Budget Setup on the Budgeting page now opens by default and has a clear control for collapsing it, instead of hiding the paradigm picker and monthly targets behind an unlabelled chevron
- Importing holdings now opens in a dialog, giving the top of the Investments page back to your actual portfolio
- Toggles now name what clicking them does and leave the on or off state to their appearance, in place of labels like "Convert to CAD: OFF" that never made clear whether they described the current state or the action
- The button that deletes every transaction now says "Delete all transactions" and sits away from the filters, rather than reading "Clear All" next to the category filter where it looked like it cleared the filters
- The Mortgage chart's vertical axis now reads in dollars, not bare digits like 600000, and both axes are labelled
- Empty cards on the Dashboard now show what to do next with a real button, rather than a sentence with a small inline link
- Planner tool cards now keep the same column count down the whole page

### Fixed
- Account names on the Dashboard were cut to one or two characters on an iPad held upright, showing as "M..", "E..." and "Q..". They now wrap instead
- Submitting the Add Transaction form with no amount did nothing at all, with no message. It now explains what is missing and takes you to the field
- The amount and description fields in Add Transaction, and the stock price fields on Compensation, had no label a screen reader could read
- Moving through the Dashboard with the keyboard passed through a dozen stops that showed nothing on screen, because the edit and delete buttons for each row were invisible until hovered. Those buttons were also permanently invisible on a touchscreen tablet, where hovering is not possible
- Settings and the opening disclaimer showed their heading and close button twice on a phone held sideways, on a short desktop window, and at high browser zoom
- The Compensation breakdown chart's labels ran off the side of the screen on a phone and were cut off on a tablet, leaving a coloured ring with nothing identifying its segments
- The Dashboard and the Investments page could report different totals for the same portfolio when live prices were unavailable. Both now fall back to what you paid, and a holding whose live price arrives in an unexpected currency is no longer converted as though it were in your own
- Charts had no description for screen readers and were announced as an unnamed application
- Table headings were not linked to their columns, so a screen reader could not tell you which column a figure belonged to

## [0.9.4-beta] - 2026-08-20

### Changed
- Mobile navigation: Search and Settings now live in a new top bar on phones, so the bottom bar can give all five sections (Dashboard, Budgeting, Investments, Planner, Compensation) full-width tabs instead of squeezing in a sixth. Compensation no longer gets cut off
- Every button, checkbox, and form field on a phone now meets a comfortable minimum touch size, in place of several controls (checkboxes, the currency selector, refresh and info buttons) that used to be too small to tap reliably
- Typing into any field on a phone no longer causes Safari to zoom the page in and stay zoomed
- Long account names on the Dashboard now wrap onto a second line on narrow phones instead of being cut off mid-word
- Charts take up noticeably less vertical space on phones, so a single chart no longer dominates the screen
- The Mortgage tool's payment chart now reveals its values with a tap on a touchscreen, not just a mouse hover
- The app's browser chrome (the colour behind the status bar on an installed app) now matches whichever theme is active, instead of always being black

### Fixed
- Settings was unreachable when a phone was held sideways: the sidebar used to take over in landscape and push Settings off the bottom of the screen with nothing to scroll. The app now keeps its phone layout through the height of the screen, not just its width
- The Compensation page's Gross/After-Tax toggle was clipped off the right edge of the screen on a phone and could not be tapped
- Bottom sheets (Settings, transaction entry, and others) could be partly hidden behind the on-screen keyboard on a tall form; they now stay above it
- The undo and update-available notifications could sit partly behind the bottom navigation bar on a phone with a home indicator; they now clear it
- The Mortgage chart's tooltip stopped responding to mouse hover on desktop after enabling tap support on phones; hover is restored on desktop while tap still works on phones

## [0.9.3-beta] - 2026-08-18

### Added
- Drive sync: an automatic sync option in Settings. Once you have synced manually at least once in a browser session, Ledger keeps that device current in the background, but only when there is nothing to decide, pulling or pushing on your behalf when the two sides agree cleanly. Anything that could overwrite work done on another device still stops and waits for you to resolve it in Settings, exactly as manual sync always has. Automatic sync uploads the same snapshot manual sync does, including any market data API key you have entered.
- Dashboard: the Getting started checklist can now be dismissed with its own close control, for anyone who wants it gone before finishing both steps

### Changed
- Budgeting: the transaction table now renders only the rows on screen on phones as well as on desktop, so a long list stays responsive while scrolling and searching on both. The card list used on phones no longer mounts every card up front
- Budgeting: a transaction row can now be opened with Enter or Space once focused on phones as well as on desktop, instead of needing a tap or a click
- The app now starts noticeably faster, especially on a phone or a slower connection, because the chart library no longer loads until a page that actually shows a chart is opened

### Fixed
- Recurring bills: a reminder for a bill due today now fires. Previously the due-date check missed bills due on the current day and only caught ones due in the next few days
- The demo data banner could keep showing after demo data was cleared, or fail to reappear after demo data was loaded again in the same session, in a few sequences involving undo. It now tracks the same underlying state every code path that can change it, including undo, so it always matches whether sample data is actually loaded
- Several labels dimmed with reduced opacity, such as helper text and secondary figures, fell below the WCAG AA contrast minimum in the default theme. They are now shown at full opacity

## [0.9.2-beta] - 2026-08-17

### Added
- Demo mode, in Settings under Backup: load a sample two months of transactions to see what a populated Ledger looks like before you enter your own. A banner marks it while it is on, the sample records never reach a backup file or a Drive sync, and clearing it removes only the sample records so anything you entered yourself survives. If you already have transactions, loading it asks first and offers an undo
- Recurring bills: optional reminders for bills falling due in the next few days. Turn them on in Settings, which is the only point Ledger asks your browser for notification permission
- Drive sync: a status chip in the sidebar reading up to date, stale, or never synced, so you no longer have to open Settings to learn whether this device is current
- A keyboard shortcuts list, opened with the ? key
- Dashboard: a Getting started checklist on a fresh install, pointing at your first account and first transaction, which disappears once both are done
- A Skip to content link, so keyboard and screen reader users can jump past the sidebar on every page

### Changed
- Budgeting: on desktop, the transaction table now renders only the rows on screen, so a list of several thousand transactions stays responsive while scrolling and searching, where it previously mounted every row at once. The card list used on phones is unchanged for now. Selecting across a large filtered list is faster in both
- Budgeting: on desktop, a transaction row can be opened with Enter or Space once focused, instead of needing a click. The card list used on phones still needs a tap
- The app's main code bundle is now less than half its former size, and the chart library, React and the router sit in their own files, so an update re-downloads less than it used to
- Geometric Light: the blue accent is slightly darker. The old shade fell below the WCAG AA contrast minimum against white wherever it was used for normal-size text, such as the active sidebar link

### Fixed
- Several small labels were too faint to meet the contrast minimum in the default theme: the version number in the sidebar, the help line under Drive sync, and the placeholder in the market data API key box
- Every page carried two top-level headings, one from the sidebar and one from the page itself, which made screen reader navigation ambiguous. The sidebar brand is no longer a heading

## [0.9.1-beta] - 2026-08-15

### Added
- Salary & Tax: an RRSP Efficiency block next to your deductions. It shows how much of your income sits in each marginal band, what sheltering each band would save, and the contribution that clears your top band
- Salary & Tax: an optional RRSP Room field. Leave it empty and the tool estimates your room at 18% of income up to the annual maximum, and says that it is an estimate. The room bar counts what is left after the contribution you have already entered, so a suggestion never quietly pushes you past your limit

### Changed
- Salary & Tax: the Deductions block now opens with a single bar of your whole gross income split into federal tax, provincial tax, CPP, EI and net pay, so the width of the bar means something. The four deduction bars below it are still shares of gross, and now say so
- Compensation: the line on the Equity Vesting Schedule now tracks the equity you have not vested yet, falling as each grant vests, instead of the total vested so far. Hovering any month gives you the figure, including months where nothing vests, and the chart now names each grant and states the share price the value depends on. The area under the line is filled in your current theme's colour
- Planner: the Raise vs Inflation verdict now sits in a banner coloured by the outcome instead of a loose line

### Fixed
- Compensation: a grant whose first tranche vested in the very first month of the chart did not show that vest, so the line started flat
- Charts: the hover tooltip could be drawn behind a chart's own labels, so the figure you were pointing at sat underneath the total in the middle of the Compensation donut
- Dashboard: the Net Worth Over Time chart wrote its side labels out in full, so a figure like $316,621 ran into the first date underneath it and the bottom corner read as one run-on line. The side labels are now shortened to $316k, matching every other chart
- Salary & Tax: the federal and provincial bracket ladders always showed a horizontal scrollbar, because the gaps between segments pushed the row past its own width. The segments now share the space and the ladders fit without scrolling at every income. Where a band is too narrow for its full figures, such as on a phone, its caption shortens to $0 to $54k rather than running into the band beside it
- Planner: the Rent vs Buy chart's explanatory caption was rendering outside the chart card

## [0.9.0-beta] - 2026-08-15

### Added
- Budgeting: a transaction can be split across several categories, so one shop that was part groceries and part household counts as both. Every budget figure, the 50/30/20 split and the category charts follow the slices
- Budgeting: transactions take tags and a note, and the search box matches both
- Budgeting: importing a CSV now marks rows that look like something already in your budget. Accept All takes only the rest, and there is a one-click way to reject the duplicates
- Undo now covers deleting an account, deleting a category or group, clearing all transactions, clearing the triage inbox, and accepting a whole import, not just deleting a transaction. The offer appears in one place at the bottom of the screen
- Dashboard: a Customize panel to switch widgets off and set their order, with up and down buttons so reordering works on a phone
- Net worth: an Edit history window on the trend chart to add, correct or delete dated figures, so you can backfill months from before you installed the app. A point is also recorded each day you open it, so the trend is sampled by time rather than by how often you happen to edit an account
- Investments: a Trades tab. Record your buys and sells to see realized gains for the year, your adjusted cost base per holding, and a warning when the trades you entered disagree with an imported holding
- If you use Drive sync, update Ledger on every device before recording trades. A device still on an older version does not know about the Trades tab, and a sync from it will remove your trade log from the other devices
- Investments: prices and exchange rates now say how old they are and offer a refresh where the figure is shown, instead of only saying "cache" or "stale"

### Fixed
- A widget that hit unexpected data used to blank the whole page. Now it fails inside its own card with a Try again button and the rest of the page keeps working

## [0.8.1-beta] - 2026-08-14

### Added
- Budgeting: a search box on the transaction list, matching on description or category name
- Budgeting: tick boxes on the transaction list to select many transactions at once, then set a category on all of them or delete them together
- Budgeting: deleting a transaction now offers an Undo, for single rows and for a bulk delete
- Budgeting: the Subscriptions widget lists what is due in the next 30 days with a running total, and a charge that is not really a subscription can be ignored and restored later

### Fixed
- Backups and Drive sync were silently leaving out your uploaded PortfolioAnalyst report, so the Account Value card, benchmark comparison and contributors were lost on a restore or on a second device. The report is now included, and the app derives its backup list from a single registry of stores so a future store cannot go missing the same way
- A brand new install started with four made-up accounts (a chequing account, a retirement account, a mortgage and a personal loan), so the dashboard, net worth and forecaster all showed money that was not yours. A new install now starts empty and invites you to add your first account. If those four accounts are still sitting untouched in an existing install they are removed on upgrade, and your stored net worth history is cleared along with them, since every past snapshot was computed with that fake money included and would otherwise show a large phantom swing on the trend chart. Anything you renamed, revalued or added is kept; if you had been tracking real balances alongside the demo accounts, your net worth trend will start over after the upgrade
- Editing an account or a transaction reset its form through an extra render pass, which could briefly show stale values. The forms are now built fresh each time the pop-up opens

### Changed
- The app is split into one bundle per page instead of a single bundle: the largest chunk that loads up front dropped from 1,229 kB (350 kB gzipped) to 463 kB (143 kB gzipped), so opening it downloads noticeably less before the dashboard appears. The other pages load when you first visit them

## [0.8.0-beta] - 2026-08-13

### Added
- Google Drive sync. Push and pull your whole dataset as timestamped JSON snapshots in a `Ledger` folder in your own Drive, using an OAuth client ID you supply in Settings. Snapshots carry a revision number, and the app warns before a push overwrites a newer snapshot from another device or a pull discards unpushed local edits. Retention keeps the most recent 100 snapshots and moves older ones to the Drive bin.
- Settings shows the name of this device, which you can edit so sync warnings name the right machine, and a Disconnect control that forgets the Drive link and sync history without touching any data.

### Changed
- Backup envelope is now version 2, carrying device and revision metadata. Version 1 backup files still import.
- Restoring a backup now validates the whole file before writing anything, so a corrupt file cannot leave data half-restored, and it writes only keys the app recognises.

## [0.7.6-beta] - 2026-08-12

### Added
- Investments: the Portfolio tab now shows an Account Value card with the true account value from an uploaded PortfolioAnalyst report, including the cash balance and net of any margin loan. It lists the cash sleeve (negative when you are drawn on margin) and the report period, so a margin account no longer looks like it holds only the sum of its positions. A report in a currency other than Canadian dollars is labelled with that currency rather than converted

### Fixed
- Budgeting: the period picker, month selector, Import CSV and Add Transaction controls in the page header were three different heights; they now line up on a single row. On phones the month arrows keep their full-size tap targets
- Investments: the Benchmark Comparison chart labelled its horizontal axis with raw values like "202601". It now reads "Jan 2026", on both the axis and the hover tooltip
- Investments: the Benchmark Comparison chart plotted its months in whatever order the report listed them, so the line could run backwards through time. Months are now ordered oldest-first, which also corrects the compounded growth figures
- Compensation: the ESPP lock-in price, company stock price, and grant price are labelled USD, so it is clear which currency they are entered in
- Dashboard: the Net Worth widget's month-over-month percentage printed its full unrounded value (for example -0.15652843963654473%). It now shows two decimals
- Desktop: the divider between the sidebar and the page used to begin abruptly at the top edge with nothing meeting it, while its lower end was anchored by the settings bar. It now fades in, so it no longer looks unfinished
- Pop-ups taller than the window were cut off at the top with no way to scroll back up to them. They now scroll to reveal their full height, headers included. This affected What's New most, but applied to every desktop pop-up
- Investments: allocation donuts reused the same six colours, so a seventh holding was drawn in the same colour as the first. Every slice now gets a distinct shade
- Investments: the report's allocation donuts now list slices largest-first, matching the Portfolio tab

### Changed
- What's New now lists only the releases in the current version series; earlier ones are tucked behind an "Older versions" section, so the window opens short instead of listing every release back to 0.1.0
- Investments: the Portfolio tab's "Value Now" total is now "Holdings Value", since it counts only your positions and never included cash or a margin loan
- Investments: the allocation donut on the Portfolio tab is noticeably larger

## [0.7.5-beta] - 2026-07-23

### Fixed
- Mobile: content at the bottom of long pages is no longer hidden behind the bottom navigation bar. Scrolling to the end now clears the nav, so buttons and captions at the foot of a page are reachable
- Mobile: pop-ups and sheets (Settings, Add Account, Add Transaction, the CSV importer, and the rest) now fill the screen width instead of appearing as a narrow panel pinned to one side, their sections are spaced correctly, and each shows a single close button instead of two
- Mobile: the Salary and Tax bracket bars show every bracket's full dollar range and rate instead of clipping the label

### Changed
- Mobile: pages now use the full screen width. Doubled-up page margins were removed, so content is roughly 40px wider on a phone and text wraps less
- Mobile: the bottom navigation tabs are evenly spaced and their labels stay on one line instead of crowding on narrow phones
- Mobile: controls for editing accounts, stepping through months, and similar actions now have finger-friendly tap targets
- Mobile: the Budgeting header is simpler on phones, with a single month control and a compact toolbar, so it takes up less of the screen
- Mobile: the Net-Worth Forecaster's Monte Carlo cards stack in one clean column on phones instead of sitting unevenly
- Dashboard: rearranging widgets by dragging is now a desktop-only feature, since it never worked by touch

## [0.7.4-beta] - 2026-07-22

### Added
- Budgeting: a new Savings Rate widget on the Overview tab, with a rate gauge and toggles for a net-savings trend and a saved-versus-spent split. It follows the timeframe you pick above and shows amounts on hover

### Changed
- Budgeting: the Income Flow chart is now Cash Flow, a colored diagram that traces each income source into your spending groups and, when you spend less than you earn, into a Savings outlet so the money you kept is visible
- Budgeting: the Income widget now breaks down by source (Salary, RSU, and so on) and the Expenses widget groups spending by category group (Housing, Food, and so on) instead of individual categories
- Budgeting: annual budget rows no longer show the "set aside by now" line; they show what you have spent and what is left for the year
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
- Options tab in Investments: wheel strategy tracker ported from the standalone tool: upload IBKR activity statement CSVs to see per-ticker premium collected, true breakeven, and live-price Net P/L (PDF export not carried over)
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
