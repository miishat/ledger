import { render, screen } from '@testing-library/react'
import { BracketBar, SalaryTaxTool } from './SalaryTaxTool'
import { usePlannerStore } from '../../store/usePlannerStore'
import { estimateRrspRoom } from '../../utils/finance/canadaTax'
import { formatMoney } from './format'

const initialState = usePlannerStore.getState()
beforeEach(() => {
  localStorage.clear()
  usePlannerStore.setState(initialState, true)
})

describe('BracketBar', () => {
  it('only shows rate labels when the segment is wide enough (container query)', () => {
    render(
      <BracketBar
        title="Federal"
        income={100000}
        brackets={[
          { upTo: 57375, rate: 0.15 },
          { upTo: 114750, rate: 0.205 },
          { upTo: Infinity, rate: 0.26 },
        ]}
      />,
    )
    const label = screen.getByText('15.0%')
    // hidden by default, shown only from 44px container width up
    expect(label.className).toContain('hidden')
    expect(label.className).toContain('@min-[44px]:flex')
    // the segment box the label sits in must be a container for the query to work
    expect((label.parentElement as HTMLElement).className).toContain('@container')
  })

  it('keeps the open-ended bracket caption intact (no truncation of the "+")', () => {
    render(
      <BracketBar
        title="Federal"
        income={100000}
        brackets={[
          { upTo: 57375, rate: 0.15 },
          { upTo: 114750, rate: 0.205 },
          { upTo: Infinity, rate: 0.26 },
        ]}
      />,
    )
    const caption = screen.getByText('$114,750+')
    const classes = caption.className.split(/\s+/)
    expect(classes).not.toContain('truncate') // truncation would drop the trailing "+"
  })

  it('lays segments out so the row can never overflow into a scrollbar', () => {
    const { container } = render(
      <BracketBar
        title="Ontario"
        income={193000}
        brackets={[
          { upTo: 53891, rate: 0.0505 },
          { upTo: 107785, rate: 0.0915 },
          { upTo: 150000, rate: 0.1116 },
          { upTo: 220000, rate: 0.1216 },
          { upTo: Infinity, rate: 0.1316 },
        ]}
      />,
    )
    // nothing in the subtree may scroll horizontally
    expect(container.querySelectorAll('.overflow-x-auto')).toHaveLength(0)
    const segment = screen.getByText('$0 to $53,891').parentElement as HTMLElement
    // proportional but shrinkable: gaps come out of the segments, not the row
    expect(segment.style.flex).not.toBe('')
    expect(segment.style.flex).toContain('1 0')
    expect(segment.style.minWidth).toBe('')
    expect(segment.className).toContain('min-w-0')
    expect(segment.className).not.toContain('shrink-0')
  })

  it('shortens the range caption in segments too narrow for the full figures', () => {
    render(
      <BracketBar
        title="Ontario"
        income={193000}
        brackets={[
          { upTo: 53891, rate: 0.0505 },
          { upTo: 107785, rate: 0.0915 },
          { upTo: 150000, rate: 0.1116 },
          { upTo: 220000, rate: 0.1216 },
          { upTo: Infinity, rate: 0.1316 },
        ]}
      />,
    )
    const full = screen.getByText('$0 to $53,891')
    const compact = screen.getByText('$0 to $54k')
    // the segment must be its own query container for the swap to resolve
    expect((full.parentElement as HTMLElement).className).toContain('@container')
    expect(full.className).toContain('@min-[120px]:block')
    expect(compact.className).toContain('@min-[120px]:hidden')
  })

  it('hides the caption entirely below 88px, and bounds the segment column so nothing can paint over a neighbour', () => {
    render(
      <BracketBar
        title="Ontario"
        income={193000}
        brackets={[
          { upTo: 53891, rate: 0.0505 },
          { upTo: 107785, rate: 0.0915 },
          { upTo: 150000, rate: 0.1116 },
          { upTo: 220000, rate: 0.1216 },
          { upTo: Infinity, rate: 0.1316 },
        ]}
      />,
    )
    const compact = screen.getByText('$0 to $54k')
    expect(compact.className).toContain('hidden')
    expect(compact.className).toContain('@min-[88px]:block')
    const column = screen.getByText('$0 to $53,891').closest('.min-w-0') as HTMLElement
    expect(column.className).toContain('overflow-hidden')
  })
})

describe('SalaryTaxTool layout', () => {
  it('offers an optional RRSP Room field', () => {
    render(<SalaryTaxTool />)
    expect(screen.getByLabelText('RRSP Room')).toBeInTheDocument()
  })

  it('renders the deductions block and the RRSP efficiency block side by side', () => {
    const { container } = render(<SalaryTaxTool />)
    expect(screen.getByText(/^Where \$/)).toBeInTheDocument()
    expect(screen.getByText('RRSP Efficiency')).toBeInTheDocument()
    const pair = container.querySelector('.lg\\:grid-cols-\\[1\\.35fr_1fr\\]')
    expect(pair).not.toBeNull()
    expect(pair?.children).toHaveLength(2)
  })

  it('stretches the paired cards to a common height instead of aligning to the top', () => {
    const { container } = render(<SalaryTaxTool />)
    const pair = container.querySelector('.lg\\:grid-cols-\\[1\\.35fr_1fr\\]')
    expect(pair).not.toBeNull()
    expect(pair?.className).not.toContain('items-start')
  })

  it('passes the full estimated room through to the efficiency card when nothing has been contributed', () => {
    render(<SalaryTaxTool />)
    const expectedRoom = formatMoney(estimateRrspRoom(100000))
    expect(screen.getByText(new RegExp(`${expectedRoom.replace('$', '\\$')} estimated remaining room`, 'i'))).toBeInTheDocument()
  })

  it('subtracts an already-entered RRSP contribution from the room shown by the efficiency card', () => {
    usePlannerStore.getState().setInput('salary-tax', 'income', 193000)
    usePlannerStore.getState().setInput('salary-tax', 'rrsp', 20000)
    render(<SalaryTaxTool />)
    const totalRoom = estimateRrspRoom(193000)
    const remaining = formatMoney(Math.max(0, totalRoom - 20000))
    expect(screen.getByText(new RegExp(`${remaining.replace('$', '\\$')} estimated remaining room`, 'i'))).toBeInTheDocument()
  })
})
