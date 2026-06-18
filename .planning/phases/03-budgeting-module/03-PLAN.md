# Phase 3: Budgeting Module - Plan

**Phase**: 3
**Goal**: Enable tracking of cash flow, income, and categorized expenses.

## 03-01: Build data entry forms and local state schema for budgeting

**Requirements**:
- Scaffold Zustand store for budgeting data (`useBudgetStore.ts`).
- Ensure time-filtering capabilities (default to calendar month).
- Build the `TransactionModal.tsx` dedicated modal overlay for entering income and expenses.
- Apply fixed standard categories.

**Tasks**:
- `[ ]` 1. **Budget Store setup**: Create `src/store/useBudgetStore.ts` using `zustand` to manage a list of transactions (income/expense). Include actions to add, edit, and delete transactions. Include a selector to filter transactions by the active calendar month.
- `[ ]` 2. **Types & Schema**: Define `Transaction`, `TransactionType`, and `TransactionCategory` interfaces inside the store file or a dedicated types file. Use fixed categories (e.g., Housing, Food, Transport, Utilities, Entertainment, Healthcare).
- `[ ]` 3. **Data Entry Modal Foundation**: Create `src/components/dashboard/modals/TransactionModal.tsx`. Use Framer Motion for a smooth overlay entrance.
- `[ ]` 4. **Modal Form Details**: Implement a form inside `TransactionModal` with fields for Amount, Type (Income/Expense toggle), Category (dropdown), Date, and Description. Ensure the modal styling conforms to the active theme (Tactical vs Geometric).
- `[ ]` 5. **Modal Integration**: Add a global "Add Transaction" FAB (Floating Action Button) or a header button in the layout/dashboard to trigger the modal state.

## 03-02: Develop categorized expense views and cash flow summaries

**Requirements**:
- Develop `CashFlowWidget.tsx`, `IncomeWidget.tsx`, and `ExpenseWidget.tsx`.
- Integrate them into the high-density Bento Grid layout map from Phase 2.

**Tasks**:
- `[ ]` 1. **Cash Flow Widget**: Create `src/components/dashboard/widgets/CashFlowWidget.tsx`. Calculate total income minus total expenses for the active month from `useBudgetStore`. Display a prominent net positive/negative number with a trend indicator.
- `[ ]` 2. **Income Widget**: Create `src/components/dashboard/widgets/IncomeWidget.tsx`. Display total income for the month and a brief list of the top 3 recent income transactions.
- `[ ]` 3. **Expense Widget**: Create `src/components/dashboard/widgets/ExpenseWidget.tsx`. Group expenses by category for the current month and display them as a list with progress bars or simple visual weight indicators reflecting the proportion of total expenses.
- `[ ]` 4. **Dashboard Integration**: Open `src/pages/Dashboard.tsx` (or where the Bento Grid is defined). Import the new widgets and place them within the `WidgetWrapper` components. Ensure the layout remains a cohesive, dense grid.
- `[ ]` 5. **Validation & Polish**: Ensure all widgets respond instantly to dual-theme toggling and the data dynamically updates when a new transaction is added via the modal. Write unit tests as per the validation strategy.
