import { useDashboardLayoutStore } from './useDashboardLayoutStore'

const initialState = useDashboardLayoutStore.getState()
beforeEach(() => {
  localStorage.clear()
  useDashboardLayoutStore.setState(initialState, true)
})

describe('useDashboardLayoutStore', () => {
  it('moveWidget places a widget before another', () => {
    useDashboardLayoutStore.getState().setOrder(['a', 'b', 'c'])
    useDashboardLayoutStore.getState().moveWidget('c', 'a')
    expect(useDashboardLayoutStore.getState().order).toEqual(['c', 'a', 'b'])
  })

  it('moveWidget with beforeId null moves to the end', () => {
    useDashboardLayoutStore.getState().setOrder(['a', 'b', 'c'])
    useDashboardLayoutStore.getState().moveWidget('a', null)
    expect(useDashboardLayoutStore.getState().order).toEqual(['b', 'c', 'a'])
  })

  it('persists under ledger-dashboard-layout', () => {
    useDashboardLayoutStore.getState().setOrder(['x'])
    expect(localStorage.getItem('ledger-dashboard-layout')).toContain('"x"')
  })
})
