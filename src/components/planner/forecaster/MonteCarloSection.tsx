import React, { useMemo } from 'react'
import {
  Area, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { probabilityOfSuccess, runMonteCarlo } from '../../../utils/finance/monteCarlo'
import type { LumpSum } from '../../../utils/finance/forecast'
import { CalculatorField } from '../CalculatorField'
import { ResultCard } from '../ResultCard'
import { formatMoney } from '../format'

interface MonteCarloSectionProps {
  startBalance: number
  monthlySavings: number
  years: number
  meanReturnPct: number
  stdDevPct: number
  stepUpPct: number
  lumpSums: LumpSum[]
  target: number
  onStdDevChange: (v: number) => void
}

export const MonteCarloSection: React.FC<MonteCarloSectionProps> = (props) => {
  const { bands, finalBalances } = useMemo(
    () =>
      runMonteCarlo({
        startBalance: props.startBalance,
        monthlySavings: props.monthlySavings,
        years: props.years,
        meanReturnPct: props.meanReturnPct,
        stdDevPct: props.stdDevPct,
        contributionStepUpPct: props.stepUpPct,
        lumpSums: props.lumpSums,
      }),
    [props.startBalance, props.monthlySavings, props.years, props.meanReturnPct, props.stdDevPct, props.stepUpPct, props.lumpSums],
  )
  const success = probabilityOfSuccess(finalBalances, props.target)
  // Stacked-fan encoding: base (transparent) + widths between percentiles.
  const data = bands.map((b) => ({
    year: b.year,
    p10: Math.round(b.p10),
    w1090: Math.round(b.p90 - b.p10),
    p50: Math.round(b.p50),
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
        <CalculatorField label="Volatility (std dev)" suffix="%" step={1} value={props.stdDevPct} onChange={props.onStdDevChange} />
        <ResultCard label={`Chance of reaching ${formatMoney(props.target)}`} value={`${Math.round(success * 100)}%`} highlight />
        <ResultCard label="Median outcome" value={formatMoney(bands[bands.length - 1]?.p50 ?? 0)} />
      </div>
      <div className="themed-card rounded-lg p-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <YAxis width={72} tickFormatter={(v: number) => formatMoney(v)} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [formatMoney(Number(value)), String(name) === 'w1090' ? 'P10–P90 width' : String(name).toUpperCase()]}
              contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            <Area type="monotone" dataKey="p10" stackId="fan" stroke="none" fill="transparent" name="p10" />
            <Area type="monotone" dataKey="w1090" stackId="fan" stroke="none" fill="var(--accent)" fillOpacity={0.18} name="w1090" />
            <Line type="monotone" dataKey="p50" stroke="var(--accent)" strokeWidth={2} dot={false} name="p50" />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-[12px] text-text-secondary mt-2">
          500 seeded simulations — shaded band spans the 10th to 90th percentile.
        </p>
      </div>
    </div>
  )
}
