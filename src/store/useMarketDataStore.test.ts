import { useMarketDataStore } from './useMarketDataStore'

describe('useMarketDataStore api key', () => {
  afterEach(() => {
    useMarketDataStore.getState().clearApiKey()
  })

  it('starts with no key', () => {
    expect(useMarketDataStore.getState().apiKey).toBeUndefined()
  })

  it('stores and clears a trimmed key', () => {
    useMarketDataStore.getState().setApiKey('  ABC123  ')
    expect(useMarketDataStore.getState().apiKey).toBe('ABC123')
    useMarketDataStore.getState().clearApiKey()
    expect(useMarketDataStore.getState().apiKey).toBeUndefined()
  })
})
