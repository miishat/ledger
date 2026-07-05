import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { OverlayBackdrop } from './OverlayBackdrop'

export interface ThemedSelectOption {
  value: string
  label: string
}

interface ThemedSelectProps {
  id?: string
  value: string
  options: ThemedSelectOption[]
  onChange: (value: string) => void
  className?: string
}

/** Theme-aware replacement for native <select>. Styled like the planner
 *  ToolSwitcher menu: themed card, accent highlight, blur backdrop. */
export const ThemedSelect: React.FC<ThemedSelectProps> = ({ id, value, options, onChange, className = '' }) => {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  const openListbox = () => {
    setHighlight(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const commit = (v: string) => {
    onChange(v)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault(); openListbox(); return
    }
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, options.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (options[highlight]) commit(options[highlight].value) }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openListbox())}
        onKeyDown={onKeyDown}
        className={`w-full flex items-center justify-between gap-2 bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[15px] outline-none focus:border-accent transition-colors ${className}`}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <OverlayBackdrop onClose={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1 z-30 max-h-64 overflow-y-auto themed-card border border-border rounded-lg shadow-xl p-1 flex flex-col"
          >
            {options.map((o, i) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => commit(o.value)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded text-left text-[14px] transition-colors ${
                  i === highlight ? 'bg-accent/10 text-accent' : 'text-text-primary'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
