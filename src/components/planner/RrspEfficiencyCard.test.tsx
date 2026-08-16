import { render, screen } from '@testing-library/react'
import { RrspEfficiencyCard } from './RrspEfficiencyCard'

describe('RrspEfficiencyCard', () => {
  it('leads with the rate saved on the next contributed dollar', () => {
    render(<RrspEfficiencyCard taxableIncome={193_000} province="ON" room={33_810} roomIsEstimate />)
    expect(screen.getByText(/saved on your next contributed dollar/i)).toBeInTheDocument()
    // the headline and the top rung both carry the rate, so both must appear
    expect(screen.getAllByText('48.3%')).toHaveLength(2)
  })

  it('shows the money sitting in the top marginal band', () => {
    render(<RrspEfficiencyCard taxableIncome={193_000} province="ON" room={33_810} roomIsEstimate />)
    expect(screen.getByText('$11,560')).toBeInTheDocument()
    expect(screen.getByText('above $181,440')).toBeInTheDocument()
  })

  it('gives a contribution target that clears the top band', () => {
    render(<RrspEfficiencyCard taxableIncome={193_000} province="ON" room={33_810} roomIsEstimate />)
    expect(screen.getByText(/\$11,560 RRSP clears your top band/i)).toBeInTheDocument()
    expect(screen.getByText(/saving \$5,5\d\d/)).toBeInTheDocument()
  })

  it('summarises everything below the top two bands in one rung', () => {
    render(<RrspEfficiencyCard taxableIncome={193_000} province="ON" room={33_810} roomIsEstimate />)
    expect(screen.getByText(/and below/)).toBeInTheDocument()
  })

  it('marks estimated room as an estimate', () => {
    render(<RrspEfficiencyCard taxableIncome={193_000} province="ON" room={33_810} roomIsEstimate />)
    expect(screen.getByText(/\$33,810 estimated remaining room/i)).toBeInTheDocument()
  })

  it('drops the estimate wording when the room came from the user', () => {
    render(
      <RrspEfficiencyCard taxableIncome={193_000} province="ON" room={20_000} roomIsEstimate={false} />,
    )
    expect(screen.getByText(/\$20,000 remaining room/i)).toBeInTheDocument()
    expect(screen.queryByText(/estimated remaining room/i)).not.toBeInTheDocument()
  })

  it('says so when the target does not fit in the room', () => {
    render(
      <RrspEfficiencyCard taxableIncome={193_000} province="ON" room={5_000} roomIsEstimate={false} />,
    )
    expect(screen.getByText(/exceeds your .*room by/i)).toBeInTheDocument()
  })

  it('handles income with nothing to shelter', () => {
    render(<RrspEfficiencyCard taxableIncome={0} province="ON" room={0} roomIsEstimate />)
    expect(screen.getByText(/no taxable income to shelter/i)).toBeInTheDocument()
  })

  it('handles income that sits in a single rate band', () => {
    render(<RrspEfficiencyCard taxableIncome={10_000} province="ON" room={1_800} roomIsEstimate />)
    expect(screen.getByText(/pay no income tax at this income/i)).toBeInTheDocument()
  })
})
