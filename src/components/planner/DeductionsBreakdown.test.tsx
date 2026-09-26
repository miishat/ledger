import { render, screen } from '@testing-library/react'
import { DeductionsBreakdown } from './DeductionsBreakdown'
import { annualSalaryTax } from '../../utils/finance/canadaTax'

const sample = {
  ...annualSalaryTax(193_000, 'ON'),
  gross: 193_000,
  federal: 37_925,
  provincial: 22_518,
  pension: 4_646,
  ei: 1_123,
  net: 126_788,
}

describe('DeductionsBreakdown', () => {
  it('reads the pension amount from the annual employee result', () => {
    const t = annualSalaryTax(100_000, 'ON')
    render(<DeductionsBreakdown t={t} />)
    expect(screen.getByText('CPP (incl. CPP2) $4,646')).toBeInTheDocument()
  })

  it('names the gross income the bar represents', () => {
    render(<DeductionsBreakdown t={sample} />)
    expect(screen.getByText('Where $193,000 Goes')).toBeInTheDocument()
  })

  it('describes the stacked bar for screen readers', () => {
    render(<DeductionsBreakdown t={sample} />)
    const bar = screen.getByRole('img')
    expect(bar.getAttribute('aria-label')).toContain('Federal tax $37,925')
    expect(bar.getAttribute('aria-label')).toContain('net pay $126,788')
  })

  it('legends every segment including net pay', () => {
    render(<DeductionsBreakdown t={sample} />)
    expect(screen.getByText('Federal Tax $37,925')).toBeInTheDocument()
    expect(screen.getByText('Provincial Tax $22,518')).toBeInTheDocument()
    expect(screen.getByText('CPP (incl. CPP2) $4,646')).toBeInTheDocument()
    expect(screen.getByText('EI $1,123')).toBeInTheDocument()
    expect(screen.getByText('Net Pay $126,788')).toBeInTheDocument()
  })

  it('shows each deduction as a percentage of gross', () => {
    render(<DeductionsBreakdown t={sample} />)
    expect(screen.getByText('20%')).toBeInTheDocument() // federal
    expect(screen.getByText('12%')).toBeInTheDocument() // provincial
    expect(screen.getByText('1%')).toBeInTheDocument() // EI rounds up from 0.58%
    expect(screen.getByText(/share of gross income/i)).toBeInTheDocument()
  })

  it('renders a Total Deductions summary row with the total amount', () => {
    render(<DeductionsBreakdown t={sample} />)
    expect(screen.getByText('Total Deductions')).toBeInTheDocument()
    expect(screen.getByText('$66,212')).toBeInTheDocument()
  })

  it('no longer states the total deductions figure in the caption', () => {
    render(<DeductionsBreakdown t={sample} />)
    expect(screen.queryByText(/Total deductions \$66,212/)).not.toBeInTheDocument()
  })

  it('warns that net pay still includes any RRSP or FHSA contribution entered', () => {
    render(<DeductionsBreakdown t={sample} />)
    expect(
      screen.getByText(/net pay here still includes any rrsp or fhsa contribution you entered/i),
    ).toBeInTheDocument()
  })

  it('does not divide by zero at no income', () => {
    render(
      <DeductionsBreakdown
        t={annualSalaryTax(0, 'ON')}
      />,
    )
    expect(screen.getByText('Where $0 Goes')).toBeInTheDocument()
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0)
  })
})
