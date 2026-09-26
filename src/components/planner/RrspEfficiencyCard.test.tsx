import { render, screen } from '@testing-library/react'
import { RrspEfficiencyCard } from './RrspEfficiencyCard'
import { annualSalaryTax, marginalSlices } from '../../utils/finance/canadaTax'
import { formatMoney } from './format'

function renderCard(gross: number, room: number, roomIsEstimate = true) {
  return render(
    <RrspEfficiencyCard
      gross={gross}
      taxableIncome={annualSalaryTax(gross, 'ON').taxableIncome}
      rrsp={0}
      fhsa={0}
      province="ON"
      room={room}
      roomIsEstimate={roomIsEstimate}
    />,
  )
}

describe('RrspEfficiencyCard', () => {
  it('uses fixed gross and current contributions for the next RRSP saving', () => {
    const gross = 193_000
    const rrsp = 20_000
    const fhsa = 8_000
    const slices = marginalSlices(gross, 'ON', rrsp, fhsa)
    const t = annualSalaryTax(gross, 'ON', rrsp, fhsa)
    render(<RrspEfficiencyCard gross={gross} taxableIncome={t.taxableIncome} rrsp={rrsp} fhsa={fhsa} province="ON" room={13_810} roomIsEstimate />)
    expect(screen.getAllByText(`${slices[0].rate.toFixed(1)}%`)).toHaveLength(2)
  })

  it('leads with the rate saved on the next contributed dollar', () => {
    renderCard(193_000, 33_810)
    expect(screen.getByText(/saved on your next contributed dollar/i)).toBeInTheDocument()
    // the headline and the top rung both carry the rate, so both must appear
    expect(screen.getAllByText('48.3%')).toHaveLength(2)
  })

  it('shows the money sitting in the top marginal band', () => {
    renderCard(193_000, 33_810)
    expect(screen.getByText('$10,433')).toBeInTheDocument()
    expect(screen.getByText('above $181,440')).toBeInTheDocument()
  })

  it('gives a contribution target that clears the top band', () => {
    renderCard(193_000, 33_810)
    expect(screen.getByText(/\$10,433 RRSP clears your top band/i)).toBeInTheDocument()
    const before = annualSalaryTax(193_000, 'ON')
    const after = annualSalaryTax(193_000, 'ON', 10_433)
    const saved = before.federal + before.provincial - after.federal - after.provincial
    expect(screen.getByText(`$10,433 RRSP clears your top band, saving ${formatMoney(saved)}`)).toBeInTheDocument()
  })

  it('summarises everything below the top two bands in one rung', () => {
    renderCard(193_000, 33_810)
    expect(screen.getByText(/and below/)).toBeInTheDocument()
  })

  it('marks estimated room as an estimate', () => {
    renderCard(193_000, 33_810)
    expect(screen.getByText(/\$33,810 estimated remaining room/i)).toBeInTheDocument()
  })

  it('drops the estimate wording when the room came from the user', () => {
    renderCard(193_000, 20_000, false)
    expect(screen.getByText(/\$20,000 remaining room/i)).toBeInTheDocument()
    expect(screen.queryByText(/estimated remaining room/i)).not.toBeInTheDocument()
  })

  it('says so when the target does not fit in the room', () => {
    renderCard(193_000, 5_000, false)
    expect(screen.getByText(/exceeds your .*room by/i)).toBeInTheDocument()
  })

  it('handles income with nothing to shelter', () => {
    renderCard(0, 0)
    expect(screen.getByText(/no taxable income to shelter/i)).toBeInTheDocument()
  })

  it('handles income that sits in a single rate band', () => {
    renderCard(10_000, 1_800)
    expect(screen.getByText(/pay no income tax at this income/i)).toBeInTheDocument()
  })

  it('puts the room caption after the room bar in DOM order', () => {
    renderCard(193_000, 33_810)
    const caption = screen.getByText(/Uses \d+% of your \$33,810 estimated remaining room/i)
    const bar = screen.getByRole('progressbar', { name: /remaining room used/i })
    // the bar states the figure the caption then names, so the bar comes first
    expect(bar.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
