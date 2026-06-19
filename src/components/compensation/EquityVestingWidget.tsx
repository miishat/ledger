import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useCompensationStore, generateVestEvents } from '../../store/useCompensationStore'
import type { VestEvent } from '../../store/useCompensationStore'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export function EquityVestingWidget() {
  const { primaryPackage, timeMode } = useCompensationStore()

  if (primaryPackage.rsuGrants.length === 0) {
    return (
      <WidgetWrapper title="Equity Vesting Schedule">
        <div className="flex flex-col items-center justify-center h-[280px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-6">
          <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">No RSU Grants Added</p>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-2 text-center">
            Add RSU details in the compensation modal to see your vesting timeline.
          </p>
        </div>
      </WidgetWrapper>
    )
  }

  const today = new Date()
  const targetYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const displayMonths = Array.from({ length: 12 }).map((_, i) => {
    if (timeMode === 'current-year') {
      return {
        label: new Date(targetYear, i, 1).toLocaleString('default', { month: 'short' }),
        monthIndex: i,
        year: targetYear
      }
    } else {
      const date = new Date(targetYear, currentMonth + i, 1);
      return {
        label: date.toLocaleString('default', { month: 'short' }),
        monthIndex: date.getMonth(),
        year: date.getFullYear()
      }
    }
  });

  const allEvents: VestEvent[] = []
  primaryPackage.rsuGrants.forEach(grant => {
    const events = generateVestEvents(grant, primaryPackage.companyCurrentPrice)
    allEvents.push(...events)
  })

  // Calculate cumulative vested before the window starts
  const windowStartDate = timeMode === 'current-year' ? new Date(targetYear, 0, 1) : new Date(targetYear, currentMonth, 1);
  let cumulativeVested = allEvents.filter(e => e.date && new Date(e.date) < windowStartDate).reduce((sum, e) => sum + e.vestValue, 0);

  const chartData = displayMonths.map(dm => {
    const eventsThisMonth = allEvents.filter(e => {
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      return eventDate.getMonth() === dm.monthIndex && eventDate.getFullYear() === dm.year;
    })
    const vestValue = eventsThisMonth.reduce((sum, e) => sum + e.vestValue, 0)
    cumulativeVested += vestValue;

    return {
      monthLabel: dm.label,
      vestValue,
      cumulativeVested
    }
  })


  return (
    <WidgetWrapper title="Equity Vesting Schedule">
      <div className="flex flex-col gap-4">
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis 
                dataKey="monthLabel" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} 
              />
              <YAxis 
                yAxisId="left" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} 
                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} 
                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', borderRadius: '8px' }} 
                formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name]} 
              />
              <Bar 
                yAxisId="left" 
                dataKey="vestValue" 
                name="Vest Event" 
                fill="var(--color-accent)" 
                opacity={0.8} 
                radius={[3, 3, 0, 0]} 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="cumulativeVested" 
                name="Cumulative" 
                stroke="var(--color-accent)" 
                strokeWidth={2} 
                dot={false} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </WidgetWrapper>
  )
}
