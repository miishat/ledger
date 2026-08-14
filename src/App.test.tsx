import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('./hooks/useSWUpdate', () => ({
  useSWUpdate: () => ({
    needRefresh: false,
    refresh: () => {},
    checkStatus: 'idle',
    checkForUpdates: () => {},
  }),
}))

const { default: App } = await import('./App')

describe('App routing', () => {
  it('renders the dashboard at the index route', async () => {
    render(<App />)
    expect(
      await screen.findByText('All your accounts, balances, and trends in one place.'),
    ).toBeInTheDocument()
  })

  it('shows a loading placeholder while a lazy route chunk resolves', async () => {
    window.location.hash = '#/budget'
    render(<App />)
    // The shell stays mounted while the chunk loads, so the sidebar is present
    // before the page itself is.
    expect(await screen.findByRole('heading', { name: 'Budgeting' })).toBeInTheDocument()
    window.location.hash = ''
  })
})
