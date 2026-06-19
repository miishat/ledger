# Requirements: v1.1 Budgeting Automation

## User Stories

1. **Transaction CSV Import & Inbox:** As a user, I want to upload CSV files from major banks (RBC, Scotiabank, TD) and triage them in an "Inbox" UI instead of entering transactions one by one.
2. **Smart Categorization Engine:** As a user, I want the system to learn my categorization rules (a local memory engine) so that future imports are automatically categorized.
3. **Flexible Budgeting Paradigms:** As a user, I want to choose between Target-Based, Zero-Based, or Ledger Custom (default) budgeting paradigms, so the system matches my strictness level.
4. **Visual Triage & Reallocation:** As a user, I want a premium, fast visual interface for reallocating funds when I overspend, rather than dealing with spreadsheets.

## Functional Requirements

- **CSV Parsing:**
  - Support pre-defined mappings for RBC, Scotiabank, TD bank.
  - Generic column mapper for unknown CSVs.
- **Transaction Inbox UI:**
  - A Tinder/Inbox-style review flow for newly imported, uncategorized transactions.
  - Auto-categorize transactions that match rules in the local memory.
- **Rules Engine (Local Memory):**
  - Store substring-based rules in Zustand (e.g., "UBER" -> "Transportation").
  - Allow user to view and edit these rules.
- **Budgeting Engine & Paradigms:**
  - Store user's selected paradigm setting in Zustand.
  - Target-Based mode: Passive tracking against targets.
  - Zero-Based mode: Strict enforcement that total assigned + spent = income. Requires reallocation to fix overspending.
  - Ledger Custom mode: Passive tracking with optional "cover this overspending" actions.

## Non-Functional Requirements

- **Performance:** CSV parsing and rules engine must run locally and instantly via the browser (no server).
- **UI/UX:** Must maintain the premium, high-density Bento Grid aesthetic. No generic data grid tables for CSV triage.
