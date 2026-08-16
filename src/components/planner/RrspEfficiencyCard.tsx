import React from 'react'
import { marginalSlices, type MarginalSlice, type Province } from '../../utils/finance/canadaTax'
import { formatMoney } from './format'

const Rung: React.FC<{ slice: MarginalSlice; hot?: boolean }> = ({ slice, hot = false }) => (
  <div
    className={`flex items-center gap-3 rounded-md px-2.5 py-2 border ${
      hot ? 'border-accent/50 bg-accent/10' : 'border-transparent bg-bg-primary/40'
    }`}
  >
    <span className={`text-[13px] font-semibold w-14 shrink-0 ${hot ? 'text-accent' : 'text-text-primary'}`}>
      {slice.rate.toFixed(1)}%
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] text-text-primary">{formatMoney(slice.amount)}</span>
      <span className="block text-[11px] text-text-secondary">
        {/* The top rung is open-ended from the reader's point of view: it is the
            band their last dollar lands in, so name the floor, not the ceiling. */}
        {hot ? `above ${formatMoney(slice.from)}` : `${formatMoney(slice.from)} to ${formatMoney(slice.to)}`}
      </span>
    </span>
    <span className="text-[13px] text-text-primary w-20 text-right shrink-0">
      {formatMoney(slice.taxSaved)}
    </span>
  </div>
)

/** How much income sits in each marginal band, and what an RRSP contribution
 *  that clears the top band is worth. Savings come from the tax functions
 *  themselves, so surtax and credit phase-outs are already accounted for. */
export const RrspEfficiencyCard: React.FC<{
  taxableIncome: number
  province: Province
  room: number
  roomIsEstimate: boolean
}> = ({ taxableIncome, province, room, roomIsEstimate }) => {
  const slices = marginalSlices(taxableIncome, province)
  const top = slices[0]

  if (!top || top.rate <= 0) {
    return (
      <div className="themed-card rounded-lg p-4 flex flex-col gap-2">
        <p className="text-[12px] uppercase tracking-wide text-text-secondary">RRSP Efficiency</p>
        <p className="text-[13px] text-text-secondary">
          {taxableIncome <= 0
            ? 'No taxable income to shelter.'
            : 'You pay no income tax at this income, so an RRSP deduction saves nothing this year.'}
        </p>
      </div>
    )
  }

  const shown = slices.slice(0, 2)
  const rest = slices[2]
  const fits = top.amount <= room
  const usedPct = room > 0 ? Math.min((top.amount / room) * 100, 100) : 0
  const roomLabel = roomIsEstimate
    ? `${formatMoney(room)} estimated remaining room`
    : `${formatMoney(room)} remaining room`

  return (
    <div className="themed-card rounded-lg p-4 flex flex-col gap-3">
      <p className="text-[12px] uppercase tracking-wide text-text-secondary">RRSP Efficiency</p>

      <div className="flex items-baseline gap-2">
        <span className="text-[26px] font-semibold text-accent leading-none">{top.rate.toFixed(1)}%</span>
        <span className="text-[12px] text-text-secondary">saved on your next contributed dollar</span>
      </div>

      <div className="flex flex-col gap-1 mt-1">
        <span className="text-[11px] uppercase tracking-wide text-text-secondary">Income by saving rate</span>
        {shown.map((s, i) => (
          <Rung key={s.from} slice={s} hot={i === 0} />
        ))}
        {rest && (
          <div className="flex items-center gap-3 rounded-md px-2.5 py-2 text-text-secondary">
            <span className="text-[13px] w-14 shrink-0">{rest.rate.toFixed(1)}%</span>
            <span className="flex-1 min-w-0 text-[12px]">
              {formatMoney(rest.to)} and below, the lowest-value dollars to shelter
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-3 flex flex-col gap-1.5">
        <p className="text-[13px] text-text-primary">
          {formatMoney(top.amount)} RRSP clears your top band, saving {formatMoney(top.taxSaved)}
        </p>
        <div className="h-1.5 rounded bg-bg-primary/50 overflow-hidden">
          <div className="h-full rounded bg-accent" style={{ width: `${usedPct}%` }} />
        </div>
        <p className="text-[12px] text-text-secondary">
          {fits
            ? `Uses ${usedPct.toFixed(0)}% of your ${roomLabel}`
            : `Exceeds your room by ${formatMoney(top.amount - room)} (${roomLabel})`}
        </p>
      </div>

      <p className="text-[12px] text-text-secondary">
        Room is estimated from income unless you enter your own. Your CRA notice of assessment is the
        real number. An estimate, not tax advice.
      </p>
    </div>
  )
}
