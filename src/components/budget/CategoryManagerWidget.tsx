import React, { useState } from 'react';
import { useBudgetStore } from '../../store/useBudgetStore';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface CategoryManagerWidgetProps {
  selectedMonth: string;
}

export const CategoryManagerWidget: React.FC<CategoryManagerWidgetProps> = ({ selectedMonth }) => {
  const {
    transactions,
    paradigm,
    setParadigm,
    categories,
    categoryGroups,
    addCategory,
    updateCategory,
    deleteCategory,
    addCategoryGroup,
    deleteCategoryGroup
  } = useBudgetStore();

  const [newCatName, setNewCatName] = useState('');
  const [newCatGroupId, setNewCatGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

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

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    addCategoryGroup({
      id: crypto.randomUUID(),
      name: newGroupName
    });
    setNewGroupName('');
  };

  const thisMonthExpenses = Object.values(transactions).filter(
    t => t.type === 'expense' && t.date.startsWith(selectedMonth)
  );

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
          const groupTotal = groupCats.reduce((sum, cat) => sum + cat.targetAmount, 0);
          
          return (
            <div key={group.id} className="border border-border/50 rounded-lg p-4 bg-bg-primary/30 relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-text-primary">{group.name}</h3>
                  <span className="text-[12px] font-medium text-text-secondary bg-bg-secondary px-2 rounded-full border border-border">
                    ${groupTotal.toFixed(0)}
                  </span>
                </div>
                {groupCats.length === 0 && (
                  <button 
                    onClick={() => deleteCategoryGroup(group.id)}
                    className="p-1 text-text-secondary hover:text-red-500 transition-colors"
                    title="Delete Empty Group"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {groupCats.length === 0 ? (
                  <p className="text-[12px] text-text-secondary italic">No categories.</p>
                ) : (
                  groupCats.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between gap-2 group border-b border-border/30 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                      <div className="flex flex-col w-1/3">
                        <input 
                          type="text" 
                          value={cat.name} 
                          onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                          className="text-[14px] font-medium text-text-primary bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none truncate w-full"
                          placeholder="Category Name"
                        />
                        <select 
                          value={cat.groupId}
                          onChange={(e) => updateCategory(cat.id, { groupId: e.target.value })}
                          className="text-[11px] text-text-secondary bg-transparent hover:text-text-primary focus:outline-none cursor-pointer w-full mt-0.5 appearance-none"
                        >
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        {(() => {
                          const actualSpend = thisMonthExpenses
                            .filter(t => t.categoryId === cat.id)
                            .reduce((sum, t) => sum + t.amount, 0);
                          const isOverBudget = actualSpend > cat.targetAmount && cat.targetAmount > 0;
                          return (
                            <div className="flex items-center gap-1 text-[13px] mr-2">
                              <span className={`${isOverBudget ? 'text-red-500 font-medium' : 'text-text-secondary'}`}>
                                ${actualSpend.toFixed(0)}
                              </span>
                              <span className="text-text-secondary/50">/</span>
                            </div>
                          );
                        })()}
                        <span className="text-[14px] text-text-secondary">$</span>
                        <input
                          type="number"
                          value={cat.targetAmount}
                          onChange={(e) => updateCategory(cat.id, { targetAmount: Number(e.target.value) })}
                          className="w-20 bg-bg-secondary border border-border rounded px-2 py-1 text-[14px] text-right focus:outline-none focus:border-accent"
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

      <div className="mt-6 border-t border-border pt-4">
        <button 
          onClick={() => setIsAddOpen(!isAddOpen)}
          className="flex items-center gap-2 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          {isAddOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Manage Categories & Groups
        </button>
        
        {isAddOpen && (
          <div className="flex flex-col md:flex-row gap-8 mt-4 pt-4 border-t border-border/50">
            <form onSubmit={handleAddCategory} className="flex items-end gap-3 flex-1">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[12px] text-text-secondary">New Category Name</label>
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Dining Out"
                  className="bg-bg-primary border border-border rounded px-3 py-1.5 text-[14px] focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
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

            <form onSubmit={handleAddGroup} className="flex items-end gap-3 flex-1">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[12px] text-text-secondary">New Group</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Discretionary"
                  className="bg-bg-primary border border-border rounded px-3 py-1.5 text-[14px] focus:outline-none focus:border-accent"
                />
              </div>
              <button 
                type="submit"
                className="flex items-center gap-1 bg-bg-secondary hover:bg-border border border-border text-text-primary px-4 py-1.5 rounded text-[14px] transition-colors"
              >
                <Plus size={16} /> Add Group
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
