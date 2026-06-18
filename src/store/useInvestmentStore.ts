import { create } from 'zustand';

export interface InvestmentSnapshot {
  date: string;
  actualBalance: number;
  targetBalance: number;
}

export interface InvestmentState {
  targetGoal: number;
  history: InvestmentSnapshot[];
  setTargetGoal: (value: number) => void;
}

const generateMockHistory = (goal: number): InvestmentSnapshot[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startBalance = 50000;
  
  return months.map((month, index) => {
    // Linear progression for target
    const targetBalance = startBalance + ((goal - startBalance) / 11) * index;
    
    // Some random fluctuation for actual balance, but generally trending up
    // We'll only show actuals up to current month (e.g., June for halfway)
    const isFuture = index > 5; 
    const actualBalance = isFuture ? 0 : startBalance + ((goal - startBalance) / 11) * index * (0.9 + Math.random() * 0.2);
    
    return {
      date: month,
      actualBalance: isFuture ? 0 : Math.round(actualBalance),
      targetBalance: Math.round(targetBalance),
    };
  });
};

export const useInvestmentStore = create<InvestmentState>((set) => ({
  targetGoal: 100000,
  history: generateMockHistory(100000),
  setTargetGoal: (targetGoal) => set(() => ({
    targetGoal,
    history: generateMockHistory(targetGoal)
  })),
}));
