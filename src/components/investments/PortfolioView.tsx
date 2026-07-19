import React, { useCallback, useState } from 'react'
import { Trash2, Landmark } from 'lucide-react'
import { useFxRate } from '../../services/marketData'
import { accountNames, usePortfolioStore } from '../../store/usePortfolioStore'
import { portfolioTotals } from '../../utils/investments/portfolioMetrics'
import { formatMoney } from '../planner/format'
import { HoldingRow } from './HoldingRow'
import { HoldingCard } from './HoldingCard'
import { PortfolioImport } from './PortfolioImport'
import { PortfolioReport } from './PortfolioReport'
import { EmptyState } from '../ui/EmptyState'

export const PortfolioView: React.FC = () => {
  const holdings = usePortfolioStore((s) => s.holdings)
  const importedAt = usePortfolioStore((s) => s.importedAt)
  const clearHoldings = usePortfolioStore((s) => s.clearHoldings)
  const fx = useFxRate('USD', 'CAD')
  const fxUsdCad = fx.data?.value.rate ?? 1

  const [prices, setPrices] = useState<Record<string, number>>({})
  const onPrice = useCallback((id: string, price: number) => {
    setPrices((prev) => (prev[id] === price ? prev : { ...prev, [id]: price }))
  }, [])

  const rows = holdings.map((h) => ({ holding: h, price: prices[h.id] ?? h.avgCost }))
  const totals = portfolioTotals(rows, fxUsdCad)

  return (
    <div className="flex flex-col gap-6">
      <PortfolioImport />

      {holdings.length === 0 ? (
        <div className="themed-card rounded-lg p-10">
          <EmptyState icon={Landmark} message="No holdings yet" hint="Import a broker CSV to see your portfolio with live values." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="themed-card rounded-lg p-4"><p className="text-[12px] uppercase text-text-secondary">Total Invested (CAD)</p><p className="text-[22px] font-semibold text-text-primary">{formatMoney(totals.investedCad)}</p></div>
            <div className="themed-card rounded-lg p-4"><p className="text-[12px] uppercase text-text-secondary">Value Now (CAD)</p><p className="text-[22px] font-semibold text-accent">{formatMoney(totals.valueCad)}</p></div>
            <div className="themed-card rounded-lg p-4"><p className="text-[12px] uppercase text-text-secondary">Total P/L</p><p className={`text-[22px] font-semibold ${totals.plCad >= 0 ? 'text-accent' : 'text-error'}`}>{formatMoney(totals.plCad)}{totals.plPct !== null ? ` (${totals.plPct >= 0 ? '+' : ''}${totals.plPct.toFixed(1)}%)` : ''}</p></div>
          </div>

          {accountNames(holdings).map((account) => {
            const rows = holdings.filter((h) => h.account === account)
            return (
              <div key={account} className="themed-card rounded-lg p-4">
                <h3 className="text-[14px] font-semibold text-text-primary mb-2">
                  {account} <span className="text-text-secondary font-normal">({rows.length})</span>
                </h3>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-[13px] min-w-[720px]">
                    <thead>
                      <tr className="text-left text-text-secondary border-b border-border">
                        <th className="py-2 pr-3 font-medium">Holding</th>
                        <th className="py-2 pr-3 font-medium text-right">Qty</th>
                        <th className="py-2 pr-3 font-medium text-right">Avg Cost</th>
                        <th className="py-2 pr-3 font-medium text-right">Price</th>
                        <th className="py-2 pr-3 font-medium text-right">Book</th>
                        <th className="py-2 pr-3 font-medium text-right">Value</th>
                        <th className="py-2 pr-3 font-medium text-right">P/L</th>
                        <th className="py-2 font-medium text-right">Alloc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((h) => (
                        <HoldingRow key={h.id} holding={h} fxUsdCad={fxUsdCad} totalValueCad={totals.valueCad} onPrice={onPrice} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div data-testid={`portfolio-cards-${account}`} className="md:hidden flex flex-col gap-3">
                  {rows.map((h) => (
                    <HoldingCard key={h.id} holding={h} fxUsdCad={fxUsdCad} totalValueCad={totals.valueCad} onPrice={onPrice} />
                  ))}
                </div>
              </div>
            )
          })}
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-text-secondary">
              Imported {importedAt ? new Date(importedAt).toLocaleString() : 'never'} · USD→CAD {fxUsdCad.toFixed(4)}
              {fx.data ? ` (${fx.data.source}${fx.data.stale ? ', stale' : ''})` : ''}
            </p>
            <button onClick={clearHoldings} className="flex items-center gap-1 text-[12px] text-text-secondary hover:text-error transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Clear portfolio
            </button>
          </div>
        </>
      )}

      <PortfolioReport />
    </div>
  )
}
