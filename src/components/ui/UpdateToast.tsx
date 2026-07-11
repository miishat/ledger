import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const CHECK_INTERVAL_MS = 60 * 60 * 1000 // hourly

/** Shows a refresh prompt when a new deploy is waiting, and keeps long-lived
 *  tabs checking for updates (hourly + when the tab regains focus). */
export const UpdateToast: React.FC = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | undefined>()

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      setRegistration(reg)
    },
  })

  useEffect(() => {
    if (!registration) return

    const interval = setInterval(() => registration.update(), CHECK_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') registration.update()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [registration])

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="fixed bottom-16 md:bottom-6 right-4 z-50 flex items-center gap-3 rounded-lg border border-border px-4 py-3 shadow-xl"
      style={{ backgroundColor: 'var(--dropdown-bg, var(--bg-secondary))' }}
    >
      <span className="text-[14px] text-text-primary">New version available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Refresh
      </button>
    </div>
  )
}
