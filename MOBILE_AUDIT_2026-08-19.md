# Mobile Audit: Ledger v0.9.3-beta

**Date:** 2026-08-19
**Method:** Live DOM measurement against the dev server (element rects, `scrollWidth` vs `clientWidth`, `elementFromPoint` hit testing, composited-background contrast maths), cross-referenced with source.
**Viewports:** 375x812 (iPhone standard), 320x700 (smallest common), 844x390 and 812x375 (phone landscape).
**Data:** demo budget data plus seeded accounts (7), portfolio holdings (8 across 2 accounts) and a compensation package (2 RSU grants), so every screen was measured populated, not empty.
**Supersedes:** `MOBILE_AUDIT.md` (v0.7.4-beta, 2026-07-22). Its highest-severity finding, double page padding, is fixed: `main` now owns the gutter at a measured 16px per side and no page root re-pads.

> **Tooling caveat:** the browser pane could not composite frames, so no screenshots and no running animations. Everything below is measured geometry or source. Two items are explicitly marked **unverified** because they need a real device.

---

## Scores

| # | Section | Score |
|---|---------|-------|
| 1 | Navigation and wayfinding | **5** / 10 |
| 2 | Layout and viewport fit | **7** / 10 |
| 3 | Touch targets and ergonomics | **4** / 10 |
| 4 | Forms and data entry | **5** / 10 |
| 5 | Modals, sheets and overlays | **8** / 10 |
| 6 | Dense data: lists, tables, portfolio | **8** / 10 |
| 7 | Charts and visualisation | **7** / 10 |
| 8 | Typography and readability | **7** / 10 |
| 9 | Accessibility | **7** / 10 |
| 10 | Platform integration: PWA, safe areas, orientation | **6** / 10 |

### **Total: 64 / 100**

A genuinely responsive app with a real mobile design pass behind it, held back by two reachability bugs that make features disappear on a phone, and by two systemic issues (tap-target sizing and sub-16px inputs) that touch nearly every screen.

---

## Blocking findings

### B1. Settings is unreachable in landscape on every phone

The sidebar shows at `md` and up, which is **width**-based only (`hidden md:flex`, [Layout.tsx:142](src/components/Layout.tsx#L142)). A phone in landscape is 812-932px wide, so the desktop sidebar appears and the mobile bottom bar (`md:hidden`, [Layout.tsx:253](src/components/Layout.tsx#L253)) is hidden. The sidebar is a full-height flex column with no vertical scrolling, inside a root that is `h-dvh overflow-hidden`.

Measured at 844x390 (iPhone 14 landscape):

| | value |
|---|---|
| sidebar `scrollHeight` | 462px |
| sidebar `clientHeight` | 390px |
| Settings button top | **410px** (viewport is 390px) |
| bottom bar `display` | `none` |

The Settings button and the version / What's New button are **fully below the viewport and clipped, with nothing to scroll**. `elementFromPoint` at the bottom edge returns the Compensation link, not Settings. The Compensation nav item itself is cut off 18px short.

Any viewport wider than 768px and shorter than ~462px hits this, which is every phone in landscape. Settings is the only route to backup, restore, Drive sync, themes and demo data, and there is no other entry point.

**Fix:** give the sidebar `overflow-y-auto` so the dock stays reachable, and/or gate the sidebar on height as well (`md:max-lg:landscape` or a `useIsDesktop` check that requires a minimum height) so short-landscape phones keep the bottom bar.

---

### B2. The Gross / After-Tax toggle is off-screen and untappable on Compensation

[CompHeroWidget.tsx:177](src/components/compensation/CompHeroWidget.tsx#L177) puts three segmented toggle groups (time mode, view mode, gross/after-tax) in a single `flex items-center gap-3` with **no `flex-wrap`**. The outer row wraps, the inner group cannot.

Measured at 375px wide:

| element | left | right |
|---|---|---|
| toggle group container | 33 | **463** |
| "Gross" button | 348 | 403 |
| "After-Tax" button | 403 | 458 |

The whole Gross/After-Tax control starts 28px past the right edge of a 375px screen. `main` is `overflow-x-hidden`, so it is clipped, not scrollable, and `elementFromPoint` at the right edge returns `MAIN` rather than the button. At 320px "Monthly Cash Flow View" (258-327) is clipped too.

**Effect:** the after-tax compensation view cannot be turned on at all on a phone, and the monthly cash-flow view is partly unreachable at 320px. This is the only horizontal overflow anywhere in the app.

**Fix:** add `flex-wrap` and a wrap-friendly gap to the inner container, or stack the three toggles vertically below `sm`.

---

### B3. Search / command palette has no mobile entry point

`setPaletteOpen(true)` has exactly two callers: the `Ctrl/Cmd+K` handler ([Layout.tsx:53](src/components/Layout.tsx#L53)) and the Search button at [Layout.tsx:163](src/components/Layout.tsx#L163), which lives inside the desktop-only sidebar. The bottom bar carries Dashboard, Budgeting, Investments, Planner, Compensation and Settings, and no search.

On a phone there is no keyboard and no button, so the command palette is dead code on mobile. The `?` shortcuts-help modal is unreachable the same way (less important, since it documents keyboard shortcuts).

**Fix:** add a search affordance to the mobile layout, e.g. a search icon in a compact top bar, or swap one bottom-bar slot.

---

## 1. Navigation and wayfinding: 5/10

**Good:** a real bottom tab bar rather than a hamburger; `aria-current="page"` on the active tab; a working skip link; the active tab is both coloured and labelled; icons plus text, not icons alone; Settings is one tap away in portrait.

**Problems:** B1 (Settings unreachable in landscape) and B3 (no search on mobile) both land here. Secondary: the bar packs 6 items into 375px, giving each 62px, so "Compensation" truncates to `Compensatio…` at 375px and both "Investments" and "Compensation" truncate at 320px. There is no back affordance inside Planner tools other than the in-page "Planner /" breadcrumb, which measures 84x36.

## 2. Layout and viewport fit: 7/10

**Good:** measured across 8 routes at both 375px and 320px, `documentElement.scrollWidth` equals `clientWidth` on every one, so no page ever scrolls sideways. Grids collapse to a single column. The v0.7.4 double-padding defect is gone: `main` reports exactly 16px left/right padding and page roots no longer stack their own. `main` reports 68px bottom padding (52px bar + 16px), so content clears the bottom bar with the bar measured at 53px starting at y=759.

**Problems:** B2 is the sole overflow, and it is a clip rather than a scroll, which is the worst kind because nothing signals the content exists. `overscroll-behavior` on the scroll container is `auto`, so scroll chaining and pull-to-refresh bounce are unconstrained inside an app shell.

## 3. Touch targets and ergonomics: 4/10

The weakest area, and it is systemic rather than isolated.

| Control | Measured | Where |
|---|---|---|
| Transaction select checkbox | **13 x 13** | [TransactionListWidget.tsx:279](src/components/budget/TransactionListWidget.tsx#L279), :308, :400 |
| Widget show/hide checkbox | **13 x 13** | [CustomizeDashboard.tsx:39](src/components/dashboard/CustomizeDashboard.tsx#L39) |
| Split / shared-bill checkbox | **13 x 13** | [TransactionModal.tsx:210](src/components/budget/TransactionModal.tsx#L210), :258, :298 |
| Currency selector per holding | 61 x 18 | Portfolio holdings |
| "Edit <transaction>" row button | 196 x 21 | Transaction card list |
| "Refresh exchange rate" | 19 x 19 | Portfolio |
| "About this tool" | 24 x 24 | Planner tool header |
| Sheet "Close" | 28 x 28 | [Sheet.tsx](src/components/ui/Sheet.tsx) |
| Widget move up/down | 30 x 30 | Customize sheet |
| Card-header "Add" | 58 x 28 | Dashboard account cards |
| Tab pills (Overview/Insights/…) | ~80 x 33 | Budgeting |
| Segmented toggles (Rate/Trend/Split) | ~48 x 26 | Budgeting |

All nine `<input type="checkbox">` in the app render at the browser default 13x13 with no sizing class; only two carry any styling at all (`accent-…` colour). 13px is below even the WCAG 2.5.8 AA minimum of 24px, let alone the 44px platform guidance.

Counts of interactive elements under 44px in either dimension, per screen: Dashboard 10/31, Budgeting Transactions 21/34, Portfolio 17/29, Mortgage 13/20, Forecaster 18/29, Debt Payoff 18/26. The dashboard also has 11 pairs of interactive elements separated by less than 8px.

**Credit where due:** primary CTAs are sized properly (the "Add Transaction" submit is 303x45), the bottom bar uses `min-h-[52px]`, and the Planner index is the one screen with zero undersized targets.

**Fix:** add a shared checkbox component at `h-5 w-5` with a padded hit area, and set a minimum 44px hit area on icon buttons via padding or a `::before` overlay rather than growing the visual.

## 4. Forms and data entry: 5/10

**Good:** `inputMode="decimal"` is centralised in [NumberInput.tsx:53](src/components/ui/NumberInput.tsx#L53), so every numeric field raises the numeric keypad. Labels are properly associated: mortgage fields carry `id="calc-field-…"` with matching `<label for>`. Selects and date pickers open as bottom sheets rather than native dropdowns.

**Problems:**

- **Every text input in the app is below 16px**, which makes iOS Safari zoom the page on focus and leaves it zoomed. Measured: Add Transaction fields 14px, mortgage fields 15px, Settings API key 14px, Drive client ID 13px, transaction search 13px, Compensation manual price **12px**. This is a one-line fix (`text-base` on mobile, or a global `@media (max-width: 767px) { input, textarea, select { font-size: 16px } }`) and it affects every form in the app.
- Planner inputs render 23px tall inside a 40px bordered box, so ~17px of the visible field is a dead zone that does not focus the input on tap. The `<label for>` saves it, but the box itself looks tappable and is not.
- Behaviour with the software keyboard open is **unverified**: sheets are `max-h-[90dvh]`, and `dvh` does not shrink for the iOS keyboard, so a focused field low in a tall sheet may sit behind the keyboard. Needs a device check.

## 5. Modals, sheets and overlays: 8/10

The strongest engineered piece of the mobile experience. [Sheet.tsx](src/components/ui/Sheet.tsx) gives every modal, on mobile, a bottom sheet with: `max-h-[90dvh]` and internal `overflow-y-auto` (measured 731px panel holding 1059px of Settings content, scrolling correctly); `paddingBottom: env(safe-area-inset-bottom)`; a drag handle with velocity-aware swipe-to-dismiss; scrim-tap and Escape dismissal with a module-level stack so only the topmost sheet closes; a focus trap and focus restore; body scroll lock; `useReducedMotion` honoured on both the enter/exit transform and the drag gesture; and a `dismissible={false}` mode for the required disclaimer.

**Problems:** the Close button is 28x28. The keyboard-overlap question above applies here. Otherwise this section is close to exemplary.

## 6. Dense data: lists, tables, portfolio: 8/10

**Good:** the transaction table is genuinely re-authored for mobile, not squeezed: a `md:hidden` card list replaces the desktop table, one card per transaction with description, amount, date and category stacked. Portfolio holdings become label/value pairs (Qty / Avg Cost / Price / Alloc / Book / Value) rather than a scrolling table. Result: **no horizontal scroll container anywhere on mobile**, on any route, at either width. 19 `hidden md:*` and 2 `md:hidden` swaps back this up in source.

**Problems:** long names truncate hard on the dashboard account cards, where the name column measures only 111-127px: "EQ Bank High Interest Savings" needs 185px, "Mortgage - 12 Maplewood Crescent" needs 220px and renders as roughly "Mortgage - 12 Ma…". Nine text nodes truncate on the dashboard at 320px. The value column is fixed-width and gets priority even when the value is short. Consider stacking name over value on mobile, or letting the name wrap to two lines.

## 7. Charts and visualisation: 7/10

**Good:** all Recharts containers are responsive and stay inside the viewport after a fresh render at both 375px and 320px. Axis ticks stay legible and abbreviate sensibly ($140k, $618k). Charts are lazy-loaded, so they are off the eager entry graph. Vesting and cash-flow charts reflow to the narrow column without clipping.

**Problems:** chart heights are fixed (`h-[400px]`), which is 49% of a 375x812 viewport for a single widget. Whether tooltips can be summoned by touch is **unverified**: synthetic touch and mouse events did not open a tooltip in this environment, but the environment could not run the pointer pipeline properly, so this is inconclusive rather than a defect. If tooltips are the only way to read a series value, that needs a tap-to-pin affordance on mobile; worth a two-minute check on a real phone.

## 8. Typography and readability: 7/10

Font-size census on the dashboard at 375px: 10px x6, 11px x11, 12px x16, 13px x10, 14px x31, 18px x14, 24px x6, 28px x4, 36px x1.

**Good:** the body tier is 14px, headings scale properly, numerals get real emphasis (28-36px on hero figures), and nothing relies on colour alone.

**Problems:** the 10px tier is the bottom-bar labels, and 11-13px carries a lot of genuinely useful secondary text (dates, category names, "under pace" / "over pace" hints, sync and version chips). On a phone that tier is small enough to be a squint. Consider lifting the 10-11px tier to 11-12px on mobile only.

## 9. Accessibility: 7/10

**Good, and verified:**

- **Contrast passes cleanly.** Composited-background contrast maths over 6 routes found **0 failures** out of 108 distinct colour/size/background combinations. The bottom bar measures 7.7:1 for inactive labels and 9.0:1 for the active one against its opaque `#0a0a0a`.
- The viewport meta is `width=device-width, initial-scale=1.0, viewport-fit=cover` with **no `user-scalable=no` and no `maximum-scale`**, so pinch-zoom works.
- Skip link, `aria-current="page"`, `aria-label` on every icon button ("Move Net Worth Over Time up", "Currency for VFV.TO", "Edit Rideshare"), `<label for>` on form fields, focus trap and focus restore in sheets, `useReducedMotion` respected.
- The dashboard reorder is desktop-gated (`draggable={isDesktop}`) with explicit up/down buttons as the touch path, rather than shipping HTML5 drag-and-drop that silently fails on touch. That is the right call.
- Error boundaries recover gracefully: a deliberately malformed grant produced a proper "Something went wrong" panel with Try again / Reload, not a white screen.

**Problems:** target size is the whole deduction. 13x13 checkboxes fail WCAG 2.5.8 (AA, 24px); the great majority of secondary controls fail 2.5.5 (AAA, 44px). Also the move up/down buttons at 30x30 are the designated *touch* affordance and are still under 44px.

## 10. Platform integration: PWA, safe areas, orientation: 6/10

**Good:** installable PWA with `display: standalone`, `start_url` and `scope` scoped to the base, 192/512 icons plus a dedicated 512 maskable icon. Service worker with `registerType: 'prompt'` and an `UpdateToast`, with the chart chunk deliberately precached and an `e2e/offline.spec.ts` guarding against a blank page offline. `viewport-fit=cover` plus `env(safe-area-inset-bottom)` on both the bottom bar and every sheet. `h-dvh` rather than `100vh`, so the iOS URL bar does not cause a jump.

**Problems:**

- Landscape (B1) is the big one.
- `index.html` has **no `<meta name="theme-color">`**, so the mobile browser chrome does not match the app, and the manifest hardcodes `theme_color: '#000000'` even though the app ships light themes. In standalone mode on Geometric Light the system bars will be black.
- No `apple-touch-icon` link. iOS 16.4+ reads manifest icons, so this is a fallback gap rather than a break.
- **Toasts ignore the safe area.** `UpdateToast` sits at `bottom-16` = 64px ([UpdateToast.tsx:12](src/components/ui/UpdateToast.tsx#L12)) while the bottom bar occupies 52px + `env(safe-area-inset-bottom)`, which is 86px on a home-indicator iPhone. The update prompt is therefore partly behind the nav bar on exactly the devices most likely to be used. `UndoToast` at `bottom-24` = 96px clears it by only 10px ([UndoToast.tsx:17](src/components/ui/UndoToast.tsx#L17)). Both should be `calc(<n>px + env(safe-area-inset-bottom))`.

---

## Recommended order of work

1. **B1** sidebar landscape clipping: a feature is unreachable; ~2 lines.
2. **B2** `flex-wrap` on the Compensation toggle row: a feature is unreachable; 1 line.
3. **16px inputs on mobile**: one global rule, removes iOS zoom from every form in the app.
4. **Shared checkbox size**: one component, fixes 9 sites and the WCAG 2.5.8 failure.
5. **Toast safe-area offsets**: 2 lines.
6. **B3** mobile search entry point: small feature, needs a design call on where it goes.
7. Icon-button 44px hit areas, dashboard name truncation, `theme-color` + `apple-touch-icon`.
8. Device check: keyboard overlap in tall sheets, and chart tooltips on touch.
