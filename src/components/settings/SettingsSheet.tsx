import React from 'react'
import { Database, LineChart, Palette, Settings, X } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { ThemeSwatchGrid } from '../theme/ThemeSwatchGrid'
import { MarketDataSection, MarketDataStatusBadge } from './MarketDataSettings'
import { BackupControls } from './BackupControls'

interface SettingsSheetProps {
  open: boolean
  onClose: () => void
  onOpenWhatsNew: () => void
  onOpenDisclaimer: () => void
}

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; badge?: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  title,
  badge,
  children,
}) => (
  <section className="border border-border rounded-lg p-3">
    <div className="flex items-center justify-between gap-2 mb-2.5">
      <h3 className="flex items-center gap-1.5 text-[13px] font-medium text-text-primary">
        <span className="text-text-secondary" aria-hidden="true">{icon}</span>
        {title}
      </h3>
      {badge}
    </div>
    {children}
  </section>
)

/** Single settings hub: Appearance, Market data, Backup as section cards,
 *  About as a footer row. Modal on desktop, bottom sheet on mobile. */
export const SettingsSheet: React.FC<SettingsSheetProps> = ({ open, onClose, onOpenWhatsNew, onOpenDisclaimer }) => (
  <Sheet
    open={open}
    onClose={onClose}
    desktop="modal"
    ariaLabel="Settings"
    title={<><Settings className="w-5 h-5 text-accent" aria-hidden="true" /> Settings</>}
    panelClassName="themed-menu md:rounded-lg w-full max-w-md md:p-5 flex flex-col gap-3 md:max-h-[85dvh] md:overflow-y-auto"
  >
    <div className="hidden md:flex items-center justify-between">
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

    <SectionCard icon={<Palette className="w-4 h-4" />} title="Appearance">
      <ThemeSwatchGrid />
    </SectionCard>

    <SectionCard icon={<LineChart className="w-4 h-4" />} title="Market data" badge={<MarketDataStatusBadge />}>
      <MarketDataSection />
    </SectionCard>

    <SectionCard icon={<Database className="w-4 h-4" />} title="Backup">
      <BackupControls />
    </SectionCard>

    <div className="flex items-center justify-between pt-2 border-t border-border">
      <button
        onClick={() => { onClose(); onOpenWhatsNew() }}
        className="text-[12px] text-text-secondary hover:text-accent transition-colors"
      >
        v{__APP_VERSION__} · What's New
      </button>
      <button
        onClick={() => { onClose(); onOpenDisclaimer() }}
        className="text-[12px] text-text-secondary/80 hover:text-accent transition-colors"
      >
        Not financial advice
      </button>
    </div>
  </Sheet>
)
