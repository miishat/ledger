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

  const COLORS = ['var(--color-accent)', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444']

  const CustomEquityTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const barPayloads = payload.filter((p: any) => p.dataKey !== 'cumulativeVested' && p.dataKey !== 'vestValue');
      
      if (barPayloads.length === 0) return null;
      
      const totalVest = barPayloads.reduce((sum: number, p: any) => sum + p.value, 0);

      return (
        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-3 shadow-md min-w-[200px]">
          <p className="font-semibold text-[var(--color-text-primary)] mb-2">{label}</p>
          
          <div className="flex flex-col gap-1 mb-2">
            {barPayloads.map((p: any, i: number) => {
              if (p.value === 0) return null;
              return (
                <div key={i} className="flex justify-between items-center gap-4 text-[13px]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.color }} />
                    <span className="text-[var(--color-text-secondary)]">{p.name}</span>
                  </div>
                  <span className="text-[var(--color-text-primary)] font-medium">
                    {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(p.value)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center gap-4 text-[13px] pt-2 border-t border-[var(--color-border)]">
            <span className="text-[var(--color-text-primary)] font-semibold">Total Vesting</span>
            <span className="text-[var(--color-text-primary)] font-bold">
              {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(totalVest)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

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

  const allEvents: (VestEvent & { grantName: string, grantId: string })[] = []
  primaryPackage.rsuGrants.forEach(grant => {
    const events = generateVestEvents(grant, primaryPackage.companyCurrentPrice)
    const taggedEvents = events.map(e => ({ ...e, grantName: grant.grantName, grantId: grant.id }))
    allEvents.push(...taggedEvents)
  })

  // Calculate cumulative vested before the window starts
  const windowStartDate = timeMode === 'current-year' ? new Date(targetYear, 0, 1) : new Date(targetYear, currentMonth, 1);
  let cumulativeVested = allEvents.filter(e => e.date && new Date(e.date) < windowStartDate).reduce((sum, e) => sum + e.vestValue, 0);

  const chartData = displayMonths.map(dm => {
    const dataRow: any = { monthLabel: dm.label, vestValue: 0 }
    let totalVestThisMonth = 0

    primaryPackage.rsuGrants.forEach((grant) => {
      const grantKey = grant.id
      const eventsThisMonth = allEvents.filter(e => {
        if (!e.date || e.grantId !== grant.id) return false;
        const eventDate = new Date(e.date);
        return eventDate.getMonth() === dm.monthIndex && eventDate.getFullYear() === dm.year;
      })
      const vestValue = eventsThisMonth.reduce((sum, e) => sum + e.vestValue, 0)
      dataRow[grantKey] = vestValue
      totalVestThisMonth += vestValue
    })

    cumulativeVested += totalVestThisMonth;
    dataRow.vestValue = totalVestThisMonth;
    dataRow.cumulativeVested = cumulativeVested;

    return dataRow;
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
              <Tooltip content={<CustomEquityTooltip />} />
              {primaryPackage.rsuGrants.map((grant, index) => (
                <Bar 
                  key={grant.id}
                  yAxisId="left" 
                  dataKey={grant.id} 
                  name={grant.grantName} 
                  stackId="a"
                  fill={COLORS[index % COLORS.length]} 
                  opacity={0.8} 
                />
              ))}
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
