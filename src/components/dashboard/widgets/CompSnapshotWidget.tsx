import React from 'react'
import { Link } from 'react-router-dom'
import { WidgetWrapper } from '../WidgetWrapper'
import { useCompensationDisplay } from '../../../hooks/useCompensationDisplay'
import { calcTotalComp, generateVestEvents } from '../../../store/useCompensationStore'
import { formatMoney } from '../../planner/format'

export const CompSnapshotWidget: React.FC = () => {
  const { pkg } = useCompensationDisplay()

  if (pkg.baseSalary === 0) {
    return (
      <WidgetWrapper title="Compensation">
        <p className="text-[13px] text-text-secondary mt-2">
          <Link to="/compensation" className="text-accent hover:underline">Set up your package</Link> to see total comp and upcoming vests.
        </p>
      </WidgetWrapper>
    )
  }

  const now = new Date()
  const upcoming = pkg.rsuGrants
    .flatMap((g) => generateVestEvents(g, pkg.companyCurrentPrice))
    .filter((e) => e.date && new Date(e.date) > now)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1))
    .slice(0, 3)

  return (
    <WidgetWrapper title="Compensation">
      <div className="flex flex-col gap-1 mt-2">
        <span className="text-[28px] font-bold text-accent">{formatMoney(calcTotalComp(pkg))}</span>
        <span className="text-[12px] text-text-secondary">total comp (this year)</span>
        {upcoming.map((e) => (
          <span key={`${e.monthIndex}-${e.label}`} className="text-[12px] text-text-secondary">
            Vest {new Date(e.date!).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' })}: {formatMoney(e.vestValue)}
          </span>
        ))}
      </div>
    </WidgetWrapper>
  )
}
