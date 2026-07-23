# Mobile View Audit — Ledger v0.7.4-beta

**Date:** 2026-07-22
**Audited by:** Claude (automated DOM measurement + source review)
**Viewports tested:** 375×812 (iPhone standard) and 320×700 (iPhone SE / smallest common)
**Method:** Live DOM geometry measurement (overflow, clipping, tap-target sizes, wrap detection) against the running dev server, cross-referenced with source. Every route was walked at mobile width.

> **Tooling caveat:** The browser pane could not composite frames in this session, so **screenshots were unavailable**. All findings below come from precise DOM measurement (element rects, `scrollWidth` vs `clientWidth`, computed styles) and source inspection, which is actually more reliable than eyeballing for overflow/wrap issues — but a few *visual polish* items and *populated-data* states are marked "Needs visual verification."

---

## Summary

The app has a real responsive foundation: a desktop sidebar that swaps to a mobile bottom tab bar, modals that become bottom sheets, and grids that collapse to single columns. No page had raw horizontal page scroll at 375px or 320px. The problems are concentrated in **space efficiency** and **component-level density**, which together produce the "text breaking onto multiple lines" and "double icons" symptoms you noticed.

The single highest-impact issue is **stacked/redundant padding on every page**, which throws away ~21% of horizontal space on a 375px screen and forces text to wrap earlier than it should.

**Severity tally:** 2 High · 4 Medium · 2 Low · 4 Needs-verification

---

## HIGH severity

### H1. Every page double-pads its content (root cause of premature text wrapping)
`main` in the Layout already applies horizontal padding, and **every page root re-adds `p-6` on top of it**:

- `src/components/Layout.tsx:134` — `main` = `p-4 sm:p-8`
- `src/pages/Dashboard.tsx:88` — `p-6`
- `src/pages/Budgeting.tsx:53` — `p-6`
- `src/pages/Investments.tsx:35` — `p-6`
- `src/pages/Compensation.tsx:52` — `p-6`
- `src/pages/Planner.tsx:6` — `p-6`
- `src/pages/PlannerTool.tsx:13` — `p-6`

**Measured effect on mobile:** 16px (`main` `p-4`) + 24px (`page` `p-6`) = **40px of padding per side = 80px total**. On a 375px viewport only **295px is usable — 21% is gone to gutters** before any content renders. On desktop it stacks to 56px/side (`sm:p-8` + `p-6`).

**Why it matters:** narrower content is the direct cause of labels + values ("Main Checking … $15,000.00") wrapping onto two lines, gauges compressing, and cramped widgets.

**Recommendation:** Pick one owner of page padding. Cleanest fix: **remove `p-6` from all six page roots** and let `main` own the gutter (bump `main` to `p-4 sm:p-6 lg:p-8` if you want more breathing room on desktop). This is a ~7-line change and instantly gives every screen ~40px more width on mobile.

---

### H2. Budget page header consumes 246px (30% of the screen) and shows redundant month controls
On mobile the Budgeting `<header>` (`src/pages/Budgeting.tsx:54-117`) wraps into ~4 stacked rows and measures **246px tall** before any budget data appears. It renders **two independent month controls side by side**:

1. A **"This month" dropdown** (`ThemedSelect`, line 62) — with a chevron-down icon.
2. A **‹ July 2026 › arrow stepper** (lines 82-108) — with two more chevron icons.

**Measured:** 3 clustered chevron/arrow icons (dropdown chevron at y≈158, stepper arrows at y≈213) plus the CSV/Add row. This cluster of overlapping-purpose chevrons is almost certainly the **"double icons kind of"** you reported — two different widgets that both change the month, sitting next to each other.

**Recommendation:**
- Collapse to **one** month control on mobile. Either keep the dropdown (which already offers This/Last month + ranges) and drop the stepper below `md`, or keep the stepper and fold the range presets into it.
- Move `Import CSV` / `Add Transaction` into a single compact action row (or an overflow "⋯" menu) on mobile.
- Target header height < ~120px on mobile so content is visible above the fold.

---

## MEDIUM severity

### M1. Bottom tab bar is overcrowded (6 items) and unevenly spaced at 320px
`src/components/Layout.tsx:142-174` renders **6 tabs** (Dashboard, Budgeting, Investments, Planner, Compensation, **Settings**) across the full width.

**Measured at 320px (iPhone SE):** cells are **uneven** — "Compensation" forces a 64px cell (its label is a single unbreakable 64px word) while the others shrink to **51px**, so the icons are no longer evenly spaced. Labels avoid wrapping *only* because each is a single word that can't break; there is **zero horizontal padding** left in the "Compensation" cell (label width == cell width). Any label tweak or a slightly narrower device tips it into truncation/wrap.

**Recommendations:**
- Standard mobile guidance is **≤5 bottom-bar destinations**. Settings is a good candidate to remove from the bar (it's a utility, not a primary destination) — it's already reachable, or add it to a "More" tab.
- Add `min-w-0` + `truncate` to the label span as a safety net, and consider dropping labels below ~340px (icons only).

### M2. Salary & Tax bracket bars clip their boundary labels on mobile
`src/components/planner/SalaryTaxTool.tsx:38-58`. Each tax bracket is a bar segment whose **width is proportional to the bracket's dollar size**. Open-ended top brackets ("$117,045+", "$107,785+") become narrow slivers.

**Measured clipping:** the label span (`text-[10px] … truncate`, line 53) needs 49px but its cell is only **16–35px**, so `truncate` cuts it to "$117,0…" — **losing the trailing "+"**, which is the part that signals "and up." Separately, the rate % inside the bar is hidden entirely below a 44px segment width (`@min-[44px]:flex`, line 49), so narrow brackets show **neither** the rate nor a readable boundary.

**Recommendation:** On mobile, give the bracket list a non-proportional layout — e.g. a simple stacked list (`rate — range`) or equal-width segments with the label below — so every bracket is legible. If you keep proportional bars, enforce a `min-width` on segments and don't rely on `truncate` for the boundary text.

### M3. Dashboard widget reordering is desktop-only (silent on touch)
`src/pages/Dashboard.tsx:99-113` uses the native HTML5 `draggable` / `onDragStart` API for widget reordering. **Native drag-and-drop does not fire on touch devices**, so mobile users have no way to reorder widgets and get no indication the feature exists. `cursor-grab` (line 112) is also meaningless on touch.

**Recommendation:** Either add a pointer/touch-based reorder (long-press drag, or explicit up/down move buttons in an "edit layout" mode) or hide the affordance on mobile so it isn't a dead feature.

### M4. Sub-44px touch targets on Dashboard account rows
`src/components/dashboard/AccountCategoryWidget.tsx`.

**Measured:** Edit (`Edit2`) and Remove (`Trash2`) buttons render at **30×30px** (icon 14px + `p-2`, minus `-m-1`); the section **"Add" button is 58×28px** (28px tall); the Budget month arrows are **28×28px**. WCAG 2.5.5 / platform guidance recommend **≥44×44px** touch targets.

Note: these buttons *are* correctly always-visible on mobile (the `sm:opacity-0 sm:group-hover:opacity-100` hover-reveal only applies at ≥640px), so that part is handled well — it's purely the size.

**Recommendation:** Bump icon-button hit areas to ≥44px on mobile (e.g. `p-2.5` and remove the negative margins, or add `min-h-[44px] min-w-[44px]`).

---

## LOW severity

### L1. Account names are not truncated
`src/components/dashboard/AccountCategoryWidget.tsx:63` — `<span class="text-sm text-text-secondary">{acc.name}</span>` has no `truncate`/`min-w-0`. Seeded data uses short names so nothing breaks today, but a long account name ("Joint Savings — Vacation Fund 2026") will wrap to two lines or push the amount/actions out of the row on a 295px-wide card. Add `truncate min-w-0` to the name span and `shrink-0` to the amount+actions group.

### L2. Custom-select trigger has no accessible name in some spots
The Budget period `ThemedSelect` (`src/pages/Budgeting.tsx:62`) is rendered without an `ariaLabel`, and `read_page` surfaces its trigger as an unlabeled `button` (the visible value text is inside a nested span). `ThemedSelect` supports an `ariaLabel` prop (`src/components/ui/ThemedSelect.tsx:86`) — pass one (e.g. `ariaLabel="Time period"`) so screen readers announce the control's purpose. Low impact but cheap.

---

## Could NOT verify (needs a real device / populated data / screenshots)

These are flagged for your manual confirmation — I could not close them out via measurement alone:

1. **Exact "double icons" instance — RESOLVED (2026-07-22, user screenshots).** It is **not** the Budget header. On mobile the `Sheet` primitive (`src/components/ui/Sheet.tsx:239-251`) renders its own drag-handle header with a Close "×", while each modal *also* renders its own header "×" for the desktop variant, so two "×" icons stack on mobile (seen in Settings and Add Account). The same screenshots surfaced two further confirmed issues: (F1) the bottom nav clips page content between 640–767px because `main`'s `sm:p-8` overrides the `pb-[calc()]` nav clearance, and (F3) the forecaster Monte Carlo grid orphans/misaligns its cards. All three are now specced as Tasks 9–11 in `docs/superpowers/plans/2026-07-22-mobile-view-fixes.md`.

2. **`TransactionModal` scroll on short screens.** `src/components/budget/TransactionModal.tsx:152` passes `overflow-hidden` in `panelClassName`, while the mobile bottom-sheet variant (`src/components/ui/Sheet.tsx:228`) sets `overflow-y-auto` on the same element. Depending on compiled CSS order, `overflow-hidden` *may* win and prevent the tall transaction form from scrolling on a short phone (fields cut off). Needs a runtime check on a real device with the keyboard open. Safe fix: don't pass `overflow-hidden` from modals that use `Sheet`.

3. **Data-heavy widgets at mobile width.** All widgets were audited in their **empty state** (the seeded month has no transactions), which measured clean. The following are **untested with real data** and are the most likely remaining overflow risks on mobile:
   - Cash Flow / Sankey widget (`CashFlowWidget`)
   - Budget vs. Actual, Spending Heatmap, Category Trends (`insights` tab)
   - Transaction list table (`TransactionListWidget`) — tables are the classic mobile-overflow offender; confirm it scrolls in its own container rather than pushing the page.
   - Net-Worth / FIRE forecaster charts (Recharts) and the Investments Portfolio/Options tables.

4. **Recharts responsiveness.** Charts (dashboard trend, forecaster, savings gauge) were only seen empty. Confirm they use `ResponsiveContainer` and don't force a min-width that overflows at 320–375px.

---

## Recommended priority order

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | **H1** — remove page-root `p-6`, let `main` own padding | ~7 lines | Frees 21% width on every mobile screen; reduces wrapping everywhere |
| 2 | **H2** — collapse Budget header to one month control + compact actions on mobile | Small | Recovers ~120px vertical; kills the "double icons" |
| 3 | **M1** — trim bottom bar to 5 items; add `truncate`/`min-w-0` safety | Small | Fixes crowding + uneven spacing at ≤320px |
| 4 | **M2** — non-proportional bracket layout on mobile | Small-Med | Makes Salary & Tax legible on phones |
| 5 | **M4 / L1** — 44px hit areas + truncate account names | Small | Accessibility + robustness |
| 6 | **M3** — touch reorder or hide drag on mobile | Med | Removes dead feature on touch |

Items H1, M1, M4, L1, L2 are safe to implement immediately. H2, M2, M3 are behavioral/UX changes worth a quick design pass first.
