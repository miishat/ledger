import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MarketDataSettings } from './MarketDataSettings'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { setMatchMedia } from '../../test-utils/matchMedia'

afterEach(() => useMarketDataStore.getState().clearApiKey())

describe('MarketDataSettings', () => {
  it('opens the modal and saves a key', () => {
    render(<MarketDataSettings />)
    fireEvent.click(screen.getByRole('button', { name: /market data/i }))
    fireEvent.change(screen.getByLabelText(/api key/i), { target: { value: 'MYKEY1' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(useMarketDataStore.getState().apiKey).toBe('MYKEY1')
  })

  it('shows setup instructions with a link to claim a free key', () => {
    render(<MarketDataSettings />)
    fireEvent.click(screen.getByRole('button', { name: /market data/i }))
    const link = screen.getByRole('link', { name: /free api key/i })
    expect(link).toHaveAttribute('href', 'https://www.alphavantage.co/support/#api-key')
  })

  it('closes when the scrim is clicked (desktop)', async () => {
    setMatchMedia(true)
    render(<MarketDataSettings />)
    fireEvent.click(screen.getByRole('button', { name: /market data/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('sheet-scrim'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
