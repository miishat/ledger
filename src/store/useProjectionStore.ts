import { create } from 'zustand';

export interface ProjectionDataPoint {
  year: number;
  baseContribution: number;
  interest: number;
}

interface ProjectionState {
  horizon: 10 | 20 | 30;
  monthlyContribution: number;
  marketReturn: number;
  inflation: number;
  history: ProjectionDataPoint[];

  setHorizon: (horizon: 10 | 20 | 30) => void;
  setMonthlyContribution: (contribution: number) => void;
  setMarketReturn: (rate: number) => void;
  setInflation: (rate: number) => void;
}

const calculateHistory = (
  horizon: number,
  monthlyContribution: number,
  marketReturn: number,
  inflation: number
): ProjectionDataPoint[] => {
  const history: ProjectionDataPoint[] = [];
  const realReturn = (marketReturn - inflation) / 100;
  const monthlyRate = realReturn / 12;

  let totalBase = 0;
  let totalBalance = 0;

  for (let year = 1; year <= horizon; year++) {
    for (let month = 1; month <= 12; month++) {
      totalBase += monthlyContribution;
      totalBalance += monthlyContribution;
      // Compounding even if realReturn is negative (technically valid)
      totalBalance *= (1 + monthlyRate);
    }
    history.push({
      year,
      baseContribution: Math.round(totalBase),
      interest: Math.round(Math.max(0, totalBalance - totalBase)),
    });
  }

  return history;
};

export const useProjectionStore = create<ProjectionState>((set) => ({
  horizon: 30,
  monthlyContribution: 1000,
  marketReturn: 10,
  inflation: 3,
  history: calculateHistory(30, 1000, 10, 3),

  setHorizon: (horizon) =>
    set((state) => ({
      horizon,
      history: calculateHistory(horizon, state.monthlyContribution, state.marketReturn, state.inflation),
    })),
  setMonthlyContribution: (monthlyContribution) =>
    set((state) => ({
      monthlyContribution,
      history: calculateHistory(state.horizon, monthlyContribution, state.marketReturn, state.inflation),
    })),
  setMarketReturn: (marketReturn) =>
    set((state) => ({
      marketReturn,
      history: calculateHistory(state.horizon, state.monthlyContribution, marketReturn, state.inflation),
    })),
  setInflation: (inflation) =>
    set((state) => ({
      inflation,
      history: calculateHistory(state.horizon, state.monthlyContribution, state.marketReturn, inflation),
    })),
}));
