import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAccountsStore } from '../../store/useAccountsStore';
import type { AccountType } from '../../store/useAccountsStore';
import { ThemedSelect } from '../ui/ThemedSelect';
import { NumberInput } from '../ui/NumberInput';
import { Sheet } from '../ui/Sheet';

interface Account {
  id: string;
  name: string;
  value: number;
  type: AccountType;
}

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: AccountType;
  editingAccount?: Account | null;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, defaultType = 'bank', editingAccount }) => {
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);
  const [type, setType] = useState<AccountType>(defaultType);

  const { addAccount, updateAccount } = useAccountsStore();

  useEffect(() => {
    if (isOpen) {
      if (editingAccount) {
        setName(editingAccount.name);
        setValue(editingAccount.value);
        setType(editingAccount.type);
      } else {
        setType(defaultType);
        setName('');
        setValue(0);
      }
    }
  }, [isOpen, defaultType, editingAccount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      if (editingAccount) {
        updateAccount(editingAccount.id, {
          name,
          value,
          type,
        });
      } else {
        addAccount({
          name,
          value,
          type,
        });
      }
      onClose();
    }
  };

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      desktop="modal"
      ariaLabel={editingAccount ? 'Edit Account' : 'Add Account'}
      panelClassName="bg-bg-primary border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
    >
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">{editingAccount ? 'Edit Account' : 'Add Account'}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-secondary">Type</label>
            <ThemedSelect
              value={type}
              onChange={(v) => setType(v as AccountType)}
              options={[
                { value: 'bank', label: 'Bank Account' },
                { value: 'investment', label: 'Investment Account' },
                { value: 'debt', label: 'Debt / Liability' },
                { value: 'receivable', label: 'Receivable' },
                { value: 'other', label: 'Other Asset' },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-secondary">Name / Description</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chase Checking"
              className="bg-bg-secondary border border-border rounded-md px-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-secondary">Value / Balance</label>
            <NumberInput
              value={value}
              onCommit={setValue}
              placeholder="0.00"
              className="bg-bg-secondary border border-border rounded-md px-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {editingAccount ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
    </Sheet>
  );
};
