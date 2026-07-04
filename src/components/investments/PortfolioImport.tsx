import React, { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import {
  mapPortfolioRows, parsePortfolioCSV, type ColumnMapping, type UnrecognizedPortfolioCSV,
} from '../../utils/portfolioCsv'
import { usePortfolioStore, type Holding } from '../../store/usePortfolioStore'

const selectCls =
  'bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[14px] outline-none focus:border-accent'

export const PortfolioImport: React.FC = () => {
  const setHoldings = usePortfolioStore((s) => s.setHoldings)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<UnrecognizedPortfolioCSV | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({ ticker: '', quantity: '', totalCost: '', currency: '' })
  const [message, setMessage] = useState('')

  const stamp = (rows: Omit<Holding, 'id'>[]): Holding[] =>
    rows.map((r, i) => ({ ...r, id: `h-${i}-${Date.now()}` }))

  const onFile = async (file: File) => {
    setMessage('')
    const result = await parsePortfolioCSV(file)
    if ('unrecognized' in result) {
      setPending(result)
      setMapping({ ticker: result.headers[0] ?? '', quantity: '', totalCost: '', currency: '' })
      return
    }
    setHoldings(stamp(result))
    setPending(null)
    setMessage(`Imported ${result.length} holdings.`)
  }

  const applyMapping = () => {
    if (!pending) return
    const rows = mapPortfolioRows(pending.rows, {
      ...mapping,
      currency: mapping.currency || undefined,
    })
    setHoldings(stamp(rows))
    setMessage(`Imported ${rows.length} holdings via column mapping.`)
    setPending(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onFile(f)
          e.target.value = ''
        }}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
        >
          <Upload className="w-4 h-4" /> Import broker CSV
        </button>
        {message && <span className="text-[13px] text-text-secondary">{message}</span>}
      </div>
      <p className="text-[12px] text-text-secondary">
        Interactive Brokers and Wealthsimple exports are detected automatically; anything else opens the column mapper.
        Importing replaces the current portfolio.
      </p>

      {pending && (
        <div className="themed-card rounded-lg p-4 flex flex-col gap-3">
          <p className="text-[13px] text-text-primary font-medium">
            Unrecognized format — map your columns ({pending.rows.length} rows):
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ['ticker', 'Ticker column'],
              ['quantity', 'Quantity column'],
              ['totalCost', 'Total cost column'],
              ['currency', 'Currency column (optional)'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-[13px] text-text-secondary">{label}</span>
                <select
                  className={selectCls}
                  value={mapping[key] ?? ''}
                  onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                >
                  <option value="">—</option>
                  {pending.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyMapping}
              disabled={!mapping.ticker || !mapping.quantity || !mapping.totalCost}
              className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 disabled:opacity-40"
            >
              Import with mapping
            </button>
            <button onClick={() => setPending(null)} className="px-4 py-2 border border-border rounded-md text-[14px] text-text-secondary hover:text-text-primary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
