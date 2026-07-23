import React, { useMemo, useState } from 'react'
import { ChevronDown, RefreshCw, Sparkles, X } from 'lucide-react'
import changelog from '../../../CHANGELOG.md?raw'
import type { SWUpdate } from '../../hooks/useSWUpdate'
import { Sheet } from './Sheet'

interface WhatsNewModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenDisclaimer: () => void
  swUpdate?: SWUpdate
}

interface VersionSection {
  heading: string
  body: string[]
}

/** CHANGELOG.md split into per-version sections, empty ones dropped. */
function parseSections(): VersionSection[] {
  const lines = changelog
    .split('\n')
    .filter((l) => !l.startsWith('# ') && !l.startsWith('All notable') && !l.startsWith('[Keep a') && !l.startsWith('pre-1.0'))
  const sections: VersionSection[] = []
  for (const line of lines) {
    if (line.startsWith('## ')) sections.push({ heading: line.slice(3), body: [] })
    else if (sections.length > 0) sections[sections.length - 1].body.push(line)
  }
  return sections.filter((s) => s.body.some((l) => l.trim().length > 0))
}

const SectionBody: React.FC<{ body: string[] }> = ({ body }) => (
  <>
    {body.map((line, i) => {
      if (line.startsWith('### ')) return <h4 key={i} className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary mt-2">{line.slice(4)}</h4>
      if (line.startsWith('- ')) return <p key={i} className="text-[13px] text-text-primary pl-3">• {line.slice(2)}</p>
      return null
    })}
  </>
)

/** Renders CHANGELOG.md (bundled at build time): newest version expanded,
 *  older versions collapsed. */
export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose, onOpenDisclaimer, swUpdate }) => {
  const sections = useMemo(() => parseSections(), [])
  const [openSections, setOpenSections] = useState<Set<number>>(() => new Set([0]))

  const toggle = (i: number) =>
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const checkLabel =
    swUpdate?.checkStatus === 'checking' ? 'Checking…'
      : swUpdate?.checkStatus === 'upToDate' ? "You're up to date"
      : swUpdate?.needRefresh ? 'Update available'
      : swUpdate?.checkStatus === 'error' ? "Couldn't check. Are you offline?"
      : `v${__APP_VERSION__}`

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      desktop="modal"
      ariaLabel="What's New"
      title={<><Sparkles className="w-5 h-5 text-accent" aria-hidden="true" /> What's New · v{__APP_VERSION__}</>}
      panelClassName="themed-menu md:rounded-lg w-full max-w-2xl md:p-6"
      contentClassName="flex flex-col gap-1"
    >
      <div className="hidden md:flex items-center justify-between mb-2">
        <h2 className="flex items-center gap-2 text-[18px] font-semibold text-text-primary">
          <Sparkles className="w-5 h-5 text-accent" /> What's New · v{__APP_VERSION__}
        </h2>
        <button onClick={onClose} aria-label="Close" className="text-text-secondary hover:text-accent rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
          <X className="w-5 h-5" />
        </button>
      </div>

      {sections.map((s, i) => (
        <div key={s.heading} className="flex flex-col">
          <button
            type="button"
            onClick={() => toggle(i)}
            aria-expanded={openSections.has(i)}
            className="flex items-center justify-between gap-2 mt-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
          >
            <span className="text-[15px] font-semibold text-accent">{s.heading}</span>
            <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${openSections.has(i) ? 'rotate-180' : ''}`} />
          </button>
          {openSections.has(i) && <SectionBody body={s.body} />}
        </div>
      ))}

      {swUpdate && (
        <div className="flex items-center justify-between gap-3 mt-5 pt-3 border-t border-border">
          <span className="text-[12px] text-text-secondary">{checkLabel}</span>
          {swUpdate.needRefresh ? (
            <button
              onClick={swUpdate.refresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Now
            </button>
          ) : (
            <button
              onClick={swUpdate.checkForUpdates}
              disabled={swUpdate.checkStatus === 'checking'}
              className="px-3 py-1.5 rounded-md text-[13px] border border-border text-text-secondary hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
            >
              Check for Updates
            </button>
          )}
        </div>
      )}

      <p className="mt-3 pt-3 border-t border-border text-[12px] text-text-secondary text-center">
        Made by{' '}
        <a href="https://github.com/miishat" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          Mishat
        </a>
      </p>

      <button
        onClick={() => { onClose(); onOpenDisclaimer() }}
        className="mt-1 text-[10px] text-text-secondary/80 hover:text-accent transition-colors self-center"
      >
        Estimates Only · Not Financial Advice
      </button>
    </Sheet>
  )
}
