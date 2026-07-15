import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setMatchMedia } from '../../test-utils/matchMedia'
import { CSVUploader } from './CSVUploader'

vi.mock('../../utils/csvParser', () => ({
  parseCSV: vi.fn(async () => ({
    unrecognized: true,
    headers: ['Date', 'Amount', 'Description'],
    rows: [{ Date: '2024-01-01', Amount: '10', Description: 'Test' }],
  })),
}))

describe('CSVUploader mapping sheet', () => {
  it('renders when open and closes via scrim', async () => {
    setMatchMedia(true)
    render(<CSVUploader />)

    const file = new File(['Date,Amount,Description\n2024-01-01,10,Test'], 'test.csv', { type: 'text/csv' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    const panel = await waitFor(() => screen.getByTestId('sheet-panel'))
    expect(panel).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('sheet-scrim'))
    await waitFor(() => expect(screen.queryByTestId('sheet-panel')).not.toBeInTheDocument())
  })
})
