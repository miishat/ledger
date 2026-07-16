import React from 'react'
import { Settings, X } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { ThemeSwatchGrid } from '../theme/ThemeSwatchGrid'
import { MarketDataSection } from './MarketDataSettings'
import { BackupControls } from './BackupControls'

interface SettingsSheetProps {
  open: boolean
  onClose: () => void
  onOpenWhatsNew: () => void
  onOpenDisclaimer: () => void
}

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[11px] uppercase tracking-wide text-text-secondary mt-4 mb-2 first:mt-0">{children}</h3>
)

/** Single settings hub: Appearance, Market Data, Backup, About. Modal on
 *  desktop, bottom sheet on mobile. */
export const SettingsSheet: React.FC<SettingsSheetProps> = ({ open, onClose, onOpenWhatsNew, onOpenDisclaimer }) => (
  <Sheet
    open={open}
    onClose={onClose}
    desktop="modal"
    ariaLabel="Settings"
    panelClassName="themed-menu rounded-lg w-full max-w-md p-6 flex flex-col max-h-[85dvh] overflow-y-auto"
  >
    <div className="flex items-center justify-between mb-2">
      <h2 className="flex items-center gap-2 text-[18px] font-semibold text-text-primary">
        <Settings className="w-5 h-5 text-accent" /> Settings
      </h2>
      <button
        onClick={onClose}
        aria-label="Close"
        className="text-text-secondary hover:text-accent rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    <SectionHeading>Appearance</SectionHeading>
    <ThemeSwatchGrid />

    <SectionHeading>Market Data</SectionHeading>
    <MarketDataSection />

    <SectionHeading>Backup</SectionHeading>
    <BackupControls />

    <SectionHeading>About</SectionHeading>
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={() => { onClose(); onOpenWhatsNew() }}
        className="text-[13px] text-text-secondary hover:text-accent transition-colors"
      >
        v{__APP_VERSION__} · What's New
      </button>
      <button
        onClick={() => { onClose(); onOpenDisclaimer() }}
        className="text-[12px] text-text-secondary/80 hover:text-accent transition-colors"
      >
        Estimates Only · Not Financial Advice
      </button>
    </div>
  </Sheet>
)
