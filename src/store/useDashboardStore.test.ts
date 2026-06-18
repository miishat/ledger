import { describe, it, expect } from 'vitest';
import { useDashboardStore } from './useDashboardStore';

describe('useDashboardStore', () => {
  it('initializes with non-zero mock data', () => {
    const state = useDashboardStore.getState();
    expect(state.netWorth).toBeGreaterThan(0);
    expect(state.totalAssets).toBeGreaterThan(0);
    expect(state.totalDebts).toBeGreaterThan(0);
    expect(state.netWorthTrend).not.toBe(0);
  });
});
