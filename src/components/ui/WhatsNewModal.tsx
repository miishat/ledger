import React from 'react'
import { X, Sparkles } from 'lucide-react'
import changelog from '../../../CHANGELOG.md?raw'

interface WhatsNewModalProps {
  isOpen: boolean
  onClose: () => void
}

/** Renders CHANGELOG.md (bundled at build time) in a readable panel. */
export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  // Minimal markdown rendering: ## sections, ### subsections, - bullets.
  const allLines = changelog.split('\n').filter((l) => !l.startsWith('# ') && !l.startsWith('All notable') && !l.startsWith('[Keep a') && !l.startsWith('pre-1.0'))

  // Drop "## " sections with no content before the next "## " heading (e.g. an empty [Unreleased]).
  const lines = allLines.filter((line, i) => {
    if (!line.startsWith('## ')) return true
    const rest = allLines.slice(i + 1)
    const nextSectionIdx = rest.findIndex((l) => l.startsWith('## '))
    const body = nextSectionIdx === -1 ? rest : rest.slice(0, nextSectionIdx)
    return body.some((l) => l.trim().length > 0)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[8vh] overflow-y-auto" onClick={onClose} role="dialog" aria-modal="true" aria-label="What's New">
      <div className="themed-menu rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="flex items-center gap-2 text-[18px] font-semibold text-text-primary">
            <Sparkles className="w-5 h-5 text-accent" /> What's New — v{__APP_VERSION__}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-text-secondary hover:text-accent rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
            <X className="w-5 h-5" />
          </button>
        </div>
        {lines.map((line, i) => {
          if (line.startsWith('## ')) return <h3 key={i} className="text-[15px] font-semibold text-accent mt-4">{line.slice(3)}</h3>
          if (line.startsWith('### ')) return <h4 key={i} className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary mt-2">{line.slice(4)}</h4>
          if (line.startsWith('- ')) return <p key={i} className="text-[13px] text-text-primary pl-3">• {line.slice(2)}</p>
          return null
        })}
        <p className="mt-5 pt-3 border-t border-border text-[12px] text-text-secondary text-center">
          Made by{' '}
          <a
            href="https://github.com/miishat"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            Mishat
          </a>
        </p>
      </div>
    </div>
  )
}
