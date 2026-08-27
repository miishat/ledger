import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useThemeStore } from './store/useThemeStore'

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

  it('keeps the browser chrome colour in step with the active theme', async () => {
    useThemeStore.getState().setTheme('geometric')
    render(<App />)
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
    expect(meta).not.toBeNull()
    // Geometric is the light theme; a hardcoded black bar over a white app
    // is exactly what the manifest was doing.
    expect(meta.content).toBe('#ffffff')

    await act(async () => { useThemeStore.getState().setTheme('luxury') })
    expect((document.querySelector('meta[name="theme-color"]') as HTMLMetaElement).content).toBe('#000000')
  })

  it('treats Gilded Bloom as a light theme, not a dark one', async () => {
    useThemeStore.getState().setTheme('luxury')
    render(<App />)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await act(async () => { useThemeStore.getState().setTheme('nouveau') })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('nouveau')
    expect((document.querySelector('meta[name="theme-color"]') as HTMLMetaElement).content).toBe('#FDF6EA')
  })
})
