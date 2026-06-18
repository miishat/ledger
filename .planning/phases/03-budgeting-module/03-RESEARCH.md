# Phase 03: Budgeting Module - Research

## Domain Knowledge
To implement the budgeting module, we need to handle tracking cash flow, income, and categorized expenses within the application. The phase relies heavily on the React (Vite SPA) stack, utilizing Tailwind CSS for styling and Zustand for state management. We also need to integrate with the Bento Grid layout from Phase 2.

## Component Structure & Integration
- **State Management:** A new `useBudgetStore.ts` utilizing Zustand needs to be created to manage budgeting state, avoiding bloating the existing `useDashboardStore.ts`.
- **Layout:** The budgeting widgets will be integrated into the main Dashboard layout grid built in Phase 2. They should be wrapped using the same `WidgetWrapper` component.
- **Widgets Needed:**
  - `CashFlowWidget.tsx` (BUDGET-01): Monthly cash flow tracking widget.
  - `IncomeWidget.tsx` (BUDGET-02): Income tracking widget.
  - `ExpenseWidget.tsx` (BUDGET-03): Categorized expense tracking widget.
- **Modals:** A dedicated modal component (e.g., `TransactionModal.tsx`) will be required for the entry of income and expenses as decided in `03-CONTEXT.md` (Decision D-01).

## Data Schema & State Strategy
- **Categorization:** Following Decision D-02, a fixed set of standard categories should be implemented (e.g., Housing, Food, Transport, Utilities, Entertainment, Healthcare).
- **Timeframe:** Based on Decision D-03, the state needs a mechanism to filter entries by the current calendar month.
- **Transaction Model:**
  ```typescript
  export type TransactionType = 'income' | 'expense';
  export type TransactionCategory = 'Housing' | 'Food' | 'Transport' | 'Utilities' | 'Entertainment' | 'Healthcare' | 'Other' | 'Salary' | 'Bonus' | 'Investment';
  
  export interface Transaction {
    id: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    date: string; // ISO date string
    description?: string;
  }
  ```

## UI/UX Considerations
- Strict adherence to the dual-theme system (Tactical Monospace and Geometric Abstraction) using CSS variables.
- Maintain a premium "engineering command center" design language for the widgets and the data entry modal.

## Validation Architecture
- **Unit Tests:** Test the Zustand store `useBudgetStore.ts` for correct aggregation of cash flow, income, and expenses for a given month.
- **Integration Tests:** Ensure widgets render correctly with empty states and populated states. Test the form modal for correct data submission.
