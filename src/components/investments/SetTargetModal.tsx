import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useInvestmentStore } from '../../store/useInvestmentStore';

interface SetTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetTargetModal({ isOpen, onClose }: SetTargetModalProps) {
  const { targetGoal, setTargetGoal } = useInvestmentStore();
  const [goal, setGoal] = useState<string>(targetGoal.toString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || isNaN(Number(goal))) return;

    setTargetGoal(Number(goal));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-[var(--color-bg-primary)] rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-[18px] font-semibold leading-[1.2] text-[var(--color-text-primary)]">Set Investment Goal</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-medium leading-none text-[var(--color-text-secondary)]">
              Target Goal ($)
            </label>
            <input
              type="number"
              step="1000"
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              placeholder="100000"
            />
          </div>

          <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
            <button
              type="submit"
              className="w-full py-3 bg-[var(--color-accent)] text-white rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              Set Target
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
