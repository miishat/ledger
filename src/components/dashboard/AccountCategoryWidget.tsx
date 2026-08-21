import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { WidgetWrapper } from './WidgetWrapper';
import { useAccountsStore } from '../../store/useAccountsStore';
import type { AccountType } from '../../store/useAccountsStore';
import { AddAccountModal } from './AddAccountModal';
import { EmptyState } from '../ui/EmptyState';
import { useUndoStore } from '../../store/useUndoStore';

interface AccountCategoryWidgetProps {
  title: string;
  type: AccountType;
  className?: string;
}

interface Account {
  id: string;
  name: string;
  value: number;
  type: AccountType;
}

const SINGULAR_NOUN: Record<AccountType, string> = {
  bank: 'bank account',
  investment: 'investment account',
  debt: 'debt',
  receivable: 'receivable',
  other: 'other asset',
};

export const AccountCategoryWidget: React.FC<AccountCategoryWidgetProps> = ({ title, type, className }) => {
  const { getAccountsByType, getTotalByType, removeAccount, addAccount } = useAccountsStore();
  const offerUndo = useUndoStore((s) => s.offerUndo);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const accounts = getAccountsByType(type);
  const total = getTotalByType(type);

  const handleAdd = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (acc: Account) => {
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const ActionButton = (
    <button
      onClick={handleAdd}
      className="flex items-center text-xs font-medium text-text-secondary hover:text-accent transition-colors px-2 py-1.5 -my-1.5 -mx-2 rounded-md"
    >
      <Plus size={16} className="mr-1" />
      Add
    </button>
  );

  return (
    <>
      <WidgetWrapper title={title} action={ActionButton} className={className}>
        <div className="flex flex-col h-full pt-2">
          <div className="text-[24px] font-bold text-text-primary mb-4 border-b border-border pb-3">
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[150px] pr-2 flex flex-col gap-2">
            {accounts.length === 0 ? (
              <EmptyState
                message="No accounts yet"
                hint={`Add your first ${SINGULAR_NOUN[type]} to start tracking.`}
                action={{ label: 'Add account', onClick: handleAdd }}
              />
            ) : (
              // On a phone the name column collapsed to about 115px while
              // real account names need 140px to 220px, so every name was
              // cut mid-word. Stacking name over value on mobile gives the
              // name the full card width; desktop keeps the single row.
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  data-testid={`account-row-${acc.id}`}
                  // desktop:flex-wrap: the value block is shrink-0 and, on the
                  // narrowest single-column tablet card (a widget with only
                  // one long-named, high-value row, e.g. the mortgage), its
                  // own content alone is nearly as wide as the whole row.
                  // flex-1 plus min-w-0 on the name would then get squeezed to
                  // 0 no matter how the name itself wraps. Allowing the row to
                  // wrap lets the value block drop to its own line instead,
                  // the same stacked look mobile already uses, only reached
                  // here by the content not fitting rather than by viewport.
                  className="flex flex-col items-start gap-0.5 desktop:flex-row desktop:flex-wrap desktop:justify-between desktop:items-baseline desktop:gap-2 group"
                >
                  <span
                    data-testid={`account-name-${acc.id}`}
                    // The value block and its two icon buttons are shrink-0, so
                    // on a 2-column tablet grid the name column collapsed to
                    // 11px while real names need 79px to 220px. Letting the
                    // name wrap instead of truncate keeps it readable at every
                    // width the single-line row is used at. desktop:min-w-[70px]
                    // gives the name a floor so the flex algorithm reports the
                    // line as too narrow to fit both children when the value
                    // block alone is nearly the full row width, which is what
                    // makes desktop:flex-wrap actually trigger instead of
                    // silently shrinking the name to 0.
                    className="text-sm text-text-secondary min-w-0 desktop:min-w-[70px] flex-1 break-words"
                  >
                    {acc.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 self-stretch justify-between desktop:self-auto desktop:justify-normal">
                    <span className="text-sm font-medium text-text-primary">
                      ${acc.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleEdit(acc)}
                      className="p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center text-text-secondary hover:text-accent sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded-md"
                      aria-label="Edit account"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        removeAccount(acc.id);
                        // The restored account gets a fresh id, because addAccount mints
                        // one; that is acceptable since nothing else references an
                        // account id today.
                        offerUndo(`Deleted account "${acc.name}"`, () =>
                          addAccount({ name: acc.name, value: acc.value, type: acc.type }),
                        );
                      }}
                      className="p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center text-text-secondary hover:text-error sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded-md"
                      aria-label={`Delete ${acc.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </WidgetWrapper>

      <AddAccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultType={type} 
        editingAccount={editingAccount}
      />
    </>
  );
};
