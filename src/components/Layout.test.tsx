import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
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
