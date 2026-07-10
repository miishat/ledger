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
})
