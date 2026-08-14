import { useThemeStore } from './useThemeStore'

const initialState = useThemeStore.getState()

beforeEach(() => {
  useThemeStore.setState(initialState, true)
})

describe('useThemeStore', () => {
  it('defaults to luxury', () => {
    expect(useThemeStore.getState().theme).toBe('luxury')
  })

  it('sets a theme directly', () => {
    useThemeStore.getState().setTheme('aurora')
    expect(useThemeStore.getState().theme).toBe('aurora')
  })

  it('cycles forward through every theme', () => {
    useThemeStore.getState().setTheme('geometric')
    const seen: string[] = []
    for (let i = 0; i < 5; i++) {
      useThemeStore.getState().cycleTheme()
      seen.push(useThemeStore.getState().theme)
    }
    expect(seen).toEqual(['tactical', 'luxury', 'aurora', 'glass', 'geometric'])
  })
})
