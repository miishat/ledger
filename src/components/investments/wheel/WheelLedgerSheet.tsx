import React from 'react'
import { X } from 'lucide-react'
import type { TickerState } from '../../../utils/investments/wheel/types'
import { formatCurr } from '../../../utils/investments/wheel/calculations'
import { Sheet } from '../../ui/Sheet'

interface WheelLedgerSheetProps {
  data: TickerState | null
  onClose: () => void
}

export const WheelLedgerSheet: React.FC<WheelLedgerSheetProps> = ({ data, onClose }) => {
  const sortedHistory = data ? [...data.history].sort((a, b) => a.date.localeCompare(b.date)) : []
  const totalCashFlow = sortedHistory.reduce((s, h) => s + h.proceeds + h.commFee, 0)

  return (
    <Sheet
      open={data !== null}
      onClose={onClose}
      desktop="modal"
      ariaLabel="Detailed ledger"
      panelClassName="themed-menu rounded-lg w-full max-w-3xl p-6 flex flex-col gap-3 max-h-[85dvh]"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-text-primary">{data?.ticker} Detailed Ledger</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-text-secondary hover:text-accent rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-text-secondary border-b border-border">
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 pr-3 font-medium">Instrument</th>
              <th className="py-2 pr-3 font-medium text-right">Qty</th>
              <th className="py-2 pr-3 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Net Cash Flow</th>
            </tr>
          </thead>
          <tbody>
            {sortedHistory.map((h, i) => {
              const cashflow = h.proceeds + h.commFee
              return (
                <tr key={i} className="border-b border-border/50 text-text-primary">
                  <td className="py-2 pr-3 whitespace-nowrap">{h.date}</td>
                  <td className="py-2 pr-3">{h.description}</td>
                  <td className={`py-2 pr-3 text-right ${h.quantity > 0 ? 'text-accent' : h.quantity < 0 ? 'text-error' : ''}`}>{h.quantity}</td>
                  <td className="py-2 pr-3 text-right">{formatCurr(h.price)}</td>
                  <td className={`py-2 text-right ${cashflow > 0 ? 'text-accent' : cashflow < 0 ? 'text-error' : ''}`}>{formatCurr(cashflow)}</td>
                </tr>
              )
            })}
            <tr>
              <td colSpan={4} className="py-2 pr-3 text-right font-semibold text-text-primary">Account Ledger Net Cash Flow:</td>
              <td className={`py-2 text-right font-semibold ${totalCashFlow > 0 ? 'text-accent' : totalCashFlow < 0 ? 'text-error' : 'text-text-primary'}`}>
                {formatCurr(totalCashFlow)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Sheet>
  )
}
