import React, { useRef, useState } from 'react'
import { Info } from 'lucide-react'
import type { PlannerTool } from './toolRegistry'
import { Sheet } from '../ui/Sheet'

export const ToolInfoButton: React.FC<{ tool: PlannerTool }> = ({ tool }) => {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label="About this tool"
        onClick={() => setOpen((v) => !v)}
        className="p-1 rounded-full text-text-secondary hover:text-accent transition-colors"
      >
        <Info className="w-4 h-4" />
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        desktop="popover"
        anchorRef={btnRef}
        ariaLabel={`${tool.name} help`}
        panelClassName="w-[32rem] max-w-[calc(100vw-1rem)] themed-menu rounded-lg shadow-xl p-4 flex flex-col gap-3"
      >
        <h3 className="text-[15px] font-semibold text-text-primary">{tool.name}</h3>
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
      </Sheet>
    </div>
  )
}
