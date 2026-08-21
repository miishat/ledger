import React, { useRef } from 'react'

export interface TabItem<T extends string> {
  id: T
  label: string
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[]
  value: T
  onChange: (id: T) => void
  /** Names the tablist for screen readers, for example "Budgeting sections". */
  ariaLabel: string
  className?: string
}

/** The app's tab strips were plain buttons: a screen reader announced all of
 *  them identically with no indication of which was active, and a keyboard
 *  user had to Tab through every one. This is the WAI-ARIA tabs pattern:
 *  roving tabindex, arrow keys with wraparound, Home and End. */
export function Tabs<T extends string>({ items, value, onChange, ariaLabel, className = '' }: TabsProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const focusAndSelect = (id: T) => {
    onChange(id)
    // The newly selected tab is the only one in the tab order, so move focus
    // with it or the next Tab press would leave the strip from a stale node.
    requestAnimationFrame(() => refs.current[id]?.focus())
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const index = items.findIndex((t) => t.id === value)
    if (index < 0) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusAndSelect(items[(index + 1) % items.length].id)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      focusAndSelect(items[(index - 1 + items.length) % items.length].id)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusAndSelect(items[0].id)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusAndSelect(items[items.length - 1].id)
    }
  }

  return (
    <div role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown} className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            ref={(el) => { refs.current[item.id] = el }}
            id={`tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`panel-${item.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              active
                ? 'border-accent text-accent bg-accent/10'
                : 'control-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
