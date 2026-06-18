import { create } from 'zustand';

export interface DashboardState {
  netWorth: number;
  netWorthTrend: number;
  totalAssets: number;
  totalDebts: number;
  setNetWorth: (value: number) => void;
  setNetWorthTrend: (value: number) => void;
  setTotalAssets: (value: number) => void;
  setTotalDebts: (value: number) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  netWorth: 1450000,
  netWorthTrend: 5.2,
  totalAssets: 1850000,
  totalDebts: 400000,
  setNetWorth: (netWorth) => set({ netWorth }),
  setNetWorthTrend: (netWorthTrend) => set({ netWorthTrend }),
  setTotalAssets: (totalAssets) => set({ totalAssets }),
  setTotalDebts: (totalDebts) => set({ totalDebts }),
}));
