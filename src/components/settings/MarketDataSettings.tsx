import React, { useState } from 'react'
import { Database, X } from 'lucide-react'
import { useMarketDataStore } from '../../store/useMarketDataStore'
import { Sheet } from '../ui/Sheet'

export const MarketDataSettings: React.FC = () => {
  const { apiKey, setApiKey, clearApiKey } = useMarketDataStore()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')

  const handleSave = () => {
    setApiKey(input)
    setInput('')
  }

  const handleRemove = () => {
    clearApiKey()
    setInput('')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-accent transition-colors"
      >
        <Database className="w-3.5 h-3.5" /> Market Data
      </button>

      <Sheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        desktop="modal"
        ariaLabel="Market Data"
        panelClassName="themed-menu rounded-lg w-full max-w-md p-6 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="flex items-center gap-2 text-[18px] font-semibold text-text-primary">
            <Database className="w-5 h-5 text-accent" /> Market Data
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            className="text-text-secondary hover:text-accent rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[13px] text-text-secondary">
          {apiKey ? `Key saved (ends in …${apiKey.slice(-3)})` : 'No key set - live stock prices are off.'}
        </p>

        <div className="flex flex-col gap-1">
          <label htmlFor="market-data-api-key" className="text-[13px] font-medium text-text-primary">
            Alpha Vantage API Key
          </label>
          <input
            id="market-data-api-key"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="px-3 py-2 rounded-md border border-border bg-bg-primary/50 text-text-primary text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-md text-[13px] font-medium bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:opacity-90 transition-opacity"
          >
            Save
          </button>
          {apiKey && (
            <button
              onClick={handleRemove}
              className="px-3 py-1.5 rounded-md text-[13px] border border-border text-text-secondary hover:text-accent hover:border-accent transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        <ol className="mt-2 pt-3 border-t border-border text-[13px] text-text-secondary list-decimal list-inside flex flex-col gap-1.5">
          <li>
            Open the free key page:{' '}
            <a
              href="https://www.alphavantage.co/support/#api-key"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              Get a free API key
            </a>
          </li>
          <li>Enter your name and email, click &quot;GET FREE API KEY&quot; - the key appears instantly on the page.</li>
          <li>Paste it above and hit Save. The free plan allows 25 lookups per day, so prices refresh at most once a day.</li>
        </ol>

        <p className="text-[12px] text-text-secondary/80">Your key is stored only on this device.</p>
      </Sheet>
    </>
  )
}
