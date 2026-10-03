import React, { useRef, useState } from 'react'
import { Info } from 'lucide-react'
import type { PlannerTool } from './toolRegistry'
import { Sheet } from '../ui/Sheet'

/** The info content, shared by the desktop icon button and the phone notice and
 *  bottom button. Desktop anchors it to anchorRef; a phone shows it as a bottom sheet. */
export const ToolInfoSheet: React.FC<{
  tool: PlannerTool
  open: boolean
  onClose: () => void
  anchorRef?: React.RefObject<HTMLElement | null>
}> = ({ tool, open, onClose, anchorRef }) => (
  <Sheet
    open={open}
    onClose={onClose}
    desktop="popover"
    anchorRef={anchorRef}
    ariaLabel={`${tool.name} help`}
    panelClassName="w-[32rem] max-w-[calc(100vw-1rem)] max-h-[70vh] overflow-y-auto themed-menu rounded-lg shadow-xl p-4 flex flex-col gap-3"
  >
    <h3 className="text-[15px] font-semibold text-text-primary">{tool.name}</h3>
    <p className="text-[13px] text-text-secondary">{tool.info.howTo}</p>
    <div className="flex flex-col gap-2">
      <span className="text-meta font-semibold uppercase tracking-wide text-text-secondary">Parameters</span>
      {tool.info.params.map((p) => (
        <div key={p.name} className="text-[13px]">
          <span className="font-medium text-text-primary">{p.name}</span>
          <span className="text-text-secondary"> : {p.description}</span>
        </div>
      ))}
    </div>
  </Sheet>
)

/** Desktop: the info icon beside the tool title. Phones use ToolIntro instead. */
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
        className="p-1 rounded-full text-text-secondary hover:text-accent transition-colors min-h-[44px] min-w-[44px] desktop:min-h-0 desktop:min-w-0 flex items-center justify-center"
      >
        <Info className="w-4 h-4" />
      </button>
      <ToolInfoSheet tool={tool} open={open} onClose={() => setOpen(false)} anchorRef={btnRef} />
    </div>
  )
}
