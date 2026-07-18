import React, { useState } from 'react';
import { useBudgetStore, getMonthlyBudgetStats } from '../../store/useBudgetStore';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { ThemedSelect } from '../ui/ThemedSelect';
import { NumberInput } from '../ui/NumberInput';
import { ReallocationModal } from './ReallocationModal';
import type { BudgetingParadigm, BudgetClass } from '../../types/budget';

export const PARADIGM_DESCRIPTIONS: Record<BudgetingParadigm, string> = {
  'Ledger Custom': 'Freeform tracking. Targets are informational; nothing is enforced.',
  'Zero-Based': 'Every dollar gets a job; cover overspending from another category.',
  'Target-Based': 'Targets are soft ceilings; overspending draws from your buffer.',
  '50/30/20': 'Spend ~50% of income on needs, 30% on wants, 20% toward savings.',
};

const BUDGET_CLASSES: BudgetClass[] = ['need', 'want', 'savings'];

interface CategoryManagerWidgetProps {
  selectedMonth: string;
}

export const CategoryManagerWidget: React.FC<CategoryManagerWidgetProps> = ({ selectedMonth }) => {
  const state = useBudgetStore();
  const {
    transactions,
    paradigm,
    setParadigm,
    reallocations,
    categories,
    categoryGroups,
    addCategory,
    updateCategory,
    deleteCategory,
    addCategoryGroup,
    deleteCategoryGroup,
    updateCategoryGroup,
    budgetSetupCollapsed,
    toggleBudgetSetup
  } = state;

  const [coverTarget, setCoverTarget] = useState<{ id: string; overage: number } | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatGroupId, setNewCatGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupKind, setNewGroupKind] = useState<'income' | 'expense'>('expense');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const groups = Object.values(categoryGroups);
  const catList = Object.values(categories);

  const [statsYear, statsMonth] = selectedMonth.split('-').map(Number);
  const stats = getMonthlyBudgetStats(state, statsYear, statsMonth - 1);

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
      name: newGroupName,
      kind: newGroupKind
    });
    setNewGroupName('');
  };

  const thisMonthExpenses = Object.values(transactions).filter(
    t => t.type === 'expense' && t.date.startsWith(selectedMonth)
  );
  
  const thisMonthIncome = Object.values(transactions).filter(
    t => t.type === 'income' && t.date.startsWith(selectedMonth)
  );

  return (
    <div className="mt-8 bg-bg-secondary border border-border rounded-xl p-6 flex flex-col min-w-0">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 border-b border-border pb-4">
        <button
          type="button"
          onClick={toggleBudgetSetup}
          aria-expanded={!budgetSetupCollapsed}
          className="flex items-center gap-2 text-left"
        >
          {budgetSetupCollapsed ? (
            <ChevronRight size={18} className="text-text-secondary" />
          ) : (
            <ChevronDown size={18} className="text-text-secondary" />
          )}
          <div>
            <h2 className="text-[18px] font-semibold text-text-primary">Budget Setup</h2>
            <p className="text-[14px] text-text-secondary mt-1">Configure your budgeting style and monthly targets.</p>
          </div>
        </button>

        {!budgetSetupCollapsed && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <label className="text-[14px] text-text-secondary">Paradigm:</label>
              <ThemedSelect
                value={paradigm}
                onChange={(v) => setParadigm(v as BudgetingParadigm)}
                className="min-w-[180px]"
                options={[
                  { value: 'Ledger Custom', label: 'Ledger Custom' },
                  { value: 'Zero-Based', label: 'Zero-Based' },
                  { value: 'Target-Based', label: 'Target-Based' },
                  { value: '50/30/20', label: '50/30/20 Rule' },
                ]}
              />
            </div>
            <p className="text-[12px] text-text-secondary max-w-[520px] text-right">
              {PARADIGM_DESCRIPTIONS[paradigm]}
            </p>
          </div>
        )}
      </div>

      {!budgetSetupCollapsed && (
      <div className="columns-1 md:columns-2 gap-6">
        {groups.map(group => {
          const isIncomeGroup = group.kind === 'income';
          const groupCats = catList.filter(c => c.groupId === group.id);
          const groupTotal = groupCats.reduce((sum, cat) => sum + cat.targetAmount, 0);
          const groupEarned = groupCats.reduce((sum, cat) => {
            return sum + thisMonthIncome.filter(t => t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
          }, 0);
          
          return (
            <div key={group.id} className="break-inside-avoid mb-6 border border-border/50 rounded-lg p-4 bg-bg-primary/30 relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-text-primary">{group.name}</h3>
                  <span className="text-[12px] font-medium text-text-secondary bg-bg-secondary px-2 rounded-full border border-border">
                    {isIncomeGroup ? `$${groupEarned.toFixed(0)} earned` : `$${groupTotal.toFixed(0)}`}
                  </span>
                  {paradigm === '50/30/20' && !isIncomeGroup && (
                    <div className="flex items-center gap-1">
                      {BUDGET_CLASSES.map((cls) => (
                        <button
                          key={cls}
                          type="button"
                          aria-label={`Set ${group.name} class to ${cls}`}
                          onClick={() => updateCategoryGroup(group.id, { budgetClass: cls })}
                          className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors capitalize ${
                            group.budgetClass === cls
                              ? 'border-accent text-accent bg-accent/10'
                              : 'border-border text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {cls}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {groupCats.length === 0 && (
                  <button 
                    onClick={() => deleteCategoryGroup(group.id)}
                    className="p-1 text-text-secondary hover:text-error transition-colors"
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
                    <div key={cat.id} className="flex items-center justify-between gap-2 flex-wrap group border-b border-border/30 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                      <div className="flex flex-col w-1/3">
                        <input 
                          type="text" 
                          value={cat.name} 
                          onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                          className="text-[14px] font-medium text-text-primary bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none truncate w-full"
                          placeholder="Category Name"
                        />
                        <ThemedSelect
                          value={cat.groupId}
                          onChange={(v) => updateCategory(cat.id, { groupId: v })}
                          className="!bg-transparent !border-0 !px-0 !py-0 text-[11px] text-text-secondary hover:text-text-primary"
                          options={groups.map(g => ({ value: g.id, label: g.name }))}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1 flex-wrap justify-end">
                        {(() => {
                          const actualAmount = (isIncomeGroup ? thisMonthIncome : thisMonthExpenses)
                            .filter(t => t.categoryId === cat.id)
                            .reduce((sum, t) => sum + t.amount, 0);

                          if (isIncomeGroup) {
                            return (
                              <div className="flex items-center gap-4 w-full justify-end">
                                <span className="text-[13px] font-medium text-text-primary">
                                  ${actualAmount.toFixed(0)} earned
                                </span>
                                <button 
                                  onClick={() => deleteCategory(cat.id)}
                                  className="p-1 text-text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            );
                          }

                          const monthReallocs = Object.values(reallocations).filter(r => r.date.startsWith(selectedMonth));
                          const reallocsIn = monthReallocs.filter(r => r.toCategoryId === cat.id).reduce((sum, r) => sum + r.amount, 0);
                          const reallocsOut = monthReallocs.filter(r => r.fromCategoryId === cat.id).reduce((sum, r) => sum + r.amount, 0);
                          const effectiveTarget = cat.targetAmount + reallocsIn - reallocsOut;

                          const isOverBudget = !isIncomeGroup && actualAmount > effectiveTarget && effectiveTarget > 0;
                          const progressPercentage = effectiveTarget > 0 ? Math.min((actualAmount / effectiveTarget) * 100, 100) : 0;
                          
                          let progressColor = 'bg-[var(--color-accent)]';
                          if (!isIncomeGroup) {
                            if (isOverBudget) progressColor = 'bg-error';
                            else if (progressPercentage > 85) progressColor = 'bg-orange-500';
                          } else {
                            if (progressPercentage >= 100) progressColor = 'bg-accent';
                          }

                          return (
                            <>
                              <div className="flex flex-col items-end min-w-[100px]">
                                <span className={`text-[12px] font-medium whitespace-nowrap ${isOverBudget ? 'text-error' : 'text-text-secondary'}`}>
                                  ${actualAmount.toFixed(0)} {isIncomeGroup ? 'earned' : 'spent'} {isOverBudget && `($${(actualAmount - effectiveTarget).toFixed(0)} over)`}
                                </span>
                                {paradigm === 'Zero-Based' && (stats.perCategory[cat.id]?.overspend ?? 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setCoverTarget({ id: cat.id, overage: stats.perCategory[cat.id].overspend })}
                                    className="px-2 py-0.5 rounded text-[11px] font-medium border border-error/60 text-error hover:bg-error/10 transition-colors"
                                  >
                                    Cover
                                  </button>
                                )}
                                {paradigm === 'Target-Based' && (stats.perCategory[cat.id]?.overspend ?? 0) > 0 && (
                                  <span className="text-[11px] text-orange-500">absorbed by buffer</span>
                                )}
                                {effectiveTarget > 0 && (
                                  <div className="w-full h-1 bg-bg-secondary border border-border/50 rounded-full overflow-hidden mt-1">
                                    <div className={`h-full ${progressColor} transition-all`} style={{ width: `${progressPercentage}%` }}></div>
                                  </div>
                                )}
                              </div>
                              <span className="text-[13px] text-text-secondary ml-2">target: $</span>
                              <NumberInput
                                value={cat.targetAmount}
                                onCommit={(n) => updateCategory(cat.id, { targetAmount: n })}
                                className="w-16 bg-bg-secondary border border-border rounded px-2 py-0.5 text-[13px] text-right focus:outline-none focus:border-accent"
                              />
                              <button 
                                onClick={() => deleteCategory(cat.id)}
                                className="p-1 text-text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {!budgetSetupCollapsed && (
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
            <form onSubmit={handleAddCategory} className="flex items-end gap-3 flex-wrap flex-1">
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-[12px] text-text-secondary">New Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Dining Out"
                  className="w-full bg-bg-primary border border-border rounded px-3 py-1.5 text-[14px] focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-[12px] text-text-secondary">Group</label>
                <ThemedSelect
                  value={newCatGroupId}
                  onChange={(v) => setNewCatGroupId(v)}
                  options={[
                    { value: '', label: 'Select Group...' },
                    ...groups.map(g => ({ value: g.id, label: g.name })),
                  ]}
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-1 bg-bg-secondary hover:bg-border border border-border text-text-primary px-4 py-1.5 rounded text-[14px] transition-colors"
              >
                <Plus size={16} /> Add
              </button>
            </form>

            <form onSubmit={handleAddGroup} className="flex items-end gap-3 flex-wrap flex-1">
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-[12px] text-text-secondary">New Group</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Discretionary"
                  className="w-full bg-bg-primary border border-border rounded px-3 py-1.5 text-[14px] focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-[12px] text-text-secondary">Type</label>
                <ThemedSelect
                  value={newGroupKind}
                  onChange={(v) => setNewGroupKind(v as 'income' | 'expense')}
                  options={[
                    { value: 'expense', label: 'Expense' },
                    { value: 'income', label: 'Income' },
                  ]}
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
      )}

      {coverTarget && (
        <ReallocationModal
          isOpen
          onClose={() => setCoverTarget(null)}
          toCategoryId={coverTarget.id}
          defaultAmount={coverTarget.overage}
          selectedMonth={selectedMonth}
        />
      )}
    </div>
  );
};
