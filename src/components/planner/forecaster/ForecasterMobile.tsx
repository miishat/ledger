import React, { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import { useAccountsStore } from '../../../store/useAccountsStore'
import { probabilityOfSuccess, runMonteCarlo } from '../../../utils/finance/monteCarlo'
import { monthsToReach } from '../../../utils/finance/fire'
import { NumberInput } from '../../ui/NumberInput'
import { Sheet } from '../../ui/Sheet'
import { InfoButton } from '../../ui/InfoButton'
import { formatMoney } from '../format'
import { ForecastChart } from './ForecastChart'
import { ListEditor } from './ListEditor'
import { MonteCarloSection } from './MonteCarloSection'
import { buildForecastModel, formatMonthsOut, type ForecasterData } from './forecastModel'
import type { Goal, LifeEvent } from './useForecasterSettings'

const YEAR_PRESETS = [10, 20, 30, 40]
const TABS = ['Forecast', 'FIRE', 'Risk', 'Plan'] as const
type Tab = (typeof TABS)[number]

const lab = 'text-[13px] font-medium text-text-secondary'
const box = 'flex items-center gap-2 bg-bg-primary/50 border border-border rounded-xl px-3 min-h-12 focus-within:border-accent'
const chip = (on: boolean) => `min-h-11 rounded-xl border px-3 text-[13px] font-medium ${on ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary'}`

interface FieldProps { id: string; label: string; prefix?: string; suffix?: string; value: number; onChange: (v: number) => void; min?: number; max?: number }
const Field: React.FC<FieldProps> = (f) => (
  <div className="flex flex-col gap-1 min-w-0">
    <label htmlFor={f.id} className={lab}>{f.label}</label>
    <div className={box}>
      {f.prefix && <span className="text-[14px] text-text-secondary shrink-0">{f.prefix}</span>}
      <NumberInput id={f.id} className="w-full min-w-0 bg-transparent text-text-primary text-[16px] font-medium" value={f.value} min={f.min ?? 0} max={f.max} onCommit={f.onChange} />
      {f.suffix && <span className="text-[14px] text-text-secondary shrink-0">{f.suffix}</span>}
    </div>
  </div>
)

const Fold: React.FC<{ title: string; summary: string; children: React.ReactNode }> = ({ title, summary, children }) => (
  <details className="themed-card rounded-2xl">
    <summary className="list-none cursor-pointer min-h-12 px-4 flex items-center justify-between gap-3">
      <span className="text-[15px] font-semibold">{title}</span>
      <span className="text-[13px] text-text-secondary text-right">{summary}</span>
    </summary>
    <div className="px-4 pb-4 flex flex-col gap-3">{children}</div>
  </details>
)

const Hero: React.FC<{ label: string; value: string; info?: React.ReactNode }> = ({ label, value, info }) => (
  <div className="rounded-2xl border border-accent/50 bg-accent/10 p-4" role="status" aria-live="polite">
    <div className="flex items-center gap-1">
      <p className="text-[13px] text-text-secondary">{label}</p>
      {info ? <span className="-my-3">{info}</span> : null}
    </div>
    <p className="text-[28px] font-semibold text-accent leading-tight">{value}</p>
  </div>
)

/** Phone layout of the Net Worth / FIRE Forecaster: four tabs (Forecast, FIRE, Risk, Plan),
 *  each under its own headline figure. The Forecast tab keeps the essentials in view and
 *  folds the rest of the assumptions away. */
export const ForecasterMobile: React.FC<{ data: ForecasterData }> = ({ data }) => {
  const { settings, setSetting, events, saveEvents, goals, saveGoals, autoFeed, resolved, compTax } = data
  const history = useAccountsStore((s) => s.history)
  const gearRef = useRef<HTMLButtonElement>(null)
  const [taxOpen, setTaxOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('Forecast')

  const startBalance = resolved.startBalance
  const model = startBalance === null ? null : buildForecastModel(data, startBalance)
  const stdDev = settings.mcStdDevPct as number
  const chance = useMemo(() => {
    if (!model || startBalance === null) return 0
    const { finalBalances } = runMonteCarlo({
      startBalance, monthlySavings: resolved.monthlySavings, years: settings.years,
      meanReturnPct: settings.annualReturnPct, stdDevPct: stdDev,
      contributionStepUpPct: settings.stepUpPct, lumpSums: model.lumps,
    })
    return Math.round(probabilityOfSuccess(finalBalances, model.fi) * 100)
  }, [model, startBalance, resolved.monthlySavings, settings.years, settings.annualReturnPct, stdDev, settings.stepUpPct])

  if (startBalance === null || !model) {
    return <p className="text-sm text-text-secondary">Conversion Needed to calculate a forecast from dashboard net worth. <Link to="/" className="text-accent underline">Review accounts</Link></p>
  }
  const { lumps, points, fi, fiMonth, coast, goalMarkers } = model
  const finalPoint = points[points.length - 1]
  const finalValue = settings.showReal ? (finalPoint?.real ?? 0) : (finalPoint?.base ?? 0)

  const startFields = (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1 min-w-0">
        <span className={lab}>Starting Balance</span>
        {settings.autoStart
          ? <div className={box}><span className="text-[16px] font-medium tabular-nums">{formatMoney(startBalance)}</span></div>
          : <Field id="fc-start" label="" prefix="$" value={settings.manualStart as number} onChange={(x) => setSetting('manualStart', x)} />}
        <button aria-pressed={!!settings.autoStart} className={chip(!!settings.autoStart)} onClick={() => setSetting('autoStart', !settings.autoStart)}>{settings.autoStart ? 'Dashboard Net Worth' : 'Manual'}</button>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className={lab}>Monthly Savings</span>
        {settings.autoSavings
          ? <div className={box}><span className="text-[16px] font-medium tabular-nums">{formatMoney(resolved.monthlySavings)}</span></div>
          : <Field id="fc-save" label="" prefix="$" value={settings.manualSavings as number} onChange={(x) => setSetting('manualSavings', x)} />}
        <button aria-pressed={!!settings.autoSavings} className={chip(!!settings.autoSavings)} onClick={() => setSetting('autoSavings', !settings.autoSavings)}>{settings.autoSavings ? 'Budget Average' : 'Manual'}</button>
      </div>
    </div>
  )

  const chipsRow = (
    <>
      <div className="flex gap-2">
        <button aria-pressed={!!settings.autoComp} className={`flex-1 ${chip(!!settings.autoComp)}`} onClick={() => setSetting('autoComp', !settings.autoComp)}>Comp Events{settings.autoComp ? ` (${autoFeed.compLumps.length})` : ''}</button>
        <button aria-pressed={!!settings.includeDebtDrag} className={`flex-1 ${chip(!!settings.includeDebtDrag)}`} onClick={() => setSetting('includeDebtDrag', !settings.includeDebtDrag)}>Debt Drag{autoFeed.debtDrag ? ` (${formatMoney(autoFeed.debtDrag.amount)}/mo)` : ''}</button>
        <button ref={gearRef} aria-label="Comp event tax settings" className={`w-11 flex items-center justify-center ${chip(!!settings.compTaxEnabled)}`} onClick={() => setTaxOpen(true)}><Settings2 size={16} /></button>
      </div>
      <Sheet open={taxOpen} onClose={() => setTaxOpen(false)} desktop="popover" anchorRef={gearRef} ariaLabel="Comp event tax settings" contentClassName="flex flex-col gap-2">
        <button aria-pressed={!!settings.compTaxEnabled} className={chip(!!settings.compTaxEnabled)} onClick={() => setSetting('compTaxEnabled', !settings.compTaxEnabled)}>Tax Comp Events</button>
        {settings.compTaxEnabled ? <button className={chip(!!settings.compTaxAuto)} onClick={() => setSetting('compTaxAuto', !settings.compTaxAuto)}>{settings.compTaxAuto ? `Marginal ${compTax.ratePct.toFixed(0)}% (${compTax.province})` : 'Manual Rate'}</button> : null}
        {settings.compTaxEnabled && !settings.compTaxAuto ? <Field id="fc-taxrate" label="Manual Rate" suffix="%" value={settings.compTaxManualPct as number} onChange={(x) => setSetting('compTaxManualPct', x)} /> : null}
      </Sheet>
    </>
  )

  const forecastTab = (
    <>
      <Hero label={`Projected Net Worth in ${settings.years} Years${settings.showReal ? " (Today's Dollars)" : ''}`} value={formatMoney(finalValue)} />
      <div role="group" aria-label="Years presets" className="flex bg-bg-secondary border border-border rounded-xl p-1">
        {YEAR_PRESETS.map((y) => (
          <button key={y} aria-pressed={settings.years === y} onClick={() => setSetting('years', y)} className={`flex-1 min-h-[44px] rounded-lg text-[13px] font-medium ${settings.years === y ? 'bg-bg-primary text-accent' : 'text-text-secondary'}`}>{y} yrs</button>
        ))}
      </div>
      {startFields}
      <div className="grid grid-cols-2 gap-3">
        <Field id="fc-return" label="Return" suffix="%" value={settings.annualReturnPct} onChange={(x) => setSetting('annualReturnPct', x)} />
        <Field id="fc-years" label="Years" suffix="yrs" min={1} max={50} value={settings.years} onChange={(x) => setSetting('years', x)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button aria-pressed={!!settings.showReal} className={chip(!!settings.showReal)} onClick={() => setSetting('showReal', !settings.showReal)}>{settings.showReal ? "Real (Today's $)" : 'Nominal'}</button>
        <button className={chip(false)} onClick={() => setSetting('view', settings.view === 'line' ? 'stacked' : 'line')}>{settings.view === 'line' ? 'Contributions vs Growth' : 'Scenario Bands'}</button>
      </div>
      <ForecastChart centered points={points} history={history} showReal={settings.showReal as boolean} view={settings.view as 'line' | 'stacked'} goalMarkers={goalMarkers} />
      <Fold title="More Assumptions" summary="Inflation, Step-Up, Spread, Events">
        <Field id="fc-infl" label="Inflation" suffix="%" value={settings.inflationPct} onChange={(x) => setSetting('inflationPct', x)} />
        <div className="grid grid-cols-2 gap-3">
          <Field id="fc-stepup" label="Contribution Step-Up" suffix="%/yr" value={settings.stepUpPct} onChange={(x) => setSetting('stepUpPct', x)} />
          <Field id="fc-spread" label="Scenario Spread" suffix="± %" value={settings.spreadPct} onChange={(x) => setSetting('spreadPct', x)} />
        </div>
        {chipsRow}
      </Fold>
    </>
  )

  const fireTab = (
    <>
      <Hero label="Financially Independent" value={formatMonthsOut(fiMonth)} />
      <div className="grid grid-cols-2 gap-3">
        <Field id="fc-spend" label="Annual Spending" prefix="$" value={settings.annualSpending} onChange={(x) => setSetting('annualSpending', x)} />
        <Field id="fc-wr" label="Withdrawal Rate" suffix="%" value={settings.withdrawalRatePct} onChange={(x) => setSetting('withdrawalRatePct', x)} />
      </div>
      <div className="rounded-2xl border border-border bg-bg-secondary grid grid-cols-2 divide-x divide-border">
        <div className="p-3 min-w-0"><p className="text-[12px] text-text-secondary">FI Number</p><p className="text-[16px] font-semibold tabular-nums break-words">{formatMoney(fi)}</p></div>
        <div className="p-3 min-w-0"><p className="text-[12px] text-text-secondary">Projected FI Date</p><p className="text-[16px] font-semibold break-words">{formatMonthsOut(fiMonth)}</p></div>
      </div>
      <div className="rounded-2xl border border-border bg-bg-secondary p-3">
        <p className="text-[12px] text-text-secondary">Coast-FI (Needed Today to Coast for {settings.years}y)</p>
        <p className="text-[16px] font-semibold tabular-nums">{formatMoney(coast)} <span className="text-[13px] font-normal text-text-secondary">you have {formatMoney(startBalance)} ({startBalance >= coast ? 'coasting' : 'not yet'})</span></p>
      </div>
    </>
  )

  const riskTab = (
    <>
      <Hero
        label={`Chance of Reaching ${formatMoney(fi)}`}
        value={`${chance}%`}
      />
      <MonteCarloSection
        phone
        startBalance={startBalance} monthlySavings={resolved.monthlySavings} years={settings.years}
        meanReturnPct={settings.annualReturnPct} stdDevPct={stdDev} stepUpPct={settings.stepUpPct}
        lumpSums={lumps} target={fi} onStdDevChange={(x) => setSetting('mcStdDevPct', x)}
        medianInfo={(
          <InfoButton inline label="About This Simulation">
            <p>500 seeded simulations of market returns.</p>
            <p>The shaded band spans the 10th to 90th percentile outcomes. The line is the median.</p>
          </InfoButton>
        )}
      />
    </>
  )

  const planTab = (
    <>
      <Hero label="Goals and Life Events" value={`${goals.length} goals, ${events.length} events`} />
      <ListEditor<Goal>
        title="Goals (Net-Worth Targets)"
        items={goals}
        columns={[{ key: 'label', label: 'Goal', type: 'text' }, { key: 'amount', label: 'Amount ($)', type: 'number', step: 1000 }]}
        makeNew={() => ({ id: `g${Date.now()}`, label: 'New goal', amount: 100000 })}
        onChange={saveGoals}
        renderExtra={(g) => (<><span className={lab}>Projected</span><span className="text-[15px] text-text-primary py-2">{formatMonthsOut(monthsToReach(points, g.amount))}</span></>)}
      />
      <ListEditor<LifeEvent>
        title="Life Events (Negative = Cost, Positive = Windfall)"
        items={events}
        columns={[{ key: 'label', label: 'Event', type: 'text' }, { key: 'yearsFromNow', label: 'Years From Now', type: 'number', step: 0.5 }, { key: 'amount', label: 'Amount ($)', type: 'number', step: 1000 }]}
        makeNew={() => ({ id: `e${Date.now()}`, label: 'House down payment', yearsFromNow: 3, amount: -100000 })}
        onChange={saveEvents}
        renderExtra={(e) => (<><span className={lab}>Lands</span><span className="text-[15px] text-text-primary py-2">{formatMonthsOut(Math.max(1, Math.round(e.yearsFromNow * 12)))}</span></>)}
      />
    </>
  )

  return (
    <div data-testid="forecaster-mobile" className="flex flex-col gap-4">
      <div role="group" aria-label="Sections" className="grid grid-cols-4 gap-1 bg-bg-secondary border border-border rounded-xl p-1">
        {TABS.map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={`min-h-[44px] rounded-lg text-[13px] font-medium px-1 ${tab === t ? 'bg-bg-primary text-accent' : 'text-text-secondary'}`}>{t}</button>
        ))}
      </div>
      {tab === 'Forecast' && forecastTab}
      {tab === 'FIRE' && fireTab}
      {tab === 'Risk' && riskTab}
      {tab === 'Plan' && planTab}
    </div>
  )
}
