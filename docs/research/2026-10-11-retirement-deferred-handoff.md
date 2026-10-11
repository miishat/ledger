# Retirement contributions: deferred implementation

Date: 2026-10-11
Status: Deferred by the user. The C1 sections were more complex than wanted. Restore the existing calculator screens and retain the implementation, notes and research for possible future use. This is not permanent acceptance.

## Preserved implementation

- Branch: `codex/retirement-c1-review`
- Worktree: `C:/Users/misha/.codex/worktrees/retirement-c1-review/ledger`
- Complete implementation and delivery snapshot: `35d66d240d016bcf2b43aa048601933f2556995a`.
- Reviewed source commit: `58734501ccc33d028bbaae9328462d4bcaf8ccd6`
- Original app baseline: `8b31993c1cddf4a38b4a98c43f306c44d26f22fa`
- Original prototype branch: `codex/retirement-ui-prototype`, worktree `C:/Users/misha/.codex/worktrees/retirement-ui-prototype/ledger`.

The implementation was never merged into main. Keep both worktrees and their Git history. No source code needs to be deleted or reversed to restore the existing main-app screens.

## Research and evidence

Retain `docs/research/canadian-retirement-contributions.md`, the source and app audits under `docs/research/`, `docs/superpowers/specs/2026-10-10-retirement-contributions-design.md`, and the implementation/validation documents under `docs/superpowers/plans/` in the preserved implementation worktree. Original research and mockups also remain in the main checkout. Detailed local implementation and review reports remain in the preserved worktree's ignored `.superpowers/sdd/` folder.

The final source passed 1,891 unit/integration tests, 286 browser tests and all build gates, with five existing viewport-specific skips. Technical approval does not imply the user accepted the UI. The validation report records its environment limits and the transient existing Dashboard test failure followed by unchanged isolated and full passes.

## Future reuse

Reuse the calculation engine, matching contracts, typed persistence/migration, shared profile, lossless transfer and Forecaster integration, plus their tests. These are already implemented on the preserved branch. Revisit the screen organization and the desired small initial scope with the user before exposing the feature again. Do not automatically restore the five-step C1 interface or merge the full branch.

Before reactivation, verify current main changes, refresh time-sensitive Canadian rules and tax tables, then adapt the preserved branch or selectively port the agreed pieces. Saved browser data from the retired review origin is left intact; the restored preview uses a different port so the earlier review data is not rewritten by the older app.

Restored local preview: `http://127.0.0.1:5187/ledger/`, served from the existing main checkout. Salary & Tax and Compensation were checked in the browser after switching their tabs to this preview.
