import React, { useState } from 'react';
import { useBudgetStore } from '../../store/useBudgetStore';
import { Plus, Trash2 } from 'lucide-react';

export const CategoryManagerWidget: React.FC = () => {
  const {
    paradigm,
    setParadigm,
    categories,
    categoryGroups,
    addCategory,
    updateCategory,
    deleteCategory
  } = useBudgetStore();

  const [newCatName, setNewCatName] = useState('');
  const [newCatGroupId, setNewCatGroupId] = useState('');

  const groups = Object.values(categoryGroups);
  const catList = Object.values(categories);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatGroupId) return;

    addCategory({
      id: crypto.randomUUID(),
      groupId: newCatGroupId,
      name: newCatName,
      targetAmount: 0
    });
    setNewCatName('');
  };

  return (
    <div className="mt-8 bg-bg-secondary border border-border rounded-xl p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
        <div>
          <h2 className="text-[18px] font-semibold text-text-primary">Budget Setup</h2>
          <p className="text-[14px] text-text-secondary mt-1">Configure your budgeting style and monthly targets.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-[14px] text-text-secondary">Paradigm:</label>
          <select 
            value={paradigm}
            onChange={(e) => setParadigm(e.target.value as any)}
            className="bg-bg-primary border border-border rounded-md px-3 py-1.5 text-[14px] focus:outline-none focus:border-accent"
          >
            <option value="Ledger Custom">Ledger Custom</option>
            <option value="Zero-Based">Zero-Based</option>
            <option value="Envelope">Envelope System</option>
            <option value="50/30/20">50/30/20 Rule</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map(group => {
          const groupCats = catList.filter(c => c.groupId === group.id);
          return (
            <div key={group.id} className="border border-border/50 rounded-lg p-4 bg-bg-primary/30">
              <h3 className="text-[14px] font-semibold text-text-primary mb-3">{group.name}</h3>
              <div className="flex flex-col gap-2">
                {groupCats.length === 0 ? (
                  <p className="text-[12px] text-text-secondary italic">No categories.</p>
                ) : (
                  groupCats.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between gap-2 group">
                      <span className="text-[14px] text-text-secondary w-1/2 truncate">{cat.name}</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-[14px] text-text-secondary">$</span>
                        <input
                          type="number"
                          value={cat.targetAmount}
                          onChange={(e) => updateCategory(cat.id, { targetAmount: Number(e.target.value) })}
                          className="w-24 bg-bg-secondary border border-border rounded px-2 py-1 text-[14px] text-right focus:outline-none focus:border-accent"
                        />
                        <button 
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1 text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAddCategory} className="mt-6 flex items-end gap-3 border-t border-border pt-6">
        <div className="flex flex-col gap-1 flex-1 max-w-[200px]">
          <label className="text-[12px] text-text-secondary">New Category Name</label>
          <input 
            type="text" 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Dining Out"
            className="bg-bg-primary border border-border rounded px-3 py-1.5 text-[14px] focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 max-w-[200px]">
          <label className="text-[12px] text-text-secondary">Group</label>
          <select 
            value={newCatGroupId}
            onChange={(e) => setNewCatGroupId(e.target.value)}
            className="bg-bg-primary border border-border rounded px-3 py-1.5 text-[14px] focus:outline-none focus:border-accent"
          >
            <option value="">Select Group...</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <button 
          type="submit"
          className="flex items-center gap-1 bg-bg-secondary hover:bg-border border border-border text-text-primary px-4 py-1.5 rounded text-[14px] transition-colors"
        >
          <Plus size={16} /> Add
        </button>
      </form>
    </div>
  );
};
