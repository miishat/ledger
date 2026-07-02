# Ledger v2.0 — Progress Tracker

> **Fable 5: this is your resume anchor.** Read it first on every "continue". Keep it accurate — update it in (or immediately after) the same commit as each task. If it disagrees with `git log`, trust git and reconcile.

**Milestone:** v2.0 (see `2026-07-02-ledger-v2-master-plan.md`)

## Current position

- **Current phase:** 2 — Market Data Service
- **Phase plan:** `2026-07-02-phase-2-market-data.md` (written by Opus planning subagent, 8 tasks)
- **Last completed task:** Phase 2, Task 4 — Frankfurter FX provider adapter (commit 981ca4e)
- **Next task:** Phase 2, Task 5 — Persisted market-data cache store + backup registration
- **Status:** IN PROGRESS (branch `ledger-v2`)

**Note:** `npm run lint` has 287 pre-existing errors from v1.0 (none in files this milestone touched — all branch files lint clean). The per-phase "lint clean" gate is applied to changed files until the pre-existing debt is addressed; surfaced to the user 2026-07-02.

## Phase checklist

- [x] Phase 1 — Foundation: Save + PWA + Mobile base (2026-07-02)
- [ ] Phase 2 — Market Data Service *(plan JIT)*
- [ ] Phase 3 — Compensation: live price + CAD toggle *(plan JIT)*
- [ ] Phase 4 — Planner (tools/calculators hub) *(plan JIT; split if >12 tasks)*
- [ ] Phase 5a — Investments: Plan vs Actual *(plan JIT)*
- [ ] Phase 5b — Investments: Portfolio Viewer *(plan JIT)*
- [ ] Phase 6 — Budgeting enhancements *(plan JIT)*
- [ ] Phase 7 — UI/UX 2026 refresh + Dashboard polish *(plan JIT)*

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
