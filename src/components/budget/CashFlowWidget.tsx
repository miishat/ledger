import React from 'react'
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts'
import type { SankeyNodeProps } from 'recharts'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useBudgetStore } from '../../store/useBudgetStore'
import { formatMoney } from '../planner/format'
import { chartTooltipStyles } from '../../utils/chartTheme'
import { countsAsIncome } from '../../utils/budget/sharedExpenses'
import { inRange, type MonthRange } from '../../utils/budget/period'
import { splitParts } from '../../utils/budget/splits'
import { ChartFigure } from '../ui/ChartFigure'

type NodeKind = 'income' | 'pool' | 'expense' | 'savings'

interface LinkRenderProps {
  sourceX: number
  sourceY: number
  sourceControlX: number
  targetControlX: number
  targetX: number
  targetY: number
  linkWidth: number
  index: number
}

// Income routes into the pool in the accent colour, expenses leave in the
// error colour, and the leftover Savings flow is drawn brighter so the money
// you kept stands out.
function renderLink(incomeLinkCount: number, savingsIndex: number) {
  return ({ sourceX, sourceY, sourceControlX, targetControlX, targetX, targetY, linkWidth, index }: LinkRenderProps) => {
    const isIncome = index < incomeLinkCount
    const isSavings = index === savingsIndex
    const stroke = isIncome || isSavings ? 'var(--accent)' : 'var(--error)'
    const opacity = isSavings ? 0.55 : 0.28
    return (
      <path
        d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={stroke}
        strokeWidth={Math.max(1, linkWidth)}
        strokeOpacity={opacity}
      />
    )
  }
}

function renderNode({ x, y, width, height, payload }: SankeyNodeProps) {
  const kind = (payload as { kind?: NodeKind }).kind
  const name = String(payload.name)
  const label = name.length > 16 ? `${name.slice(0, 15)}…` : name
  const fill = kind === 'expense' ? 'var(--error)' : kind === 'pool' ? 'var(--text-secondary)' : 'var(--accent)'
  return (
    <g>
      <title>{name}</title>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="var(--border-color)" />
      {kind === 'pool' ? null : kind === 'income' ? (
        <text x={x - 6} y={y + height / 2} textAnchor="end" dominantBaseline="middle" fill="var(--text-primary)" fontSize={12}>
          {label}
        </text>
      ) : (
        <text
          x={x + width + 6}
          y={y + height / 2}
          textAnchor="start"
          dominantBaseline="middle"
          fill={kind === 'savings' ? 'var(--accent)' : 'var(--text-primary)'}
          fontSize={12}
        >
          {label}
        </text>
      )}
    </g>
  )
}

export const CashFlowWidget: React.FC<{ range: MonthRange }> = ({ range }) => {
  const transactions = useBudgetStore((s) => s.transactions)
  const categories = useBudgetStore((s) => s.categories)
  const categoryGroups = useBudgetStore((s) => s.categoryGroups)

  const incomeByCat = new Map<string, number>()
  const expenseByGroup = new Map<string, number>()
  for (const t of Object.values(transactions)) {
    if (!inRange(t.date, range)) continue
    if (t.type === 'income') {
      if (!countsAsIncome(t)) continue
      for (const part of splitParts(t)) {
        const name = (part.categoryId && categories[part.categoryId]?.name) || 'Other income'
        incomeByCat.set(name, (incomeByCat.get(name) ?? 0) + part.amount)
      }
    } else {
      for (const part of splitParts(t)) {
        const groupId = part.categoryId ? categories[part.categoryId]?.groupId : undefined
        const name = (groupId && categoryGroups[groupId]?.name) || 'Uncategorized'
        expenseByGroup.set(name, (expenseByGroup.get(name) ?? 0) + part.amount)
      }
    }
  }

  const incomeNames = [...incomeByCat.keys()]
  // A group whose refunds outweigh its spending nets zero or less. A Sankey has
  // no way to draw a negative flow, so the group is left out of the diagram
  // rather than drawn as a node with no link into it.
  const expenseNames = [...expenseByGroup.keys()].filter((name) => (expenseByGroup.get(name) ?? 0) > 0)

  // Check against what will actually be drawn, not against the raw maps: a
  // group that nets to zero or less is filtered out of expenseNames above,
  // so a month with no income and only such a group would otherwise reach
  // the Sankey below with nothing left to render.
  if (incomeNames.length === 0 && expenseNames.length === 0) {
    return (
      <WidgetWrapper title="Cash Flow">
        <p className="text-[13px] text-text-secondary mt-2">No transactions this month.</p>
      </WidgetWrapper>
    )
  }

  const totalIncome = [...incomeByCat.values()].reduce((s, v) => s + v, 0)
  const totalExpense = expenseNames.reduce((s, name) => s + (expenseByGroup.get(name) ?? 0), 0)
  const savings = Math.max(0, totalIncome - totalExpense)

  const poolIdx = incomeNames.length
  const nodes = [
    ...incomeNames.map((name) => ({ name, kind: 'income' as const })),
    { name: 'Income', kind: 'pool' as const },
    ...expenseNames.map((name) => ({ name, kind: 'expense' as const })),
    ...(savings > 0 ? [{ name: 'Savings', kind: 'savings' as const }] : []),
  ]

  const incomeLinks = incomeNames.map((name, i) => ({ source: i, target: poolIdx, value: incomeByCat.get(name)! }))
  const expenseLinks = expenseNames.map((name, i) => ({ source: poolIdx, target: poolIdx + 1 + i, value: expenseByGroup.get(name)! }))
  const savingsLinks = savings > 0 ? [{ source: poolIdx, target: nodes.length - 1, value: savings }] : []
  const links = [...incomeLinks, ...expenseLinks, ...savingsLinks].filter((l) => l.value > 0)

  const savingsIndex = savings > 0 ? links.length - 1 : -1

  return (
    <WidgetWrapper title="Cash Flow">
      <ChartFigure
        label={`Cash flow this period: ${formatMoney(totalIncome)} income across ${incomeNames.length} sources into ${formatMoney(totalExpense)} of expenses across ${expenseNames.length} groups, leaving ${formatMoney(savings)} saved`}
        className="h-[240px] desktop:h-[300px] mt-2"
      >
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={{ nodes, links }}
            nodePadding={24}
            margin={{ top: 24, right: 110, bottom: 10, left: 100 }}
            link={renderLink(incomeLinks.length, savingsIndex)}
            node={renderNode}
          >
            <Tooltip formatter={(value) => formatMoney(Number(value))} {...chartTooltipStyles} />
          </Sankey>
        </ResponsiveContainer>
      </ChartFigure>
    </WidgetWrapper>
  )
}
