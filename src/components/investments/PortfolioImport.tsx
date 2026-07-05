import React, { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import {
  mapPortfolioRows, parsePortfolioCSV, type ColumnMapping, type UnrecognizedPortfolioCSV,
} from '../../utils/portfolioCsv'
import {
  DEFAULT_ACCOUNT, usePortfolioStore, type Holding, type ImportMode,
} from '../../store/usePortfolioStore'
import { ThemedSelect } from '../ui/ThemedSelect'

const selectCls =
  'bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[14px] outline-none focus:border-accent'

const MODE_LABELS: Record<ImportMode, string> = {
  replace: 'Replace this account',
  update: 'Update (merge by ticker)',
  add: 'Add as new rows',
}

export const PortfolioImport: React.FC = () => {
  const importHoldings = usePortfolioStore((s) => s.importHoldings)
  const fileRef = useRef<HTMLInputElement>(null)
  const [account, setAccount] = useState(DEFAULT_ACCOUNT)
  const [mode, setMode] = useState<ImportMode>('replace')
  const [pending, setPending] = useState<UnrecognizedPortfolioCSV | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({ ticker: '', quantity: '', totalCost: '', currency: '' })
  const [message, setMessage] = useState('')

  const doImport = (rows: Omit<Holding, 'id' | 'account'>[], via: string) => {
    const acct = account.trim() || DEFAULT_ACCOUNT
    importHoldings(acct, mode, rows)
    setMessage(`Imported ${rows.length} holdings into "${acct}" (${MODE_LABELS[mode].toLowerCase()})${via}.`)
    setPending(null)
  }

  const onFile = async (file: File) => {
    setMessage('')
    const result = await parsePortfolioCSV(file)
    if ('unrecognized' in result) {
      setPending(result)
      setMapping({ ticker: result.headers[0] ?? '', quantity: '', totalCost: '', currency: '' })
      return
    }
    doImport(result, '')
  }

  const applyMapping = () => {
    if (!pending) return
    const rows = mapPortfolioRows(pending.rows, {
      ...mapping,
      currency: mapping.currency || undefined,
    })
    doImport(rows, ' via column mapping')
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
      <div className="flex items-end gap-3 flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-text-secondary">Account</span>
          <input
            className={selectCls}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="e.g. IBKR margin"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-text-secondary">Import mode</span>
          <ThemedSelect
            value={mode}
            onChange={(v) => setMode(v as ImportMode)}
            options={(Object.keys(MODE_LABELS) as ImportMode[]).map((m) => ({ value: m, label: MODE_LABELS[m] }))}
          />
        </label>
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
        "Replace" clears only the selected account; other accounts are untouched.
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
                <ThemedSelect
                  value={mapping[key] ?? ''}
                  onChange={(v) => setMapping((m) => ({ ...m, [key]: v }))}
                  options={[
                    { value: '', label: 'None' },
                    ...pending.headers.map((h) => ({ value: h, label: h })),
                  ]}
                />
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
