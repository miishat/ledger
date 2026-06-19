import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { WidgetWrapper } from './WidgetWrapper';
import { useAccountsStore } from '../../store/useAccountsStore';
import type { AccountType } from '../../store/useAccountsStore';
import { AddAccountModal } from './AddAccountModal';

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

export const AccountCategoryWidget: React.FC<AccountCategoryWidgetProps> = ({ title, type, className }) => {
  const { getAccountsByType, getTotalByType, removeAccount } = useAccountsStore();
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
      className="flex items-center text-xs font-medium text-text-secondary hover:text-accent transition-colors"
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
              <p className="text-sm text-text-secondary italic">No accounts added yet.</p>
            ) : (
              accounts.map((acc) => (
                <div key={acc.id} className="flex justify-between items-center group">
                  <span className="text-sm text-text-secondary">{acc.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      ${acc.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button 
                      onClick={() => handleEdit(acc)}
                      className="text-text-secondary/50 hover:text-accent opacity-0 group-hover:opacity-100 transition-all ml-1"
                      aria-label="Edit account"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => removeAccount(acc.id)}
                      className="text-text-secondary/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Remove account"
                    >
                      <Trash2 size={14} />
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
