import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BackupControls } from './BackupControls'

describe('BackupControls', () => {
  beforeEach(() => localStorage.clear())

  it('renders export and import controls', () => {
    render(<BackupControls />)
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/import/i)).toBeInTheDocument()
  })

  it('shows an error for an invalid import file', async () => {
    render(<BackupControls />)
    const input = screen.getByLabelText(/import/i) as HTMLInputElement
    const file = new File(['{bad'], 'x.json', { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByText(/invalid ledger backup/i)).toBeInTheDocument())
  })
})
