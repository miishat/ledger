import React, { useState } from 'react'
import { Bell, Database, LineChart, Palette, RefreshCw, Settings, X } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { ThemeSwatchGrid } from '../theme/ThemeSwatchGrid'
import { MarketDataSection, MarketDataStatusBadge } from './MarketDataSettings'
import { BackupControls } from './BackupControls'
import { DriveSyncControls } from './DriveSyncControls'
import { reminderSupport, remindersEnabled, setRemindersEnabled, type ReminderSupport } from '../../utils/reminders'
import { Checkbox } from '../ui/Checkbox'

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

/** Opt-in control for recurring-bill reminders. Notification.requestPermission()
 *  is only ever called from this button's click handler, never on mount or in
 *  an effect: some browsers auto-deny (and remember the denial) a permission
 *  prompt that fires without a direct user gesture. */
const ReminderSettings: React.FC = () => {
  const [support, setSupport] = useState<ReminderSupport>(() => reminderSupport())
  const [enabled, setEnabled] = useState(() => remindersEnabled())

  const handleEnable = () => {
    void Notification.requestPermission().then((result) => {
      setSupport(result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'default')
      if (result === 'granted') {
        setRemindersEnabled(true)
        setEnabled(true)
      }
    })
  }

  if (support === 'unsupported') {
    return <p className="text-[13px] text-text-secondary">Notifications aren't supported in this browser.</p>
  }

  if (support === 'denied') {
    return (
      <p className="text-[13px] text-text-secondary">
        Notifications are blocked for this site. Allow them in your browser's site settings to get bill reminders.
      </p>
    )
  }

  if (support === 'granted') {
    return (
      <label className="flex items-center gap-2 text-[13px] text-text-primary">
        <Checkbox
          checked={enabled}
          ariaLabel="Remind me before upcoming recurring bills"
          onChange={(next) => {
            setRemindersEnabled(next)
            setEnabled(next)
          }}
        />
        Remind me before upcoming recurring bills
      </label>
    )
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-[13px] text-text-secondary">Get a reminder a few days before recurring bills are due.</p>
      <button
        onClick={handleEnable}
        className="text-[12px] font-medium text-accent hover:underline whitespace-nowrap"
      >
        Enable reminders
      </button>
    </div>
  )
}

/** Single settings hub: Appearance, Market data, Backup as section cards,
 *  About as a footer row. Modal on desktop, bottom sheet on mobile. */
export const SettingsSheet: React.FC<SettingsSheetProps> = ({ open, onClose, onOpenWhatsNew, onOpenDisclaimer }) => (
  <Sheet
    open={open}
    onClose={onClose}
    desktop="modal"
    ariaLabel="Settings"
    title={<><Settings className="w-5 h-5 text-accent" aria-hidden="true" /> Settings</>}
    panelClassName="themed-menu md:rounded-lg w-full max-w-md md:p-5 md:max-h-[85dvh] md:overflow-y-auto"
    contentClassName="flex flex-col gap-3"
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

    <SectionCard icon={<RefreshCw className="w-4 h-4" />} title="Sync">
      <DriveSyncControls />
    </SectionCard>

    <SectionCard icon={<Bell className="w-4 h-4" />} title="Reminders">
      <ReminderSettings />
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
