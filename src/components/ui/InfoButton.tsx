import React, { useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { Sheet } from './Sheet'

interface InfoButtonProps {
  /** Names the button and titles the sheet it opens. */
  label: string
  children: React.ReactNode
  /** Shows the label beside the icon instead of the icon alone. */
  showLabel?: boolean
}

/** An (i) button that opens a short explanation in a sheet: a bottom sheet on
 *  phones, a popover on desktop. Keeps explanatory copy off the page until asked for. */
export const InfoButton: React.FC<InfoButtonProps> = ({ label, children, showLabel }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        onClick={() => setOpen(true)}
        className={`shrink-0 inline-flex items-center justify-center gap-1.5 text-text-secondary ${showLabel ? 'min-h-11 px-3 rounded-xl border border-border text-[13px] font-medium' : 'w-11 h-11'}`}
      >
        <Info size={18} aria-hidden="true" />
        {showLabel ? label : null}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        desktop="popover"
        anchorRef={ref}
        ariaLabel={label}
        title={label}
        panelClassName="themed-menu rounded-lg p-4 w-[300px]"
        contentClassName="flex flex-col gap-2 text-[14px] text-text-secondary"
      >
        {children}
      </Sheet>
    </>
  )
}
