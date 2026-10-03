import React from 'react'

interface ShowMoreButtonProps {
  total: number
  /** Plural noun for the items, e.g. "sources", "holdings". */
  noun: string
  expanded: boolean
  onToggle: () => void
  /** id of the list element this button expands. */
  controls?: string
}

export const ShowMoreButton: React.FC<ShowMoreButtonProps> = ({ total, noun, expanded, onToggle, controls }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={expanded}
    aria-controls={controls}
    className="w-full min-h-[44px] rounded-md text-[13px] font-medium text-accent hover:bg-bg-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
  >
    {expanded ? 'Show fewer' : `Show all ${total} ${noun}`}
  </button>
)
