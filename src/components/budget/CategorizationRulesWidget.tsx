import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { useTriageStore } from '../../store/useTriageStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { ThemedSelect } from '../ui/ThemedSelect';

export const CategorizationRulesWidget: React.FC = () => {
  const categoryRules = useTriageStore((state) => state.categoryRules);
  const learnRule = useTriageStore((state) => state.learnRule);
  const removeRule = useTriageStore((state) => state.removeRule);
  const categories = useBudgetStore((state) => state.categories);

  const [newDesc, setNewDesc] = useState('');
  const [newCatId, setNewCatId] = useState('');

  const rulesEntries = Object.entries(categoryRules);
  const categoryList = Object.values(categories);

  const handleAdd = () => {
    if (newDesc.trim() && newCatId) {
      learnRule(newDesc.trim(), newCatId);
      setNewDesc('');
      setNewCatId('');
    }
  };

  return (
    <WidgetWrapper title={`Categorization Rules (${rulesEntries.length})`}>
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Description Match (e.g. UBER)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded px-3 py-1.5 text-[14px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
          />
          <ThemedSelect
            value={newCatId}
            onChange={setNewCatId}
            className="w-48"
            options={[
              { value: '', label: 'Select Category...' },
              ...categoryList.map(cat => ({ value: cat.id, label: cat.name })),
            ]}
          />
          <button 
            onClick={handleAdd}
            disabled={!newDesc.trim() || !newCatId}
            className="px-3 py-1.5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex flex-col max-h-[300px] overflow-y-auto border border-[var(--color-border)] rounded-md">
          {rulesEntries.length === 0 ? (
            <div className="p-4 text-center text-[13px] text-[var(--color-text-secondary)]">No rules created yet.</div>
          ) : (
            rulesEntries.map(([desc, catId]) => {
              const catName = categories[catId]?.name || 'Unknown';
              return (
                <div key={desc} className="flex justify-between items-center p-3 border-b border-[var(--color-border)] last:border-0 bg-[var(--color-bg-secondary)]">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-[var(--color-text-primary)]">{desc}</span>
                    <span className="text-[12px] text-[var(--color-text-secondary)]">Matches to: {catName}</span>
                  </div>
                  <button 
                    onClick={() => removeRule(desc)}
                    className="p-1.5 rounded bg-error/10 text-error hover:bg-error/20 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
};
