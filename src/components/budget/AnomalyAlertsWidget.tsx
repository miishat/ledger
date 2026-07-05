import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useBudgetStore } from '../../store/useBudgetStore'
import { detectAnomalies } from '../../utils/budget/categoryStats'
import { formatMoney } from '../planner/format'

export const AnomalyAlertsWidget: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const transactions = useBudgetStore((s) => s.transactions)
  const categories = useBudgetStore((s) => s.categories)
  const refDate = new Date(`${selectedMonth}-15T12:00:00`)
  const anomalies = detectAnomalies(transactions, categories, selectedMonth, refDate)

  return (
    <WidgetWrapper title="Spending Alerts">
      {anomalies.length === 0 ? (
        <p className="text-[13px] text-text-secondary mt-2">Nothing unusual this month.</p>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          {anomalies.map((a) => (
            <div key={a.categoryId} className="flex items-start gap-2 text-[13px]">
              <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-text-primary">
                <span className="font-medium">{categories[a.categoryId]?.name ?? a.categoryId}</span> is at{' '}
                {formatMoney(a.monthSpend)} — {a.ratio.toFixed(1)}× your {formatMoney(a.rollingAvg)} 3-month average.
              </p>
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  )
}
