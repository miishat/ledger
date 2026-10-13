import type { Transaction, TransactionSplit } from '../../types/budget';
import { round2 } from './splits';

export type TransactionEntryKind = 'expense' | 'income' | 'refund-payment';

export function entryKindOf(tx: Pick<Transaction, 'type' | 'amount'>): TransactionEntryKind {
  return tx.type === 'expense' && tx.amount < 0 ? 'refund-payment' : tx.type;
}

export function cashMovement(tx: Pick<Transaction, 'type' | 'amount'>): number {
  return tx.type === 'income' ? tx.amount : -tx.amount;
}

/** Encode validated positive form magnitudes using the canonical sign. */
export function encodeEntryAmounts(
  kind: TransactionEntryKind,
  amount: number,
  slices: TransactionSplit[] = [],
): Pick<Transaction, 'type' | 'amount' | 'splits'> {
  const sign = kind === 'refund-payment' ? -1 : 1;
  const splits = slices.map(p => ({ ...p, amount: sign * round2(p.amount) }));
  return {
    type: kind === 'income' ? 'income' : 'expense',
    amount: sign * round2(amount),
    splits: splits.length ? splits : undefined,
  };
}
