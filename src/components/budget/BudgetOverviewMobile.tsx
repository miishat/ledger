import React, { useId, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { formatMoney } from '../planner/format'
import { foldSmallest } from '../../utils/budget/foldSmallest'
import { PHONE_LIST_LIMIT, useShowMore } from '../../hooks/useShowMore'
import { ShowMoreButton } from '../ui/ShowMoreButton'
import type { MonthRange } from '../../utils/budget/period'
import { useBudgetOverview, type BudgetOverview, type CategoryRow, type Pace } from './useBudgetOverview'
import { CashFlowWidget } from './CashFlowWidget'
import { SavingsRateWidget } from './SavingsRateWidget'
import { OwedToMeWidget } from './OwedToMeWidget'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5, var(--error))']

const sign = (n: number) => `${n >= 0 ? '+' : '-'}${formatMoney(Math.abs(n))}`
const tone = (n: number) => (n >= 0 ? 'text-accent' : 'text-error')
const share = (n: number, of: number) => (of > 0 ? Math.max(0, Math.min(1, n / of)) : 0)
const paceText = (p: Pace) => (p === 'over' ? 'Over Pace' : p === 'under' ? 'Under Pace' : 'On Pace')

const Card: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <section aria-label={label} className="themed-card rounded-2xl p-4">{children}</section>
)
const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => <h2 className="text-[18px] font-semibold text-text-primary">{children}</h2>

const Bar: React.FC<{ frac: number; bad?: boolean; h?: string }> = ({ frac, bad, h = 'h-1.5' }) => (
  <div className={`${h} rounded-full bg-bg-tertiary overflow-hidden`}>
    <div className={`h-full rounded-full ${bad ? 'bg-error' : 'bg-accent'}`} style={{ width: `${frac * 100}%` }} />
  </div>
)

/** A ring split by slice, with a label and a figure in the middle. */
const Donut: React.FC<{ items: [string, number][]; total: number; top: string; main: string; mainClass: string }> = ({ items, total, top, main, mainClass }) => {
  const size = 132, stroke = 16
  const r = (size - stroke) / 2, len = 2 * Math.PI * r, c = size / 2
  const fracs = items.map(([, value]) => share(value, total))
  const starts = fracs.map((_, i) => fracs.slice(0, i).reduce((sum, f) => sum + f, 0))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth={stroke} />
        {items.map(([name], i) => {
          const f = fracs[i]
          const slice = <circle key={name} cx={c} cy={c} r={r} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={stroke} strokeDasharray={`${f * len} ${len}`} strokeDashoffset={-starts[i] * len} />
          return slice
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[12px] text-text-secondary">{top}</span>
        <span className={`text-[18px] font-bold tabular-nums ${mainClass}`}>{main}</span>
      </div>
    </div>
  )
}

/** One list with a share bar per row, capped on a phone and expanded in place. */
const BarList: React.FC<{ items: [string, number][]; total: number; noun: string; bad?: boolean; label: string }> = ({ items, total, noun, bad, label }) => {
  const list = useShowMore(items, PHONE_LIST_LIMIT)
  const listId = useId()
  return (
    <div>
      <div id={listId} role="group" aria-label={label}>
        {list.visible.map(([name, value]) => (
          <div key={name} className="py-2">
            <div className="flex justify-between gap-2 text-[15px]"><span className="text-text-primary truncate">{name}</span><span className="shrink-0 tabular-nums font-medium text-text-primary">{formatMoney(value)}</span></div>
            <div className="mt-1.5"><Bar frac={share(value, total)} bad={bad} /></div>
          </div>
        ))}
      </div>
      {list.truncates && <ShowMoreButton total={items.length} noun={noun} expanded={list.expanded} onToggle={list.toggle} controls={listId} />}
    </div>
  )
}

const Rows: React.FC<{ rows: CategoryRow[]; showPace: boolean }> = ({ rows, showPace }) => (
  <>
    {rows.map((r) => (
      <div key={r.id} className="py-2">
        <div className="flex justify-between gap-2 text-[15px]">
          <span className="text-text-primary truncate">{r.name}</span>
          <span className={`shrink-0 tabular-nums ${r.pace === 'over' ? 'text-error' : 'text-text-secondary'}`}>{formatMoney(r.spent)} / {formatMoney(r.target)}</span>
        </div>
        <div className="mt-1.5"><Bar frac={share(r.spent, r.target)} bad={r.pace === 'over'} /></div>
        {showPace && <div className={`mt-1 text-meta ${r.pace === 'over' ? 'text-error' : 'text-text-secondary'}`}>{paceText(r.pace)}</div>}
      </div>
    ))}
  </>
)

const BudgetCard: React.FC<{ d: BudgetOverview }> = ({ d }) => {
  const list = useShowMore(d.rows, 4)
  const listId = useId()
  const hasAnything = d.rows.length > 0 || d.annualRows.length > 0
  return (
    <Card label="Budget vs. Actual">
      <Title>Budget vs. Actual</Title>
      {!hasAnything ? (
        <p className="mt-2 text-[14px] text-text-secondary">Set target amounts on categories to track progress.</p>
      ) : (
        <>
          {d.budgeted > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[14px]">
                <span className="text-text-secondary">Total</span>
                <span className={`tabular-nums font-medium ${d.expense > d.budgeted ? 'text-error' : 'text-text-primary'}`}>{formatMoney(d.expense)} / {formatMoney(d.budgeted)}</span>
              </div>
              <div className="mt-1.5"><Bar frac={share(d.expense, d.budgeted)} bad={d.expense > d.budgeted} h="h-3" /></div>
            </div>
          )}
          <div id={listId} role="group" aria-label="Category budgets"><Rows rows={list.visible} showPace={d.current} /></div>
          {list.truncates && <ShowMoreButton total={d.rows.length} noun="categories" expanded={list.expanded} onToggle={list.toggle} controls={listId} />}
          {d.annualRows.length > 0 && (
            <div className="mt-2 border-t border-border pt-2">
              <p className="text-[12px] uppercase tracking-wide text-text-secondary">Annual Budgets</p>
              <Rows rows={d.annualRows} showPace />
            </div>
          )}
          {d.unbudgeted > 0 && (
            <div className="flex justify-between border-t border-border pt-2 text-[14px]"><span className="text-text-secondary">Unbudgeted Spending</span><span className="font-medium tabular-nums text-error">{formatMoney(d.unbudgeted)}</span></div>
          )}
        </>
      )}
    </Card>
  )
}

const Fold: React.FC<{ title: string; figure: string; figureClass: string; children: React.ReactNode }> = ({ title, figure, figureClass, children }) => (
  <details className="themed-card rounded-2xl group">
    <summary className="flex items-center gap-3 px-4 min-h-14 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
      <span className="flex-1 min-w-0 text-[15px] font-semibold text-text-primary">{title}</span>
      <span className={`text-[15px] font-semibold tabular-nums ${figureClass}`}>{figure}</span>
      <ChevronRight className="w-4 h-4 shrink-0 text-text-secondary transition-transform group-open:rotate-90" aria-hidden="true" />
    </summary>
    <div className="px-4 pb-3 border-t border-border pt-2">{children}</div>
  </details>
)

/** Phone Budgeting Overview: a donut that switches between Spending and Income (the switch sits under it), then
 *  In, Net and Saved, the budget, the income sources, and the cash flow, savings rate and who owes you. */
export const BudgetOverviewMobile: React.FC<{ range: MonthRange }> = ({ range }) => {
  const d = useBudgetOverview(range)
  const [view, setView] = useState<'out' | 'in'>('out')
  const spending = view === 'out'
  const total = spending ? d.expense : d.income
  const slices = foldSmallest(spending ? d.groups : d.sources, COLORS.length - 1, 'Other')

  return (
    <div className="flex flex-col gap-4">
      <Card label={spending ? 'Spending' : 'Income'}>
        {total > 0 ? (
          <div className="flex items-center gap-4">
            <Donut items={slices} total={total} top={spending ? 'Out' : 'In'} main={formatMoney(total)} mainClass={spending ? 'text-text-primary' : 'text-accent'} />
            <div className="min-w-0 flex-1 space-y-1.5">
              {slices.map(([name, value], i) => (
                <div key={name} className="flex items-center gap-2 text-[14px]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden="true" />
                  <span className="flex-1 truncate text-text-primary">{name}</span>
                  <span className="tabular-nums text-text-secondary">{Math.round(share(value, total) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-text-secondary">No {spending ? 'spending' : 'income'} in this period yet.</p>
        )}
        <div role="group" aria-label="Chart shows" className="mt-4 flex bg-bg-secondary border border-border rounded-xl p-1">
          {([['out', 'Spending'], ['in', 'Income']] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}
              className={`flex-1 min-h-11 rounded-lg text-[14px] font-medium ${view === id ? 'bg-accent/15 text-accent' : 'text-text-secondary'}`}>{label}</button>
          ))}
        </div>
      </Card>
      <Card label="Net Change">
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-[12px] text-text-secondary">In</div><div className="text-[16px] font-semibold tabular-nums text-accent">{formatMoney(d.income)}</div></div>
          <div><div className="text-[12px] text-text-secondary">Net</div><div data-key-figure className={`text-[16px] font-semibold tabular-nums ${tone(d.net)}`}>{sign(d.net)}</div></div>
          <div><div className="text-[12px] text-text-secondary">Saved</div><div className="text-[16px] font-semibold tabular-nums text-text-primary">{d.rate === null ? '-' : `${Math.round(d.rate * 100)}%`}</div></div>
        </div>
        {d.projected !== null && (
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-[14px]">
            <span className="text-text-secondary">Projected Net</span>
            <span className={`font-medium tabular-nums ${tone(d.projected)}`}>{sign(d.projected)}</span>
          </div>
        )}
      </Card>
      <BudgetCard d={d} />
      <Fold title="Income" figure={formatMoney(d.income)} figureClass="text-accent">
        {d.sources.length === 0
          ? <p className="py-2 text-[14px] text-text-secondary">No income in this period yet.</p>
          : <BarList items={d.sources} total={d.income} noun="sources" label="Income sources" />}
      </Fold>
      <CashFlowWidget range={range} />
      <SavingsRateWidget range={range} />
      <OwedToMeWidget />
    </div>
  )
}
