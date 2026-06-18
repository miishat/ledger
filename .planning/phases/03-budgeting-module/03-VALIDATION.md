---
phase: 3
slug: budgeting-module
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-18
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | src/setupTests.ts |
| **Quick run command** | `npm run test --run` |
| **Full suite command** | `npm run test --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --run`
- **After every plan wave:** Run `npm run test --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | BUDGET-01 | — | N/A | unit | `npm run test --run useBudgetStore.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 2 | BUDGET-01 | — | N/A | unit | `npm run test --run CashFlowWidget.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | BUDGET-02, BUDGET-03 | — | N/A | unit | `npm run test --run IncomeWidget.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | BUDGET-02, BUDGET-03 | — | N/A | unit | `npm run test --run ExpenseWidget.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 3 | BUDGET-01, BUDGET-02, BUDGET-03 | — | N/A | unit | `npm run test --run TransactionModal.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/store/useBudgetStore.test.ts` — stubs for BUDGET-01
- [ ] `src/components/dashboard/widgets/CashFlowWidget.test.tsx` — stubs for BUDGET-01
- [ ] `src/components/dashboard/widgets/IncomeWidget.test.tsx` — stubs for BUDGET-02
- [ ] `src/components/dashboard/widgets/ExpenseWidget.test.tsx` — stubs for BUDGET-03
- [ ] `src/components/dashboard/modals/TransactionModal.test.tsx` — stubs for data entry modal

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual Theme Adherence | BUDGET-01, BUDGET-02, BUDGET-03 | UI styling cannot be easily tested by unit tests | Toggle between Tactical and Geometric themes to visually inspect widget styling and modal layout. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
