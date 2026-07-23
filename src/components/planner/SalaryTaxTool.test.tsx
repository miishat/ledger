import { render, screen } from '@testing-library/react'
import { BracketBar } from './SalaryTaxTool'

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
    // every segment carries a minimum width so labels fit and the 44px rate-label query resolves
    const segment = caption.parentElement as HTMLElement
    expect(segment.style.minWidth).not.toBe('')
  })
})
