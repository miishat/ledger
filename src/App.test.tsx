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
    // several seconds under that load. Both budgets below have to allow for
    // that, not just the outer one: findByRole gives up on its own inner
    // timeout regardless of how long the test itself is allowed to run, so
    // raising only the outer number (as a previous change here did) does
    // nothing, it just trades a timeout error for a "could not find" error
    // at the same wall clock moment. The outer test timeout stays comfortably
    // above the inner one so it never fires first.
    expect(
      await screen.findByRole('heading', { name: 'Budgeting' }, { timeout: 10000 }),
    ).toBeInTheDocument()
    window.location.hash = ''
  }, 20000)

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

  it('pins the light or dark class for every theme, not just a sample', async () => {
    // The dark class is now driven by LIGHT_THEMES set membership, not a
    // per-theme comparison, so a single wrongly added or removed theme
    // would not fail any test that only checks one or two themes. This
    // enumerates all six so an incorrect edit to the set is caught.
    render(<App />)

    await act(async () => { useThemeStore.getState().setTheme('geometric') })
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await act(async () => { useThemeStore.getState().setTheme('nouveau') })
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await act(async () => { useThemeStore.getState().setTheme('tactical') })
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await act(async () => { useThemeStore.getState().setTheme('luxury') })
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await act(async () => { useThemeStore.getState().setTheme('aurora') })
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await act(async () => { useThemeStore.getState().setTheme('glass') })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
