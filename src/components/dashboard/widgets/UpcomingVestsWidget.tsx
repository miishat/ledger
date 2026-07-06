import React from 'react'
import { CalendarClock } from 'lucide-react'
import { WidgetWrapper } from '../WidgetWrapper'
import { useCompensationStore, generateVestEvents } from '../../../store/useCompensationStore'
import { formatMoney } from '../../planner/format'
import { EmptyState } from '../../ui/EmptyState'

const MAX_SHOWN = 4

export const UpcomingVestsWidget: React.FC = () => {
  const pkg = useCompensationStore((s) => s.primaryPackage)
  const now = new Date()

  const upcoming = pkg.rsuGrants
    .flatMap((grant) =>
      generateVestEvents(grant, pkg.companyCurrentPrice).map((e) => ({ ...e, grantName: grant.grantName })),
    )
    .filter((e) => e.date !== undefined && new Date(e.date) > now)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, MAX_SHOWN)

  return (
    <WidgetWrapper title="Upcoming Vests">
      {upcoming.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          message="No upcoming vests"
          hint="Add RSU grants in Compensation to see your next vesting payouts here."
        />
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          {upcoming.map((e) => (
            <div key={`${e.grantName}-${e.monthIndex}`} className="flex items-center justify-between p-2 bg-bg-secondary rounded border border-border">
              <div>
                <p className="text-[13px] text-text-primary font-medium">{e.grantName}</p>
                <p className="text-[12px] text-text-secondary">
                  {new Date(e.date!).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span className="text-[14px] font-medium text-accent">{formatMoney(e.vestValue)}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  )
}
