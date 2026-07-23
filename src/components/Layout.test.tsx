import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../hooks/useSWUpdate', () => ({
  useSWUpdate: () => ({
    needRefresh: false,
    refresh: () => {},
    checkStatus: 'idle',
    checkForUpdates: () => {},
  }),
}))

const { Layout } = await import('./Layout')

describe('Layout mobile chrome', () => {
  it('reserves safe-area-aware space above the tab bar and guards horizontal overflow', () => {
    const { container } = render(<MemoryRouter><Layout /></MemoryRouter>)
    const main = container.querySelector('main')!
    // padding reserves tab bar height + safe area on mobile:
    expect(main.className).toMatch(/pb-\[/) // custom bottom padding present
    expect(main.className).toMatch(/overflow-x-hidden|overflow-x-clip/)
  })
})

describe('Layout desktop sidebar', () => {
  it('has no tagline and opens the command palette from the search button', () => {
    render(<MemoryRouter><Layout /></MemoryRouter>)
    expect(screen.queryByText('Command Center')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(screen.getByPlaceholderText('Jump to a page or tool…')).toBeInTheDocument()
  })

  it('marks the active nav item with an accent bar', () => {
    render(<MemoryRouter><Layout /></MemoryRouter>)
    const active = screen.getAllByRole('link', { name: /dashboard/i })
      .find((l) => l.getAttribute('aria-current') === 'page')!
    expect(active.className).toMatch(/border-l-2/)
  })
})

describe('Layout mobile bottom nav sizing', () => {
  it('gives every tab an equal, shrinkable, truncation-safe cell', () => {
    render(<MemoryRouter><Layout /></MemoryRouter>)
    const bar = screen.getByRole('navigation', { name: 'Primary' })
    const cells = Array.from(bar.children) as HTMLElement[]
    expect(cells.length).toBe(6) // 5 links + Settings button
    for (const cell of cells) {
      const classes = cell.className.split(/\s+/)
      expect(classes).toContain('flex-1')
      expect(classes).toContain('min-w-0') // lets the cell shrink below its label's min-content width
    }
    // each label is truncation-safe
    const labels = bar.querySelectorAll('.truncate')
    expect(labels.length).toBe(6)
  })
})
