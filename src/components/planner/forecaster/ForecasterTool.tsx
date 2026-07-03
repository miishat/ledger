import React from 'react'
import { useAccountsStore } from '../../../store/useAccountsStore'
import { buildForecast, type LumpSum } from '../../../utils/finance/forecast'
import { coastFiNumber, fiNumber, monthsToReach } from '../../../utils/finance/fire'
import { CalculatorField } from '../CalculatorField'
import { ResultCard } from '../ResultCard'
import { formatMoney } from '../format'
import { ForecastChart } from './ForecastChart'
import { ListEditor } from './ListEditor'
import { MonteCarloSection } from './MonteCarloSection'
import { useForecasterSettings, type Goal, type LifeEvent } from './useForecasterSettings'

function formatMonthsOut(m: number | null): string {
  if (m === null) return 'Beyond horizon'
  if (m === 0) return 'Reached'
  const d = new Date()
  d.setMonth(d.getMonth() + m)
  return `${d.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' })} (${Math.floor(m / 12)}y ${m % 12}m)`
}

/** Toggle between an auto-fed value and a manual field. */
const AutoField: React.FC<{
  label: string
  auto: boolean
  autoValue: number
  autoHint: string
  manualValue: number
  onToggle: (auto: boolean) => void
  onManual: (v: number) => void
}> = ({ label, auto, autoValue, autoHint, manualValue, onToggle, onManual }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-medium text-text-secondary">{label}</span>
      <button
        onClick={() => onToggle(!auto)}
        className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
          auto ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary'
        }`}
      >
        {auto ? `auto: ${autoHint}` : 'manual'}
      </button>
    </div>
    {auto ? (
      <div className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[15px]">
        {formatMoney(autoValue)}
      </div>
    ) : (
      <CalculatorField label="" value={manualValue} onChange={onManual} step={100} prefix="$" />
    )}
  </div>
)

export const ForecasterTool: React.FC = () => {
  const { settings, setSetting, events, saveEvents, goals, saveGoals, autoFeed, resolved } = useForecasterSettings()
  const history = useAccountsStore((s) => s.history)

  const eventLumps: LumpSum[] = events.map((e) => ({
    month: Math.max(1, Math.round(e.yearsFromNow * 12)),
    amount: e.amount,
    label: e.label,
  }))
  const lumps = [...autoFeed.compLumps, ...eventLumps]

  const points = buildForecast({
    startBalance: resolved.startBalance,
    monthlySavings: resolved.monthlySavings,
    annualReturnPct: settings.annualReturnPct,
    annualInflationPct: settings.inflationPct,
    contributionStepUpPct: settings.stepUpPct,
    years: settings.years,
    lumpSums: lumps,
    scenarioSpreadPct: settings.spreadPct,
    monthlyDrag: autoFeed.debtDrag ?? undefined,
  })

  const fi = fiNumber(settings.annualSpending, settings.withdrawalRatePct)
  const fiMonth = monthsToReach(points, fi)
  const coast = coastFiNumber(fi, settings.annualReturnPct, settings.years)
  const goalMarkers = goals.map((g) => ({ label: g.label, month: monthsToReach(points, g.amount), amount: g.amount }))

  return (
    <div className="flex flex-col gap-6">
      {/* Auto-fed inputs with manual overrides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AutoField
          label="Starting balance"
          auto={settings.autoStart as boolean}
          autoValue={autoFeed.startBalance}
          autoHint="Dashboard net worth"
          manualValue={settings.manualStart}
          onToggle={(v) => setSetting('autoStart', v)}
          onManual={(v) => setSetting('manualStart', v)}
        />
        <AutoField
          label="Monthly savings"
          auto={settings.autoSavings as boolean}
          autoValue={resolved.monthlySavings}
          autoHint="Budget avg (3mo)"
          manualValue={settings.manualSavings}
          onToggle={(v) => setSetting('autoSavings', v)}
          onManual={(v) => setSetting('manualSavings', v)}
        />
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-text-secondary">Comp events / debt drag</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSetting('autoComp', !settings.autoComp)}
              className={`flex-1 text-[12px] px-2 py-2 rounded-lg border transition-colors ${
                settings.autoComp ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary'
              }`}
            >
              {settings.autoComp ? `${autoFeed.compLumps.length} comp events on` : 'comp events off'}
            </button>
            <button
              onClick={() => setSetting('includeDebtDrag', !settings.includeDebtDrag)}
              className={`flex-1 text-[12px] px-2 py-2 rounded-lg border transition-colors ${
                settings.includeDebtDrag ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary'
              }`}
            >
              {autoFeed.debtDrag ? `debt drag ${formatMoney(autoFeed.debtDrag.amount)}/mo` : 'debt drag off'}
            </button>
          </div>
        </div>
      </div>

      {/* What-if sliders */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <CalculatorField label="Years" min={1} max={50} value={settings.years} onChange={(v) => setSetting('years', v)} />
        <CalculatorField label="Return" suffix="%" step={0.1} value={settings.annualReturnPct} onChange={(v) => setSetting('annualReturnPct', v)} />
        <CalculatorField label="Inflation" suffix="%" step={0.1} value={settings.inflationPct} onChange={(v) => setSetting('inflationPct', v)} />
        <CalculatorField label="Contribution step-up" suffix="%/yr" step={0.5} value={settings.stepUpPct} onChange={(v) => setSetting('stepUpPct', v)} />
        <CalculatorField label="Scenario spread" suffix="±%" step={0.5} value={settings.spreadPct} onChange={(v) => setSetting('spreadPct', v)} />
      </div>

      {/* View toggles */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSetting('showReal', !settings.showReal)}
          className={`px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
            settings.showReal ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-secondary'
          }`}
        >
          {settings.showReal ? "Real (today's dollars)" : 'Nominal'}
        </button>
        <button
          onClick={() => setSetting('view', settings.view === 'line' ? 'stacked' : 'line')}
          className="px-3 py-1.5 rounded-md text-[13px] font-medium border border-border text-text-secondary hover:text-text-primary transition-colors"
        >
          {settings.view === 'line' ? 'Show contributions vs growth' : 'Show scenario bands'}
        </button>
      </div>

      <ForecastChart
        points={points}
        history={history}
        showReal={settings.showReal as boolean}
        view={settings.view as 'line' | 'stacked'}
        goalMarkers={goalMarkers}
      />

      {/* FIRE engine */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CalculatorField label="Annual spending in retirement" prefix="$" step={1000} value={settings.annualSpending} onChange={(v) => setSetting('annualSpending', v)} />
        <CalculatorField label="Withdrawal rate" suffix="%" step={0.1} value={settings.withdrawalRatePct} onChange={(v) => setSetting('withdrawalRatePct', v)} />
        <ResultCard label="FI number" value={formatMoney(fi)} highlight />
        <ResultCard label="Projected FI date" value={formatMonthsOut(fiMonth)} />
      </div>
      <ResultCard
        label={`Coast-FI (needed today to coast for ${settings.years}y)`}
        value={`${formatMoney(coast)} — you have ${formatMoney(resolved.startBalance)} (${resolved.startBalance >= coast ? 'coasting ✓' : 'not yet'})`}
      />

      {/* Goals + life events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <ListEditor<Goal>
            title="Goals (net-worth targets)"
            items={goals}
            columns={[
              { key: 'label', label: 'Goal', type: 'text' },
              { key: 'amount', label: 'Amount ($)', type: 'number', step: 1000 },
            ]}
            makeNew={() => ({ id: `g${Date.now()}`, label: 'New goal', amount: 100000 })}
            onChange={saveGoals}
          />
          {goalMarkers.map((g) => (
            <p key={g.label} className="text-[13px] text-text-secondary">
              {g.label} ({formatMoney(g.amount)}): <span className="text-text-primary">{formatMonthsOut(g.month)}</span>
            </p>
          ))}
        </div>
        <ListEditor<LifeEvent>
          title="Life events (negative = cost, positive = windfall)"
          items={events}
          columns={[
            { key: 'label', label: 'Event', type: 'text' },
            { key: 'yearsFromNow', label: 'Years from now', type: 'number', step: 0.5 },
            { key: 'amount', label: 'Amount ($)', type: 'number', step: 1000 },
          ]}
          makeNew={() => ({ id: `e${Date.now()}`, label: 'House down payment', yearsFromNow: 3, amount: -100000 })}
          onChange={saveEvents}
        />
      </div>

      <MonteCarloSection
        startBalance={resolved.startBalance}
        monthlySavings={resolved.monthlySavings}
        years={settings.years}
        meanReturnPct={settings.annualReturnPct}
        stdDevPct={settings.mcStdDevPct}
        stepUpPct={settings.stepUpPct}
        lumpSums={lumps}
        target={fi}
        onStdDevChange={(v) => setSetting('mcStdDevPct', v)}
      />
    </div>
  )
}
