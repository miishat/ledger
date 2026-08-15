import { render, screen } from '@testing-library/react'
import { BracketBar, SalaryTaxTool } from './SalaryTaxTool'

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
})
