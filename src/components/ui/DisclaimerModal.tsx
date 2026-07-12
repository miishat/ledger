import React from 'react'
import { Info, X } from 'lucide-react'
import { DISCLAIMER_TEXT } from '../../utils/disclaimer'

interface DisclaimerModalProps {
  isOpen: boolean
  /** First launch: "I Understand" ack button, no dismiss-on-backdrop. */
  requireAck: boolean
  onClose: () => void
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, requireAck, onClose }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-[16vh]"
      onClick={requireAck ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Disclaimer"
    >
      <div className="themed-menu rounded-lg w-full max-w-md p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold text-text-primary">
            <Info className="w-5 h-5 text-accent" /> A Quick Note
          </h2>
          {!requireAck && (
            <button onClick={onClose} aria-label="Close" className="text-text-secondary hover:text-accent rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-[13px] leading-relaxed text-text-secondary">{DISCLAIMER_TEXT}</p>
        <button
          onClick={onClose}
          className="self-end px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-md text-[14px] font-medium hover:opacity-90 transition-opacity"
        >
          {requireAck ? 'I Understand' : 'Close'}
        </button>
      </div>
    </div>
  )
}
