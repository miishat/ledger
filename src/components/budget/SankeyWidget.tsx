import React from 'react'
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts'
import type { SankeyNodeProps } from 'recharts'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useBudgetStore } from '../../store/useBudgetStore'
import { formatMoney } from '../planner/format'
import { chartTooltipStyles } from '../../utils/chartTheme'

function renderSankeyNode(budgetIdx: number) {
  return ({ x, y, width, height, index, payload }: SankeyNodeProps) => {
    const isOut = index >= budgetIdx
    const name = String(payload.name)
    const label = name.length > 16 ? `${name.slice(0, 15)}…` : name
    return (
      <g>
        <title>{name}</title>
        <rect x={x} y={y} width={width} height={height} fill="var(--accent)" stroke="var(--border-color)" />
        <text
          x={isOut ? x + width + 6 : x - 6}
          y={y + height / 2}
          textAnchor={isOut ? 'start' : 'end'}
          dominantBaseline="middle"
          fill="var(--text-primary)"
          fontSize={12}
        >
          {label}
        </text>
      </g>
    )
  }
}

export const SankeyWidget: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const transactions = useBudgetStore((s) => s.transactions)
  const categories = useBudgetStore((s) => s.categories)
  const categoryGroups = useBudgetStore((s) => s.categoryGroups)

  const incomeByCat = new Map<string, number>()
  const expenseByGroup = new Map<string, number>()
  for (const t of Object.values(transactions)) {
    if (!t.date.startsWith(selectedMonth)) continue
    if (t.type === 'income') {
      const name = (t.categoryId && categories[t.categoryId]?.name) || 'Other income'
      incomeByCat.set(name, (incomeByCat.get(name) ?? 0) + t.amount)
    } else {
      const groupId = t.categoryId ? categories[t.categoryId]?.groupId : undefined
      const name = (groupId && categoryGroups[groupId]?.name) || 'Uncategorized'
      expenseByGroup.set(name, (expenseByGroup.get(name) ?? 0) + t.amount)
    }
  }

  if (incomeByCat.size === 0 && expenseByGroup.size === 0) {
    return (
      <WidgetWrapper title="Income Flow">
        <p className="text-[13px] text-text-secondary mt-2">No transactions this month.</p>
      </WidgetWrapper>
    )
  }

  const nodes = [
    ...[...incomeByCat.keys()].map((name) => ({ name })),
    { name: 'Budget' },
    ...[...expenseByGroup.keys()].map((name) => ({ name })),
  ]
  const budgetIdx = incomeByCat.size
  const links = [
    ...[...incomeByCat.entries()].map(([, value], i) => ({ source: i, target: budgetIdx, value })),
    ...[...expenseByGroup.entries()].map(([, value], i) => ({
      source: budgetIdx,
      target: budgetIdx + 1 + i,
      value,
    })),
  ].filter((l) => l.value > 0)

  return (
    <WidgetWrapper title="Income Flow">
      <div className="h-[300px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={{ nodes, links }}
            nodePadding={24}
            margin={{ top: 10, right: 100, bottom: 10, left: 100 }}
            link={{ stroke: 'var(--accent)', strokeOpacity: 0.35 }}
            node={renderSankeyNode(budgetIdx)}
          >
            <Tooltip formatter={(value) => formatMoney(Number(value))} {...chartTooltipStyles} />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </WidgetWrapper>
  )
}
