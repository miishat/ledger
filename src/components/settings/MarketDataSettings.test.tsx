import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MarketDataSection } from './MarketDataSettings'
import { useMarketDataStore } from '../../store/useMarketDataStore'

describe('MarketDataSection', () => {
  beforeEach(() => useMarketDataStore.getState().clearApiKey())

  it('saves a key', () => {
    render(<MarketDataSection />)
    fireEvent.change(screen.getByLabelText('Alpha Vantage API Key'), { target: { value: 'demo-key-x3P' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(useMarketDataStore.getState().apiKey).toBe('demo-key-x3P')
    expect(screen.getByText(/ends in …x3P/)).toBeInTheDocument()
  })

  it('shows setup instructions with a link to claim a free key', () => {
    render(<MarketDataSection />)
    expect(screen.getByRole('link', { name: 'Get a free API key' })).toHaveAttribute('href', 'https://www.alphavantage.co/support/#api-key')
  })
})
