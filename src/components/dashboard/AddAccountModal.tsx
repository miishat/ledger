import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAccountsStore } from '../../store/useAccountsStore';
import type { AccountType } from '../../store/useAccountsStore';

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
  const [value, setValue] = useState('');
  const [type, setType] = useState<AccountType>(defaultType);

  const { addAccount, updateAccount } = useAccountsStore();

  useEffect(() => {
    if (isOpen) {
      if (editingAccount) {
        setName(editingAccount.name);
        setValue(editingAccount.value.toString());
        setType(editingAccount.type);
      } else {
        setType(defaultType);
        setName('');
        setValue('');
      }
    }
  }, [isOpen, defaultType, editingAccount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValue = parseFloat(value);
    if (name && !isNaN(parsedValue)) {
      if (editingAccount) {
        updateAccount(editingAccount.id, {
          name,
          value: parsedValue,
          type,
        });
      } else {
        addAccount({
          name,
          value: parsedValue,
          type,
        });
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-bg-primary border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">{editingAccount ? 'Edit Account' : 'Add Account'}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-secondary">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="bg-bg-secondary border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
              required
            >
              <option value="bank">Bank Account</option>
              <option value="investment">Investment Account</option>
              <option value="debt">Debt / Liability</option>
              <option value="receivable">Receivable</option>
              <option value="other">Other Asset</option>
            </select>
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
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
              className="bg-bg-secondary border border-border rounded-md px-3 py-2 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
              required
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
      </div>
    </div>
  );
};
