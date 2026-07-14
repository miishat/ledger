import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import { useScrollLock } from '../../hooks/useScrollLock'
import { shouldDismissOnDragEnd } from './sheet.ts'

interface SheetProps {
  open: boolean
  onClose: () => void
  /** Desktop rendering. 'modal' = centered dialog; 'popover' = anchored to anchorRef. Default 'modal'. */
  desktop?: 'modal' | 'popover'
  /** Required when desktop='popover': the trigger element to anchor to on desktop. */
  anchorRef?: React.RefObject<HTMLElement | null>
  /** When false, scrim-tap / swipe / Esc do NOT close (caller-controlled dismissal, e.g. required disclaimer). Default true. */
  dismissible?: boolean
  ariaLabel?: string
  labelledBy?: string
  /** Extra classes for the panel container (e.g. max-width on desktop modal). */
  panelClassName?: string
  /** Optional title shown in the mobile sheet header row (desktop ignores it; callers keep their own headers). */
  children: React.ReactNode
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  desktop = 'modal',
  anchorRef,
  dismissible = true,
  ariaLabel,
  labelledBy,
  panelClassName = '',
  children,
}) => {
  const isDesktop = useIsDesktop()
  const reduced = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const lastFocused = useRef<HTMLElement | null>(null)
  useScrollLock(open)

  // Escape to close.
  useEffect(() => {
    if (!open || !dismissible) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissible, onClose])

  // Focus management: focus the panel on open, restore to trigger on close.
  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement
      // focus first focusable, else the panel
      const el = panelRef.current
      const focusable = el?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      ;(focusable ?? el)?.focus()
    } else {
      lastFocused.current?.focus?.()
    }
  }, [open])

  // Desktop popover anchor position.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  useLayoutEffect(() => {
    if (!open || !isDesktop || desktop !== 'popover' || !anchorRef?.current) return
    const r = anchorRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 8, left: r.left })
  }, [open, isDesktop, desktop, anchorRef])

  if (typeof document === 'undefined') return null

  const scrim = (
    <motion.div
      data-testid="sheet-scrim"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.15 }}
      onClick={() => dismissible && onClose()}
      aria-hidden="true"
    />
  )

  const commonPanelProps = {
    ref: panelRef,
    role: 'dialog',
    'aria-modal': true,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    tabIndex: -1,
    'data-testid': 'sheet-panel',
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  } as const

  // ---- Desktop: modal (centered) ----
  if (isDesktop && desktop === 'modal') {
    return createPortal(
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {scrim}
            <motion.div
              {...commonPanelProps}
              className={`relative z-50 my-8 ${panelClassName}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: reduced ? 0 : 0.15 }}
            >
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )
  }

  // ---- Desktop: popover (anchored) ----
  if (isDesktop && desktop === 'popover') {
    return createPortal(
      <AnimatePresence>
        {open && (
          <>
            {scrim}
            <motion.div
              {...commonPanelProps}
              className={`fixed z-50 ${panelClassName}`}
              style={{
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                maxWidth: 'calc(100vw - 16px)',
              }}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: reduced ? 0 : 0.12 }}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )
  }

  // ---- Mobile: bottom sheet ----
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (dismissible && shouldDismissOnDragEnd(info.offset.y, info.velocity.y)) onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          {scrim}
          <motion.div
            {...commonPanelProps}
            className={`relative z-50 w-full max-h-[90dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-[var(--dropdown-bg)] shadow-2xl ${panelClassName}`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'tween', duration: reduced ? 0 : 0.22, ease: 'easeOut' }}
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
          >
            <div className="sticky top-0 flex items-center justify-between px-4 pt-3 pb-2 bg-[var(--dropdown-bg)]">
              <span className="mx-auto h-1 w-10 rounded-full bg-border" aria-hidden="true" />
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute right-3 top-3 p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
