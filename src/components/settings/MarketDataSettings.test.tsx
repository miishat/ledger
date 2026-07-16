import { describe, expect, it, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MarketDataSection, MarketDataStatusBadge } from './MarketDataSettings'
import { useMarketDataStore } from '../../store/useMarketDataStore'

describe('MarketDataSection', () => {
  beforeEach(() => useMarketDataStore.getState().clearApiKey())

  it('saves a key', () => {
    render(<MarketDataSection />)
    fireEvent.change(screen.getByLabelText('Alpha Vantage API Key'), { target: { value: 'demo-key-x3P' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(useMarketDataStore.getState().apiKey).toBe('demo-key-x3P')
  })

  it('collapses setup instructions behind a disclosure', () => {
    render(<MarketDataSection />)
    const details = screen.getByText('How to get a free key').closest('details')!
    expect(details.open).toBe(false)
    expect(screen.getByRole('link', { name: 'Get a free API key' })).toHaveAttribute(
      'href',
      'https://www.alphavantage.co/support/#api-key'
    )
  })
})

describe('MarketDataStatusBadge', () => {
  beforeEach(() => useMarketDataStore.getState().clearApiKey())

  it('shows No key when unset', () => {
    render(<MarketDataStatusBadge />)
    expect(screen.getByText('No key')).toBeInTheDocument()
  })

  it('shows key tail when set', () => {
    useMarketDataStore.getState().setApiKey('demo-key-x3P')
    render(<MarketDataStatusBadge />)
    expect(screen.getByText(/Key active …x3P/)).toBeInTheDocument()
  })
})
