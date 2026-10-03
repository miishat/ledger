# Phone layout rules

Ledger's desktop layout was designed; its phone layout used to be the desktop
grid stacked into one column. These rules are the phone design. Every new page,
card or list follows them, and each rule names the guard that holds it.

"Phone" means the `desktop` variant does not match: narrower than 768px or
shorter than 500px. In code that is `useIsDesktop() === false`, and in class
names the `desktop:` prefix marks desktop-only styles.

## 1. The top bar names the page and holds its main action

Pages render their header through `PageHeader` (`src/components/ui/PageHeader.tsx`).
On a phone the title and the one main action (`phoneAction`, a `TopBarAction`)
move into the top bar, replacing the Ledger mark. Subtitles are desktop only.
The page's `<h1>` stays in `<main>`, visually hidden, so the outline and skip
link do not change. Secondary controls (a month stepper, an import button) sit
in one compact row at the top of the page, never in the top bar.

The phone action keeps the desktop button's accessible name.

Guard: `e2e/mobile-guards.spec.ts`, "names itself in the top bar".

## 2. Switching pages starts at the top

`<main>` is the scroll container, so the browser does not reset it between
routes. Layout resets it on every pathname change. A tab change inside a page
(`?tab=`) does not reset it.

Guard: `e2e/mobile-guards.spec.ts`, "starts the new page at the top".

## 3. Each page leads with its one key number

| Page | Key figure | Element |
| --- | --- | --- |
| Dashboard | Net worth | `NetWorthWidget` headline |
| Budgeting | This period's net change | `MonthlySummaryWidget` Net Change |
| Investments (Portfolio tab) | Portfolio value | `PortfolioSummary` headline |
| Compensation | Total compensation | `CompHeroWidget` centre figure |
| Planner index | None: it is a menu | |

The element carries `data-key-figure`. On a portrait phone it must end above
the bottom 60px of the first screen without scrolling. Landscape phones are
scroll-first and exempt.

Guard: `e2e/mobile-guards.spec.ts`, "shows its key figure in the first screen".

## 4. Lists never scroll inside the page

A scroll area inside a scrolling page traps the thumb. On a phone a list inside
a card shows its first `PHONE_LIST_LIMIT` (5) items and a "Show all N" button.
Holdings show `PHONE_HOLDINGS_LIMIT` (8) per account. Here "phone" means
below the `wide` breakpoint (912px), which includes tablet portrait. A list only one item over
its cap is shown whole, because a button that reveals one row costs more space
than the row. Use `useShowMore` (`src/hooks/useShowMore.ts`) and
`ShowMoreButton` (`src/components/ui/ShowMoreButton.tsx`).

Desktop keeps its fixed-height scroll lists: there the cards sit side by side
and must line up.

Guard: `e2e/mobile-guards.spec.ts`, "has no list that scrolls inside the page".

## 5. Empty cards take one line

An empty account-group card on the Dashboard, on a phone, is its title, its
add action, and one sentence. No illustration, no zero total, no second add
button. Page-level empty states are the exception: an empty Portfolio, an empty
Package Details card on Compensation, and an empty Journal keep a labelled add
button, because the top-bar action on a phone is only an icon.

## 6. Charts read at 375px

At 375px every chart label is at least 12px and no two labels overlap. A chart
that would draw more than about six labelled categories down one side groups
the smallest into "Other" on a phone (`foldSmallest` in
`src/utils/budget/foldSmallest.ts`). The accessible description still reports
the real counts.

Guards: `e2e/mobile-guards.spec.ts`, "no chart text escapes the document
viewport" and "a chart reveals its values on tap".

## 7. Rows, not cards, for repeated records

A repeated record on a phone (a holding; below the `wide` breakpoint, 912px,
so tablet portrait too) is one row: identity on the left, the
number that matters on the right, everything else one tap away behind a
disclosure. A record should cost about 56px, not 220px.

## Deliberately not done

- **Document scroll on phones.** It would let iOS collapse the Safari address
  bar, but the installed app has no address bar, and `useScrollLock` freezes
  `body`, which iOS ignores for document scroll. Revisit only together with a
  scroll lock that works on iOS.
- **Floating add button, swipe between tabs, collapsing headers.** Declined in
  July 2026 and again in October 2026. Rule 1 covers reachability.
