import React, { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import {
  mapPortfolioRows, parsePortfolioText, type ColumnMapping, type UnrecognizedPortfolioCSV,
} from '../../utils/portfolioCsv'
import {
  DEFAULT_ACCOUNT, usePortfolioStore, type Holding, type ImportMode,
} from '../../store/usePortfolioStore'
import { ThemedSelect } from '../ui/ThemedSelect'
import { isPortfolioAnalystCsv, parsePortfolioAnalyst, type PAReport } from '../../utils/investments/ibkrPortfolioAnalyst'
import { usePortfolioReportStore } from '../../store/usePortfolioReportStore'
import { ConfirmDialog } from '../ui/ConfirmDialog'

const selectCls =
  'bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[14px] outline-none focus:border-accent'

const MODE_LABELS: Record<ImportMode, string> = {
  replace: 'Replace this account',
  update: 'Update (merge by ticker)',
  add: 'Add as new rows',
}

/** Stock/ETF long positions from the report, as importable holdings. */
function holdingsFromReport(report: PAReport): Omit<Holding, 'id' | 'account'>[] {
  return report.openPositions
    .filter((p) => (p.instrument === 'Stocks' || p.instrument === 'ETFs') && p.quantity > 0 && p.costBasis > 0)
    .map((p) => ({
      ticker: p.symbol.toUpperCase(),
      name: p.description || undefined,
      quantity: p.quantity,
      avgCost: p.costBasis / p.quantity,
      currency: p.currency === 'USD' ? ('USD' as const) : ('CAD' as const),
    }))
}

export const PortfolioImport: React.FC = () => {
  const importHoldings = usePortfolioStore((s) => s.importHoldings)
  const setReport = usePortfolioReportStore((s) => s.setReport)
  const fileRef = useRef<HTMLInputElement>(null)
  const [account, setAccount] = useState(DEFAULT_ACCOUNT)
  const [mode, setMode] = useState<ImportMode>('replace')
  const [pending, setPending] = useState<UnrecognizedPortfolioCSV | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({ ticker: '', quantity: '', totalCost: '', currency: '' })
  const [message, setMessage] = useState('')
  const [holdingsPrompt, setHoldingsPrompt] = useState<Omit<Holding, 'id' | 'account'>[] | null>(null)

  const doImport = (rows: Omit<Holding, 'id' | 'account'>[], via: string) => {
    const acct = account.trim() || DEFAULT_ACCOUNT
    importHoldings(acct, mode, rows)
    setMessage(`Imported ${rows.length} holdings into "${acct}" (${MODE_LABELS[mode].toLowerCase()})${via}.`)
    setPending(null)
  }

  const onFile = async (file: File) => {
    setMessage('')
    const text = await file.text()
    if (isPortfolioAnalystCsv(text)) {
      try {
        const report = parsePortfolioAnalyst(text)
        setReport(report)
        const rows = holdingsFromReport(report)
        setMessage(`PortfolioAnalyst report imported (${report.period}).`)
        if (rows.length > 0) setHoldingsPrompt(rows)
      } catch (err) {
        setMessage(`Could not parse PortfolioAnalyst report: ${err instanceof Error ? err.message : 'unknown error'}`)
      }
      return
    }
    const result = parsePortfolioText(text)
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
          <span className="text-[13px] text-text-secondary">Import Mode</span>
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
        Interactive Brokers holdings, Wealthsimple, and IBKR PortfolioAnalyst reports are detected automatically; anything else opens the column mapper.
        "Replace" clears only the selected account; other accounts are untouched.
      </p>

      {pending && (
        <div className="themed-card rounded-lg p-4 flex flex-col gap-3">
          <p className="text-[13px] text-text-primary font-medium">
            Unrecognized format. Map your columns ({pending.rows.length} rows):
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

      <ConfirmDialog
        open={holdingsPrompt !== null}
        title="Update holdings too?"
        message={`The report contains ${holdingsPrompt?.length ?? 0} stock/ETF positions. Replace the "${account.trim() || DEFAULT_ACCOUNT}" account's holdings with them? The report itself is already saved either way.`}
        confirmLabel="Update holdings"
        onConfirm={() => {
          if (holdingsPrompt) importHoldings(account.trim() || DEFAULT_ACCOUNT, 'replace', holdingsPrompt)
          setHoldingsPrompt(null)
        }}
        onCancel={() => setHoldingsPrompt(null)}
      />
    </div>
  )
}
