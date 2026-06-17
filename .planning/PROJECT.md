# Financial Dashboard Web App

## What This Is

A highly scalable, cross-platform financial dashboard web app designed to give users deep, actionable insights into their financial health. It features a strict modular architecture with a high-density Bento Grid layout and an unapologetically premium dual-theme system (Tactical Monospace and Geometric Abstraction).

## Core Value

A striking, uncompromising user experience that makes managing personal wealth feel like operating a premium engineering command center.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Scaffold Global Navigation for module switching and theme toggling
- [ ] Implement dual-theme system (Tactical Monospace vs. Geometric Abstraction) using Tailwind CSS
- [ ] Build high-density Bento Grid layout map with strictly self-contained component wrappers
- [ ] Develop Master Dashboard (Net Worth) view
- [ ] Develop Budgeting Module for tracking cash flow and expenses
- [ ] Develop "Investment Plan vs. Actual" Tracker using Recharts
- [ ] Develop Future Projections visualization tool
- [ ] Develop Total Compensation Calculator (base, bonus, equity tracker for RSUs/Options)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- [Live Bank Sync (e.g., Plaid)] — Deferred for v1 to focus on local-first PWA and core layout foundations.
- [Complex Backend Database] — Starting with Vite SPA + LocalStorage for a fast, client-side PWA architecture.

## Context

- The app acts as a PWA with local-first persistence (LocalStorage).
- UI aesthetic is paramount: strictly no generic Bootstrap-style templates. The design language must impress power users with high-contrast, strictly structured aesthetics.
- Architecture relies on a component-based model where widget cards accept only children, decoupling the layout from the widget logic entirely.

## Constraints

- **Tech Stack**: React (Vite SPA), Tailwind CSS, Framer Motion — Ensures rapid client-side performance, fluid animations, and easy theme switching.
- **State Management**: Zustand or React Context — For managing global financial data locally.
- **Data Visualization**: Recharts — Selected over Chart.js because SVG-based rendering natively supports Tailwind CSS variables for seamless real-time theme swapping.
- **Design Layout**: High-density Bento Grid — Row-based equal-sized cards are forbidden to avoid the "generic template" look.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vite + LocalStorage | Prioritize local-first, blazing-fast PWA performance over immediate server/database complexity. | — Pending |
| Manual Data Entry | Focus on building core UI/UX features and charting logic before tackling 3rd-party financial APIs like Plaid. | — Pending |
| Recharts for Charts | SVG-based charts support CSS variables natively, enabling instant, redraw-free theme transitions between Dark/Light modes. | — Pending |
| Bento Grid Component Architecture | Cards act only as layout wrappers taking `children`, enabling easy drag-and-drop or 1-line swaps in the layout map. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-17 after initialization*
