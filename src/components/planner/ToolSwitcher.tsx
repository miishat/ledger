import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { PLANNER_GROUPS, PLANNER_TOOLS, type PlannerTool } from './toolRegistry'

interface ToolSwitcherProps {
  current: PlannerTool
}

/** Page title that doubles as a grouped tool-switch dropdown, so moving
 *  between planner tools never requires a round-trip through the hub. */
export const ToolSwitcher: React.FC<ToolSwitcherProps> = ({ current }) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
      >
        <h1 className="text-[24px] font-semibold text-text-primary">{current.name}</h1>
        <ChevronDown className={`w-5 h-5 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
          <div
            role="menu"
            className="absolute left-0 top-full mt-2 z-40 w-72 max-h-[70vh] overflow-y-auto themed-card border border-border rounded-lg shadow-xl p-2 flex flex-col gap-1 animate-dropdown-in"
          >
            {PLANNER_GROUPS.map((group) => {
              const tools = PLANNER_TOOLS.filter((t) => t.group === group)
              if (tools.length === 0) return null
              return (
                <div key={group} className="flex flex-col">
                  <span className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{group}</span>
                  {tools.map((t) => {
                    const Icon = t.icon
                    const isCurrent = t.id === current.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpen(false)
                          if (!isCurrent) navigate(`/planner/${t.id}`)
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-[14px] transition-colors ${
                          isCurrent ? 'bg-accent/10 text-accent font-medium' : 'text-text-primary hover:bg-bg-primary/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
      )}
    </div>
  )
}
