# Task 1 Report: OverlayBackdrop component + ToolSwitcher blur (W5)

## Status: DONE

## What was built

1. **`src/components/ui/OverlayBackdrop.tsx`** (new) — shared `fixed inset-0` blurred
   backdrop primitive: `bg-black/50 backdrop-blur-md animate-fade-in`, `z-20`,
   `data-testid="overlay-backdrop"`, calls `onClose` on click, `aria-hidden="true"`.
   Matches the existing CompensationModal overlay treatment. Verified `animate-fade-in`
   is an existing utility already used across the codebase (App.css / index.css and
   several components), so no new CSS was required.

2. **`src/components/ui/OverlayBackdrop.test.tsx`** (new) — RTL test per the brief:
   renders the backdrop, asserts `backdrop-blur-md` and `bg-black/50` classes are
   present, fires a click, asserts `onClose` was called once.

3. **`src/components/planner/ToolSwitcher.tsx`** (modified) — imported
   `OverlayBackdrop` from `../ui/OverlayBackdrop`; wrapped the existing
   `{open && (<div role="menu" ...>...)}` block in a fragment with
   `<OverlayBackdrop onClose={() => setOpen(false)} />` rendered as a sibling BEFORE
   the menu panel. Menu panel kept its existing `z-30`. All existing group/tool
   mapping logic, the `pointerdown`/`Escape` window listeners, and the trigger button
   were left untouched, exactly per the brief's Step 5 instructions.

## TDD evidence

### RED (Step 2)
Ran `npx vitest run src/components/ui/OverlayBackdrop.test.tsx` before creating the
component (test file existed, component did not):

```
FAIL  src/components/ui/OverlayBackdrop.test.tsx [ src/components/ui/OverlayBackdrop.test.tsx ]
Error: Failed to resolve import "./OverlayBackdrop" from "src/components/ui/OverlayBackdrop.test.tsx". Does the file exist?
```

This matches the brief's expected failure exactly ("cannot resolve `./OverlayBackdrop`").

Note: `node_modules` was not present in the working tree at task start; `npm install`
was run once to restore the environment (582 packages, 0 vulnerabilities) before any
test could execute at all. This is an environment-setup step, not part of the
TDD cycle itself.

### GREEN (Step 4)
After creating `OverlayBackdrop.tsx`:

```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

### Full suite (Step 2 of instructions: run `npx vitest run` once before committing)

```
 Test Files  17 failed | 31 passed (48)
      Tests  66 failed | 163 passed (229)
```

The 17 failing files/66 failing tests are **pre-existing and unrelated** to this
change — they all fail with `TypeError: Cannot read properties of undefined
(reading 'clear')` at `localStorage.clear()` calls in `beforeEach` hooks (e.g.
`BackupControls.test.tsx`, `marketDataService.test.ts`, `useMarketData.test.tsx`),
indicating a broken/missing `localStorage` polyfill in the test environment
unrelated to OverlayBackdrop or ToolSwitcher.

Confirmed via `git stash` baseline comparison (stashed my changes, reran full
suite, restored): baseline was **17 failed / 30 passed (47 files)**, 66 failed /
162 passed (228 tests) — identical failure count, one fewer passing test (my new
test file). After restoring my changes: 17 failed / 31 passed (48 files), 66
failed / 163 passed (229 tests). My change adds exactly one new passing test and
introduces zero new failures.

No `OverlayBackdrop` or `ToolSwitcher` tests appear anywhere in the failing list.

### Typecheck and lint
- `npx tsc --noEmit` — clean, no output/errors.
- `npx eslint src/components/ui/OverlayBackdrop.tsx src/components/ui/OverlayBackdrop.test.tsx src/components/planner/ToolSwitcher.tsx` — clean, no output/errors.

## Files changed

- `src/components/ui/OverlayBackdrop.tsx` (new)
- `src/components/ui/OverlayBackdrop.test.tsx` (new)
- `src/components/planner/ToolSwitcher.tsx` (modified — wrapped open-menu block)

## Commit

```
7e84868 feat: shared OverlayBackdrop with blur, adopted by planner ToolSwitcher
 3 files changed, 72 insertions(+), 35 deletions(-)
```

(Note: some pre-existing files under `.claude/skills/subagent-driven-development/scripts/`
showed permission-bit-only diffs (0 insertions/deletions) unrelated to this task;
they were intentionally left unstaged/uncommitted.)

## Self-review

- Diff matches the brief's Step 5 snippet exactly: fragment wrapping
  `OverlayBackdrop` + existing `role="menu"` div, `z-30` preserved on the panel,
  `z-20` on the backdrop (backdrop behind, panel above — correct stacking).
- No hard-coded theme-violating classes introduced (`grep` for
  `text-gray-|bg-white|text-red-|text-black|bg-gray-` across both touched files
  returned no matches). The `bg-black/50` scrim color is an explicit design choice
  from the brief (matches existing CompensationModal pattern) — it's an overlay
  scrim, not a themeable text/surface color, so it does not fall under the
  "never hard-code" constraint for theme colors.
- No em dashes introduced in user-facing strings (none of the touched code has
  user-facing copy — this is UI structure/behavior only).
- Existing window `pointerdown`/`keydown` (Escape) listeners in ToolSwitcher were
  left completely unchanged, as instructed — the backdrop's `onClick` is an
  additional/redundant close path for direct clicks, consistent with the brief's
  note that clicking anywhere outside the menu should close it.
- `aria-hidden="true"` on the backdrop is appropriate since it's a purely visual
  scrim with no semantic content; the interactive menu itself retains its
  `role="menu"`/`role="menuitem"` semantics untouched.

## Concerns

- **Preview verification deferred** per explicit instruction (Step 6 skipped) —
  visual confirmation of the blur effect and click-to-close behavior in
  `/planner/mortgage` was not performed in this task; relying on unit tests as
  the gate, with the controller's consolidated preview pass to follow.
- `node_modules` was missing at task start; `npm install` was required before any
  test tooling worked. This is now resolved and does not affect any other
  in-progress work, but is worth noting in case the environment is expected to be
  pre-provisioned for downstream tasks (Tasks 2, 4, 16 consuming this primitive).
- The full test suite has 66 pre-existing failures unrelated to this task
  (`localStorage.clear()` TypeError across multiple test files). Not introduced by
  this change and out of scope to fix here, but flagged for visibility since later
  tasks in this plan will also be gated by "run `npx vitest run` once" and will
  see the same baseline failures.
