import React from 'react'

interface OverlayBackdropProps {
  onClose: () => void
  className?: string
}

/** Shared backdrop for click-opened popups (e.g. ToolInfoButton). Matches the
 *  CompensationModal overlay treatment (bg-black/50 + backdrop-blur-md).
 *  Render as a sibling BEFORE the popup panel; panel needs z-30 or higher.
 *  NOTE: Dropdowns must NOT use this; they use animate-dropdown-in instead. */
export const OverlayBackdrop: React.FC<OverlayBackdropProps> = ({ onClose, className = '' }) => (
  <div
    data-testid="overlay-backdrop"
    className={`fixed inset-0 z-20 bg-black/50 backdrop-blur-md animate-fade-in ${className}`}
    onClick={onClose}
    aria-hidden="true"
  />
)
