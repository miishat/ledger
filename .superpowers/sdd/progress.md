# SDD Progress — UI Polish & Planner Enhancements

Plan: docs/superpowers/plans/2026-07-05-ui-polish-and-planner-enhancements.md
Branch: feat/ui-polish-planner-enhancements
Merge base: 32c7cd1

## Tasks (25 total)

Phase 1 Foundations: 1-5
Phase 2 Spacing (W0): 6-7
Phase 3 Small fixes: 8-12
Phase 4 Planner features: 13-18
Phase 5 Investments & structure: 19-25

## Completed

Task 1: complete (commits 32c7cd1..7e84868, review clean)
Task 2: complete (commits cd0ef89..69a0537, fix fd9b36a for ArrowUp+empty-options guard, review clean after fix)
Task 3: complete (commit 4f73f88, review clean — all native selects replaced, extra RrspVsTfsaCalculator site + em-dash caught beyond brief)
Task 4: complete (commit 278a411, review clean — all native date inputs replaced, extra CompareView/PositionCard sites caught beyond brief)
Task 5: complete (commit 8c793c6, review clean — CalculatorField suffix fix + Stat/EmptyState/Skeleton primitives). Phase 1 (Foundations) done.
Task 6: complete (commit 1fe24ee, review clean — planner hub per-group grid, BentoGrid untouched). Phase 2 started.
Task 7: complete (commit c08ae8b, review clean — input-grid normalization across Salary&Tax/SavingsGoal/DebtPayoff/Forecaster). Phase 2 (W0) done.
Task 8: complete (commit b198680, review clean — ThemeSelector theme-variable visibility fix). Phase 3 started.
Task 9: complete (commit pending, review clean — CompSnapshotWidget removed from Dashboard and deleted; Compensation page untouched).

## Minor findings (for final review triage)

- Task 1: OverlayBackdrop has aria-hidden + onClick (a11y smell, plan-mandated verbatim).
- Task 2: ThemedSelect highlight falls back to index 0 when value doesn't match any option (implicit, not tested); Escape-when-closed is a harmless no-op.
- Task 3: CompensationModal past-salary-change row with changeMonth=0 shows a blank ThemedSelect trigger instead of "None" (pre-existing data-shape quirk, not a regression from this task; fix is `change.changeMonth ? String(change.changeMonth) : ''`).
- Task 4: ThemedDatePicker has no keyboard nav (arrow keys, Escape-to-close) unlike native date input; view month doesn't resync if value changes externally while closed.
- Task 7: DebtPayoffCalculator's debt row grid jumps from 1 to 5 columns at `md` with no `sm:` intermediate step, unlike other rows in the file (matches brief verbatim, flagged as inconsistency only). Pre-existing (not this task's scope): an em dash in Forecaster's Coast-FI string; narrow-width input truncation.
- Task 8: ThemeSelector's `config.color` dot still uses hard-coded Tailwind colors (bg-emerald-400 etc.), out of this task's scope but a later theme-consistency pass may need it.
- Preview verification deferred for foundation tasks; consolidated preview pass needed at end.
- Pre-existing (not our regression): 66 full-suite test failures from localStorage.clear() TypeError in test env.
