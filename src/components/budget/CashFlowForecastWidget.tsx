import React from 'react'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useBudgetStore } from '../../store/useBudgetStore'
import { detectRecurring } from '../../utils/budget/recurring'
import { forecastMonthEnd } from '../../utils/budget/cashFlowForecast'
import { formatMoney } from '../planner/format'

export const CashFlowForecastWidget: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const transactions = useBudgetStore((s) => s.transactions)
  const today = new Date().toISOString().slice(0, 10)
  const f = forecastMonthEnd(transactions, detectRecurring(transactions), selectedMonth, today)

  return (
    <WidgetWrapper title="Month-end forecast">
      <div className="flex flex-col gap-2 mt-2 text-[13px]">
        <div className="flex justify-between"><span className="text-text-secondary">Net so far</span><span className="text-text-primary">{formatMoney(f.netSoFar)}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Expected in</span><span className="text-text-primary">+{formatMoney(f.expectedIn)}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Expected out</span><span className="text-text-primary">−{formatMoney(f.expectedOut)}</span></div>
        <div className="flex justify-between border-t border-border pt-2">
          <span className="text-text-secondary font-medium">Projected month-end</span>
          <span className={`font-semibold ${f.projectedNet >= 0 ? 'text-accent' : 'text-error'}`}>{formatMoney(f.projectedNet)}</span>
        </div>
        {f.pending.slice(0, 5).map((p) => (
          <p key={`${p.description}-${p.expectedDate}`} className="text-[12px] text-text-secondary">
            {p.expectedDate}: {p.type === 'income' ? '+' : '−'}{formatMoney(p.amount)} {p.description}
          </p>
        ))}
      </div>
    </WidgetWrapper>
  )
}
