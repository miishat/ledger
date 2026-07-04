import React, { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { buildActions, filterActions } from './commandActions'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)
  const actions = useMemo(() => buildActions(), [])
  const results = filterActions(actions, query)
  const clampedSelected = Math.min(selected, Math.max(0, results.length - 1))

  if (!isOpen) return null

  const run = (path: string) => {
    navigate(path)
    setQuery('')
    setSelected(0)
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(Math.min(clampedSelected + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(Math.max(clampedSelected - 1, 0)) }
    else if (e.key === 'Enter' && results[clampedSelected]) { e.preventDefault(); run(results[clampedSelected].path) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] px-4" onClick={onClose} role="dialog" aria-label="Command palette">
      <div className="themed-card rounded-lg w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-text-secondary" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-text-primary text-[15px] outline-none placeholder:text-text-secondary"
            placeholder="Jump to a module or tool…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={onKeyDown}
            aria-label="Search commands"
          />
          <kbd className="text-[11px] text-text-secondary border border-border rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <ul ref={listRef} className="max-h-[40vh] overflow-y-auto py-1" role="listbox">
          {results.length === 0 && <li className="px-4 py-3 text-[13px] text-text-secondary">No matches.</li>}
          {results.map((a, i) => (
            <li key={a.id} role="option" aria-selected={i === clampedSelected}>
              <button
                onClick={() => run(a.path)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full text-left px-4 py-2.5 flex flex-col focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent ${
                  i === clampedSelected ? 'bg-accent/10 text-accent' : 'text-text-primary'
                }`}
              >
                <span className="text-[14px] font-medium">{a.label}</span>
                <span className="text-[12px] text-text-secondary">{a.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
