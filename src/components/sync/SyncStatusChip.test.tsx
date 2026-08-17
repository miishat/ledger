import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SyncStatusChip } from './SyncStatusChip'
import { useSyncStore } from '../../store/useSyncStore'

describe('SyncStatusChip', () => {
  it('renders nothing when sync is not configured', () => {
    useSyncStore.setState({ clientId: undefined, folderId: undefined, lastSyncedAt: undefined })
    const { container } = render(<SyncStatusChip onOpenSettings={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('announces a stale sync and opens settings when activated', () => {
    useSyncStore.setState({
      clientId: 'c',
      folderId: 'f',
      lastSyncedAt: new Date(Date.now() - 72 * 3_600_000).toISOString(),
    })
    const onOpenSettings = vi.fn()
    render(<SyncStatusChip onOpenSettings={onOpenSettings} />)

    const chip = screen.getByRole('button', { name: /sync/i })
    expect(chip).toHaveTextContent(/stale/i)
    fireEvent.click(chip)
    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })
})
