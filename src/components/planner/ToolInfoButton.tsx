import React, { useState } from 'react'
import { Info, X } from 'lucide-react'
import type { PlannerTool } from './toolRegistry'
import { OverlayBackdrop } from '../ui/OverlayBackdrop'

export const ToolInfoButton: React.FC<{ tool: PlannerTool }> = ({ tool }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="About this tool"
        onClick={() => setOpen((v) => !v)}
        className="p-1 rounded-full text-text-secondary hover:text-accent transition-colors"
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <>
          <OverlayBackdrop onClose={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label={`${tool.name} help`}
            className="absolute left-0 top-full mt-2 z-30 w-[32rem] max-w-[90vw] max-h-[70vh] overflow-y-auto themed-menu rounded-lg shadow-xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-text-primary">{tool.name}</h3>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[13px] text-text-secondary">{tool.info.howTo}</p>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Parameters</span>
              {tool.info.params.map((p) => (
                <div key={p.name} className="text-[13px]">
                  <span className="font-medium text-text-primary">{p.name}</span>
                  <span className="text-text-secondary"> : {p.description}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
