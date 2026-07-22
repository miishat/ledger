import React from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useBudgetStore } from '../../store/useBudgetStore'
import { incomeExpenseSeries, savingsRate } from '../../store/budgetSelectors'
import { formatMoney } from '../planner/format'
import { chartTooltipStyles } from '../../utils/chartTheme'
import { monthsInRange, type MonthRange } from '../../utils/budget/period'

const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' })

export const SavingsRateWidget: React.FC<{ range: MonthRange }> = ({ range }) => {
  const transactions = useBudgetStore((s) => s.transactions)

  const monthsBack = Math.max(6, monthsInRange(range))
  const refDate = new Date(`${range.to}-15T12:00:00`)
  const series = incomeExpenseSeries(transactions, monthsBack, refDate)
  const rate = savingsRate(series)

  const hasData = series.some((m) => m.income > 0 || m.expense > 0)
  const data = series.map((m) => ({ ...m, label: monthLabel(m.month) }))
  const positive = rate !== null && rate >= 0

  return (
    <WidgetWrapper title={`Savings Rate (${monthsBack} Months)`}>
      {!hasData ? (
        <p className="text-[13px] text-text-secondary mt-2">No income or expenses in this window yet.</p>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-[28px] font-bold ${positive ? 'text-accent' : 'text-error'}`}>
              {rate === null ? '-' : `${Math.round(rate * 100)}%`}
            </span>
            <span className="text-[12px] text-text-secondary">
              saved of income over {monthsBack} months
            </span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) => formatMoney(Number(v))}
                />
                <Tooltip
                  formatter={(value, name) => [formatMoney(Number(value)), name === 'income' ? 'Income' : 'Expenses']}
                  {...chartTooltipStyles}
                />
                <Bar dataKey="income" name="income" fill="var(--accent)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="expense" name="expense" fill="var(--error)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-[12px] text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--error)' }} /> Expenses
            </span>
          </div>
        </div>
      )}
    </WidgetWrapper>
  )
}
