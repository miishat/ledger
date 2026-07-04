import React from 'react'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useBudgetStore } from '../../store/useBudgetStore'
import { categoryMonthlySeries } from '../../utils/budget/categoryStats'
import { formatMoney } from '../planner/format'

export const CategoryTrendsWidget: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const transactions = useBudgetStore((s) => s.transactions)
  const categories = useBudgetStore((s) => s.categories)
  const refDate = new Date(`${selectedMonth}-15T12:00:00`)

  const rows = Object.values(categories)
    .map((cat) => ({ cat, series: categoryMonthlySeries(transactions, cat.id, 6, refDate) }))
    .filter(({ series }) => series.some((p) => p.total > 0))
    .sort((a, b) => b.series[5].total - a.series[5].total)
    .slice(0, 8)

  return (
    <WidgetWrapper title="Category trends (6 months)">
      {rows.length === 0 ? (
        <p className="text-[13px] text-text-secondary mt-2">No categorized spending yet.</p>
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {rows.map(({ cat, series }) => (
            <div key={cat.id} className="flex items-center gap-3 text-[13px]">
              <span className="w-28 truncate text-text-secondary">{cat.name}</span>
              <div className="flex-1 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className="w-20 text-right text-text-primary">{formatMoney(series[5].total)}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  )
}
