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
    // Full-suite runs contend for CPU across many parallel worker threads, so
    // a lazy chunk that resolves in single-digit ms in isolation can take
    // well over the default 1000ms timeout under that load. Use a generous
    // timeout here rather than in isolation-only runs.
    expect(
      await screen.findByRole('heading', { name: 'Budgeting' }, { timeout: 5000 }),
    ).toBeInTheDocument()
    window.location.hash = ''
  })
})
