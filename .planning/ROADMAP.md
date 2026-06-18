# Roadmap: Financial Dashboard

## Overview

Building a highly scalable, cross-platform financial dashboard web app featuring a strict modular architecture with a high-density Bento Grid layout and an unapologetically premium dual-theme system.

## Phases

- [ ] **Phase 1: Foundation & Theming** - Vite, Tailwind, Framer Motion setup, routing, and dual-theme (Tactical/Geometric) system.
- [x] **Phase 2: Master Dashboard & Layout** - Bento Grid layout and high-level Net Worth aggregation widgets. (completed 2026-06-18)
- [x] **Phase 3: Budgeting Module** - Cash flow, income, and categorized expense tracking. (completed 2026-06-18)
- [ ] **Phase 4: Investment Tracker** - "Investment Plan vs. Actual" Recharts visualizations.
- [ ] **Phase 5: Future Projections** - Forecasting tools for savings rates and compounding interest.
- [ ] **Phase 6: Total Compensation Calculator** - Base, bonus, and RSU/Options vesting tracker.

## Phase Details

### Phase 1: Foundation & Theming

**Goal**: Establish Vite project, global routing, PWA shell, and dual-theme switching architecture.
**Depends on**: Nothing
**Requirements**: [NAV-01, NAV-02]
**Success Criteria** (what must be TRUE):

  1. User can load the PWA with offline support.
  2. User can toggle between Tactical Monospace and Geometric Abstraction themes.
  3. User can navigate via Sidebar/Top bar to empty modules.

**Plans**: 2 plans

Plans:

- [ ] 01-01: Initialize Vite app, Tailwind, and Framer Motion foundation.
- [ ] 01-02: Implement dual-theme system, global nav, and PWA configuration.

### Phase 2: Master Dashboard & Layout

**Goal**: Build the core high-density Bento Grid layout and Master Dashboard.
**Depends on**: Phase 1
**Requirements**: [DASH-01, DASH-02, DASH-03]
**Success Criteria** (what must be TRUE):

  1. Master Dashboard displays mock net worth and account widgets.
  2. Bento Grid layout accepts and renders child widgets correctly.

**Plans**: 2 plans

Plans:

- [x] 02-01: Develop strict Bento Grid component wrapper architecture.
- [x] 02-02: Build Net Worth, assets, and liabilities widgets with local state.

### Phase 3: Budgeting Module

**Goal**: Enable tracking of cash flow, income, and expenses.
**Depends on**: Phase 2
**Requirements**: [BUDGET-01, BUDGET-02, BUDGET-03]
**Success Criteria** (what must be TRUE):

  1. User can manually enter and view categorized expenses.
  2. Monthly cash flow is accurately calculated and displayed.

**Plans**: 2 plans
Plans:
**Wave 1**

- [x] 03-01: Build data entry forms and local state schema for budgeting.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02: Develop categorized expense views and cash flow summaries.

### Phase 4: Investment Tracker

**Goal**: Visual comparison of target vs actual investments using Recharts.
**Depends on**: Phase 3
**Requirements**: [INVEST-01, INVEST-02]
**Success Criteria** (what must be TRUE):

  1. User sees "Investment Plan vs. Actual" charts using Recharts.
  2. Charts correctly transition colors when switching global themes.

**Plans**: 1 plan

Plans:

- [ ] 04-01: Implement Investment Tracker Recharts with dynamic Tailwind variable styling.

### Phase 5: Future Projections

**Goal**: Forecasting tool for future net worth based on compounding interest.
**Depends on**: Phase 4
**Requirements**: [PROJ-01, PROJ-02, PROJ-03]
**Success Criteria** (what must be TRUE):

  1. User can input current savings rates and interest assumptions.
  2. Recharts line graph visualizes estimated future net worth.

**Plans**: 1 plan

Plans:

- [ ] 05-01: Develop projection calculation logic and visualization UI.

### Phase 6: Total Compensation Calculator

**Goal**: Break down and visualize total employment compensation.
**Depends on**: Phase 5
**Requirements**: [COMP-01, COMP-02]
**Success Criteria** (what must be TRUE):

  1. User can enter base salary, bonuses, and benefits.
  2. User can define and track RSU/Options vesting schedules.

**Plans**: 2 plans

Plans:

- [ ] 06-01: Build base comp and cash bonus tracker.
- [ ] 06-02: Build equity (RSU/Options) vesting schedule calculator and charts.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Theming | 0/2 | Not started | - |
| 2. Master Dashboard & Layout | 2/2 | Complete   | 2026-06-18 |
| 3. Budgeting Module | 2/2 | Complete   | 2026-06-18 |
| 4. Investment Tracker | 0/1 | Not started | - |
| 5. Future Projections | 0/1 | Not started | - |
| 6. Total Comp Calculator | 0/2 | Not started | - |
