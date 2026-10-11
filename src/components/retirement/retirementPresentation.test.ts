import { retirementRange } from './retirementPresentation'

describe('Retirement result presentation', () => {
  it('collapses display-equal endpoints while callers retain unresolved assumptions', () => {
    expect(retirementRange([100.1, 100.2])).toBe('$100')
  })
  it('uses extrema across every independent branch', () => {
    expect(retirementRange([100, 250, 75, 110])).toBe('$75 to $250')
  })
  it('withholds absent and nonfinite results', () => {
    expect(retirementRange([])).toBe('Needs Review')
    expect(retirementRange([100, NaN])).toBe('Needs Review')
  })
})
