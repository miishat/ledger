# Ledger v2.0 — Progress Tracker

> **Fable 5: this is your resume anchor.** Read it first on every "continue". Keep it accurate — update it in (or immediately after) the same commit as each task. If it disagrees with `git log`, trust git and reconcile.

**Milestone:** v2.0 (see `2026-07-02-ledger-v2-master-plan.md`)

## Current position

- **Current phase:** 4 — Planner (tools/calculators hub)
- **Phase plan:** umbrella `2026-07-02-phase-4-planner.md` + sub-plans 4a-4e — **ALL written in full** (4b/4c/4d/4e written 2026-07-03; 4d includes sourced 2026 CRA/provincial tax tables)
- **Later phase plans:** ALSO written in full (2026-07-03) — `…phase-5a-plan-vs-actual.md`, `…phase-5b-portfolio-viewer.md`, `…phase-6-budgeting-enhancements.md`, `…phase-7-uiux-refresh.md`. No JIT planning remains; execute plans in order.
- **Testing policy change (user, 2026-07-03):** plans 4b onward keep TDD only for pure math/store modules; UI components get no dedicated test files (covered by the registry-driven hub test + manual gates). Tests are not a priority this release.
- **Last completed task:** Phase 4b, Task 4 — Raise/Inflation calculator (commit b652c99)
- **Next task:** Phase 4b, Task 5 — sub-phase gate (verification, mobile + 5 themes)
- **Status:** IN PROGRESS (branch `ledger-v2`)

**Note:** `npm run lint` has 287 pre-existing errors from v1.0 (none in files this milestone touched — all branch files lint clean). The per-phase "lint clean" gate is applied to changed files until the pre-existing debt is addressed; surfaced to the user 2026-07-02.

## Phase checklist

- [x] Phase 1 — Foundation: Save + PWA + Mobile base (2026-07-02)
- [x] Phase 2 — Market Data Service (2026-07-02)
- [x] Phase 3 — Compensation: live price + CAD toggle (2026-07-02)
- [ ] Phase 4 — Planner (tools/calculators hub) *(plans written: 4a-4e)*
- [ ] Phase 5a — Investments: Plan vs Actual *(plan written)*
- [ ] Phase 5b — Investments: Portfolio Viewer *(plan written)*
- [ ] Phase 6 — Budgeting enhancements *(plan written)*
- [ ] Phase 7 — UI/UX 2026 refresh + Dashboard polish *(plan written)*

## Log (append one line per completed task)

<!-- e.g. "2026-07-02 P1.T1 backup core — commit abc1234" -->
2026-07-02 P1.T1 backup export/import core — commit baf5f63 (review clean; + a4ed65a npm test script)
2026-07-02 P1.T2 backup blob/filename/parse helpers — commits 16ffd07 + 7cfb265 (review clean after DRY fix)
2026-07-02 P1.T3 backup UI in nav dock — commits 3fbe5a8 + 7cc061d (added --error token to all 6 themes; input reset fix)
2026-07-02 P1.T4 PWA manifest + real icons — commits e85ed42 + cff1893 (sharp devDep; fixed pre-existing tsc blocker in T3 test)
2026-07-02 P1.T5 mobile viewport-fit + overflow guards — commit 0fe19c3 (review clean)
2026-07-02 P1.T6 phase gate — tests 12/12, build OK, branch files lint-clean (287 pre-existing v1.0 lint errors flagged), 375px no-overflow verified on all 5 routes in live preview, backup UI + error token verified live
2026-07-02 P2.T1 market-data types + date helpers — commit 577bff1 (review clean)
2026-07-02 P2.T2 cache keys + throttle/single-flight — commits 1378107 + 96a5d21 (review clean after coverage additions)
2026-07-02 P2.T3 Yahoo provider adapter — commit e398bc2 (review clean)
2026-07-02 P2.T4 Frankfurter FX adapter — commit 981ca4e (review clean; implementer cut off by session limit, tests verified by controller)
2026-07-02 P2.T5 market-data cache store + backup registration — commit c8a7f53 (review clean)
2026-07-02 P2.T6 market-data service facade — commit c125e72 (review clean; 2 triage notes for final review)
2026-07-02 P2.T7 market-data hooks + barrel — commits 8d4ee0b + b831868 (review clean after unmount-guard/override-subscription fixes)
2026-07-02 P2.T8 phase gate — commit 217757d fixed tsc vitest-globals types + set-state-in-effect lint; 51/51 tests, build OK, changed files lint clean, ledger-market-data in BACKUP_KEYS
2026-07-02 P3.T1 useCadConversion toggle in compensation store — commit 101d040 (review clean)
2026-07-02 P3.T2 convertPackageToCad pure FX layer — commit e5201c0 (review clean)
2026-07-02 P3.T3 useCompensationDisplay hook + companyTicker field — commits d9028e6 + 71aa856 (review caught live-price/CAD-toggle coupling; fixed)
2026-07-02 P3.T4 Compensation page live-price bar + CAD toggle — commit de94b4c (review clean)
2026-07-02 P3.T5 widgets read converted package — commit 5259588 (review clean)
2026-07-02 P3.T6 conversion correctness tests — commit b557c4e (plan's ESPP×FX expectation was mathematically wrong; amended to FX-invariant, reviewer-verified)
2026-07-02 P3.T7 CompensationModal ticker field — commit 52cb8ec (review clean)
2026-07-02 P3.T8 phase gate — 71/71 tests, build OK, changed files lint clean (+0513003 pre-existing lint fix); live-verified at 375px in all themes: modal ticker field, price bar, refresh, manual set, CAD toggle ON/OFF with FX fallback, no overflow
2026-07-02 P4a.T1 planner store (ledger-planner) + backup registration — commit 4c11b3c (review clean)
2026-07-02 P4a.T2 compound-interest math module — commit 623f23a (review clean, math independently verified)
2026-07-02 P4a.T3 savings-goal solvers — commit 04705ca (review clean, math independently verified)
2026-07-02 P4a.T4 calculator UI primitives — commit 5d9c33d (review clean)
2026-07-03 planning — wrote all remaining JIT plans in full: 4b, 4c, 4d (2026 CRA tables sourced + cited), 4e, 5a, 5b, 6, 7; minimal-test policy applied per user
2026-07-03 P4a.T5 Planner hub + tool registry + routes (Projections removed) — commit 03c4c2f (review clean; recovered from interrupted session)
2026-07-03 P4a.T6 Compound Interest calculator — commit dbfe728 (review clean; CalculatorField htmlFor/id a11y fix folded in, adjudicated OK)
2026-07-03 P4a.T7 Savings Goal calculator (solve any variable) — commit a0ff23f (review clean)
2026-07-03 P4a.T8 sub-phase gate — 112/112 tests, build OK after Recharts Tooltip typing fix (f79e7c7), changed files lint clean; live-verified: nav rename, /projections redirect, 3 tiles, invalid-id bounce, both calculators compute + persist across reload, all 4 solve-for modes, 5 themes on 3 routes (chart uses theme accent), 375px no-overflow/single-column tiles/2-col fields. Known: full-width sidebar squeezes 375px content (labels crowd) — Phase 7 reflow, logged since P1.
2026-07-03 P4b.T1 pure budget selectors (monthly totals, rolling averages) — commit 76ab10d (review clean)
2026-07-03 P4b.T2 Emergency Fund calculator (budget-average prefill) — commit 50cd3fc (review clean)
2026-07-03 P4b.T3 Currency Converter (live FX + manual fallback) — commit 422b22a (review clean)
2026-07-03 P4b.T4 Raise/Inflation calculator (Fisher real raise) — commit b652c99 (review clean)
