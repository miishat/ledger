import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ExternalLink } from 'lucide-react'
import { useCompensationStore, generateVestEvents, getBaseSalaryForMonth } from '../../store/useCompensationStore'
import type { VestEvent } from '../../store/useCompensationStore'
import { useCompensationDisplay } from '../../hooks/useCompensationDisplay'
import { chartTooltipStyles } from '../../utils/chartTheme'
import type { ChartTooltipProps } from '../../utils/chartTheme'
import { retirementRange, PLAN_NAMES } from '../retirement/retirementPresentation'
import { ChartFigure } from '../ui/ChartFigure'
import { ChartLegend } from '../ui/ChartLegend'
import { TaxYearNotice } from '../ui/TaxYearNotice'

interface CompHeroWidgetProps {
  className?: string
  blocked?: boolean
}

const COMP_COLORS = {
  baseSalary: 'var(--chart-1)',
  cashBonus: 'var(--chart-2)',
  espp: 'var(--chart-3)',
  rrsp: 'var(--chart-4)',
  rsu: 'var(--chart-5)',
}

const cad = (v: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(v)

// Module scope, not inside the component: a component created during render is
// a new type on every render, so React remounts the tooltip each time.
const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0);
    return (
      <div className="themed-card rounded-lg p-3" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p className="font-semibold text-[var(--color-text-primary)] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex justify-between items-center gap-4 text-[13px] mb-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-[var(--color-text-secondary)]">{entry.name}</span>
            </div>
            <span className="text-[var(--color-text-primary)] font-medium">
              {cad(entry.value ?? 0)}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center gap-4 text-[13px] mt-2 pt-2 border-t border-[var(--color-border)]">
          <span className="text-[var(--color-text-primary)] font-semibold">Total</span>
          <span className="text-[var(--color-text-primary)] font-bold">
            {cad(total)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function CompHeroWidget({ className = '', blocked = false }: CompHeroWidgetProps) {
  const { timeMode, setTimeMode, showAfterTax, toggleAfterTax } = useCompensationStore()
  const { rawPkg, retirement: { primary: result }, retirementOptions } = useCompensationDisplay()
  const primaryPackage = { ...rawPkg, companyCurrentPrice: rawPkg.companyCurrentPrice * (retirementOptions.fx.cadPerStockUnit ?? 1) }
  const [view, setView] = useState<'annualized' | 'monthly'>('annualized')
  const totalComp = result.totalCompensation ?? result.knownCompensation ?? 0
  const cashRange = (divisor = 1) => blocked || !result.estimate ? 'Needs Review' : retirementRange(result.estimate.branches.map(b => b.cashAfterContributions / divisor))

  if (totalComp === 0 && result.status === 'ready') {
    return (
      <div className={`flex flex-col items-center justify-center h-[320px] themed-card rounded-lg p-6 ${className}`}>
        <p className="text-[18px] font-semibold text-[var(--color-text-primary)]">No Compensation Data Yet</p>
        <p className="text-[14px] text-[var(--color-text-secondary)] mt-2 text-center max-w-sm">
          Enter your compensation details to see the breakdown.
        </p>
      </div>
    )
  }

  const baseValue = result.breakdown.salary
  const bonusValue = result.breakdown.cashBonus
  const esppValue = result.breakdown.esppGain
  const rsuValue = result.breakdown.realizedEquity ?? 0
  const funding = result.scenario?.workplacePlans.map((plan, i) => ({ name: `Employer ${plan.kind === 'rrsp-dpsp' ? 'DPSP' : PLAN_NAMES[plan.kind]} ${i + 1}`, value: plan.employerContribution ?? 0, color: COMP_COLORS.rrsp, key: `funding${i}` })) ?? []

  const pieData = [
    { name: 'Base Salary', value: baseValue, color: COMP_COLORS.baseSalary },
    { name: 'Bonus', value: bonusValue, color: COMP_COLORS.cashBonus },
    { name: 'Equity (RSU)', value: rsuValue, color: COMP_COLORS.rsu },
    { name: 'ESPP Profit', value: esppValue, color: COMP_COLORS.espp },
    ...funding,
  ].filter(d => d.value > 0)

  const today = new Date();
  const targetYear = today.getFullYear();
  const currentMonth = today.getMonth();

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

  const monthlyData = displayMonths.map((dm) => {
    let rsuThisMonth = 0
    primaryPackage.rsuGrants.forEach(grant => {
      const events = generateVestEvents(grant, primaryPackage.companyCurrentPrice || 0)
      const eventsThisMonth = events.filter((e: VestEvent) => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        return eventDate.getMonth() === dm.monthIndex && eventDate.getFullYear() === dm.year;
      })
      rsuThisMonth += eventsThisMonth.reduce((sum, e) => sum + e.vestValue, 0)
    })

    return {
      month: dm.label,
      baseSalary: timeMode === 'current-year' ? getBaseSalaryForMonth(primaryPackage, dm.year, dm.monthIndex) / 12 : primaryPackage.baseSalary / 12,
      bonus: dm.monthIndex === ((primaryPackage.cashBonusMonth || 12) - 1) ? bonusValue : 0,
      espp: esppValue / 12,
      ...Object.fromEntries(funding.map(f => [f.key, f.value / 12])),
      rsu: rsuThisMonth,
    }
  })

  // The monthly view's legend used to show pieData's annual totals next to a
  // chart of monthly bars, so a bar for one month of pay sat under a figure
  // for a year of it. Averaging the same monthlyData the bars draw from
  // (rather than dividing the annual figure by 12) keeps the two from
  // drifting apart, and it is the only option that stays honest for bonus
  // and RSU, which land unevenly across months rather than splitting evenly.
  const monthlyBarKeyByName: Record<string, keyof (typeof monthlyData)[number]> = {
    'Base Salary': 'baseSalary',
    'Bonus': 'bonus',
    'Equity (RSU)': 'rsu',
    'ESPP Profit': 'espp',
  }
  const avgMonthlyValue = (name: string) => {
    const destination = funding.find(f => f.name === name)
    if (destination) return destination.value / 12
    const key = monthlyBarKeyByName[name]
    if (!key || monthlyData.length === 0) return 0
    const total = monthlyData.reduce((sum, m) => sum + (m[key] as number), 0)
    return total / monthlyData.length
  }
  const monthlyLegendItems = pieData.map((d) => ({
    name: d.name,
    color: d.color,
    value: cad(avgMonthlyValue(d.name)),
  }))

  return (
    <div className={`themed-card rounded-lg p-4 flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        {/* h2, not h3: this card sits directly under the page h1 with no h2
            between them, and the jump made the document outline unusable from
            a screen reader's heading list. The size is unchanged. */}
        <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Total Compensation</h2>
        {/* Three segmented groups totalling 430px. Without flex-wrap the
            Gross/After-Tax group starts past the right edge of a 375px
            screen and is clipped by main's overflow-x-hidden, which made
            the after-tax view unreachable on a phone. */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Time Mode Toggle */}
          <div className="flex bg-[var(--color-bg-primary)] rounded-md border border-[var(--color-border)] p-1">
            <button
              onClick={() => setTimeMode('current-year')}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${timeMode === 'current-year' ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              Current Year
            </button>
            <button
              onClick={() => setTimeMode('next-1-year')}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${timeMode === 'next-1-year' ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              Next 1 Year
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-[var(--color-bg-primary)] rounded-md border border-[var(--color-border)] p-1">
            <button
              onClick={() => setView('annualized')}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${view === 'annualized' ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              Annualized Breakdown
            </button>
            <button
              onClick={() => setView('monthly')}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${view === 'monthly' ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              Monthly Cash Flow View
            </button>
          </div>

          {/* Gross / After-Tax Toggle */}
          <div className="flex bg-[var(--color-bg-primary)] rounded-md border border-[var(--color-border)] p-1">
            <button
              onClick={() => showAfterTax && toggleAfterTax()}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${!showAfterTax ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              Gross
            </button>
            <button
              onClick={() => !showAfterTax && toggleAfterTax()}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${showAfterTax ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              After-Tax
            </button>
          </div>
        </div>
      </div>

      {!blocked && result.status === 'ready' && (view === 'annualized' ? (
        <div className="flex flex-col desktop:flex-row desktop:items-center gap-4">
          <ChartFigure
            label={`Total annual compensation ${cad(totalComp)}, split as ${pieData
              .map((d) => `${d.name} ${cad(d.value)}`)
              .join(', ')}`}
            className="relative w-full desktop:w-1/2 h-[240px] desktop:h-[320px]"
          >
            {/* Percentage radii, not the old fixed 110/135: a fixed ring
                is wider than a 320px phone's chart surface, so it was
                clipped. Outside labels are gone for the same reason, they
                were positioned beyond the surface and ran off-screen at
                every width under about 1000px. The legend below carries
                the same information at every width. */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer={false}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="80%"
                  paddingAngle={3}
                  dataKey="value"
                  rootTabIndex={-1}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [cad(Number(value) || 0), String(name)]}
                  {...chartTooltipStyles}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span data-key-figure className="text-[24px] font-semibold text-[var(--color-text-primary)]">
                {showAfterTax ? cashRange() : cad(totalComp)}
              </span>
              <span className="text-[12px] text-[var(--color-text-secondary)]">
                {showAfterTax ? 'Cash After Contributions' : result.totalCompensation === null ? 'Known Annual Compensation' : 'Total Annual Compensation'}
              </span>
            </div>
          </ChartFigure>

          <ul className="flex flex-col gap-1.5 text-[13px] desktop:w-1/2">
            {pieData.map((entry) => (
              <li key={entry.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} aria-hidden="true" />
                <span className="text-text-secondary min-w-0 flex-1 break-words">{entry.name}</span>
                <span className="text-text-primary font-medium tabular-nums">{cad(entry.value)}</span>
                <span className="text-text-secondary tabular-nums w-12 text-right">
                  {totalComp > 0 ? `${Math.round((entry.value / totalComp) * 100)}%` : '0%'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <ChartFigure
            label={`Monthly compensation breakdown for ${monthlyData.length} months from ${monthlyData[0]?.month ?? ''} to ${monthlyData[monthlyData.length - 1]?.month ?? ''}, split into base salary, bonus, ESPP, RRSP and RSU`}
            className="relative w-full h-[280px] desktop:h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} accessibilityLayer={false}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'var(--color-border)' }}
                />
                <Bar dataKey="baseSalary" stackId="a" fill={COMP_COLORS.baseSalary} name="Base Salary" />
                <Bar dataKey="bonus" stackId="a" fill={COMP_COLORS.cashBonus} name="Bonus" />
                <Bar dataKey="espp" stackId="a" fill={COMP_COLORS.espp} name="ESPP Profit" />
                {funding.map(f => <Bar key={f.key} dataKey={f.key} stackId="a" fill={f.color} name={f.name} />)}
                <Bar dataKey="rsu" stackId="a" fill={COMP_COLORS.rsu} name="RSU" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFigure>
          <ChartLegend items={monthlyLegendItems} />
        </>
      ))}

      {view === 'monthly' && showAfterTax && (
        <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
          Monthly bars are shown gross. Withholding varies too much month to month to estimate
          honestly; after-tax figures below are annual estimates.
        </p>
      )}

      {result.employerFunding === null && result.estimate && <p>Employer Pension Funding Unknown. Pension Value Not Estimated.</p>}
      {result.status !== 'ready' && <p role="alert">{result.status === 'conversion-needed' ? 'Conversion Needed. CAD salary and bonus remain known; combined results are unavailable.' : 'Benefits Need Review. Complete the workplace terms before using precise results.'}</p>}
      {result.status !== 'ready' && (
        <dl>
          <dt>Salary (CAD)</dt><dd>{blocked ? 'Needs Review' : cad(baseValue)}</dd>
          <dt>Bonus (CAD)</dt><dd>{blocked ? 'Needs Review' : cad(bonusValue)}</dd>
          <dt>RSU Vest Value (USD)</dt><dd>{blocked ? 'Needs Review' : cad(result.breakdown.rsuNative)}</dd>
        </dl>
      )}
      {result.estimate && <p className="mt-3 text-[13px] text-[var(--color-text-secondary)]">Employee Cash Outflow: {blocked ? 'Needs Review' : cad(result.estimate.employeeCashOutflow ?? 0)}</p>}
      {view === 'monthly' && <p className="text-[12px] text-[var(--color-text-secondary)]">Employer retirement funding is an annual average, separate from employee cash outflow.</p>}
      {showAfterTax && <div className="mt-4 flex flex-col gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
          <div><p>Cash Monthly (Annual Average)</p><strong>{cashRange(12)}</strong></div>
          <div><p>Cash Biweekly (Annual Average)</p><strong>{cashRange(26)}</strong></div>
        </div>
        <TaxYearNotice />
        {result.estimate?.status === 'uncertain' && <p>Earnings Treatment Needed. All {result.estimate.branches.length} earnings combinations are included in ranges.</p>}
        {result.assumptions.map((assumption, i) => <p key={i} className="text-[12px] text-[var(--color-text-secondary)]">{assumption}</p>)}
        <button type="button" disabled className="self-start flex items-center gap-1 text-[13px] text-[var(--color-text-secondary)]"><ExternalLink size={14} />Full breakdown in Salary &amp; Tax</button>
        <p className="text-[12px] text-[var(--color-text-secondary)]">Full breakdown transfer needs review.</p>
      </div>}
    </div>
  )
}
