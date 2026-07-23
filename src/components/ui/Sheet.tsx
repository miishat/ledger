import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import { useScrollLock } from '../../hooks/useScrollLock'
import { shouldDismissOnDragEnd } from './sheetGestures'

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
  /** Optional title shown in the mobile sheet header row (desktop ignores it; callers keep their own headers). */
  title?: React.ReactNode
  /** DESKTOP-only panel classes (max-width, rounding, padding). NOT applied to the mobile
   *  bottom sheet, which is always full-width with its own chrome. Put content-layout classes
   *  (flex/gap) in contentClassName so they apply in both modes. */
  panelClassName?: string
  /** Classes for the content wrapper around children, applied in BOTH desktop and mobile
   *  (e.g. "flex flex-col gap-3"). This is where per-modal content spacing belongs. */
  contentClassName?: string
  children: React.ReactNode
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

// Module-level stack of currently-open Sheet instance ids, topmost last.
// Mirrors useScrollLock's module-level ref-counting pattern so stacked
// Sheets (e.g. a ThemedSelect's own Sheet opened inside a modal Sheet) can
// tell which one is on top without any prop-drilled context.
const openStack: string[] = []

export const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  desktop = 'modal',
  anchorRef,
  dismissible = true,
  ariaLabel,
  labelledBy,
  title,
  panelClassName = '',
  contentClassName = '',
  children,
}) => {
  const isDesktop = useIsDesktop()
  const reduced = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const lastFocused = useRef<HTMLElement | null>(null)
  const instanceId = useId()
  useScrollLock(open)

  // Register/unregister this instance on the shared stacking-order stack
  // whenever it opens or closes (regardless of dismissibility — a
  // non-dismissible Sheet still occupies the top layer and should still
  // block Escape from reaching sheets stacked below it).
  useEffect(() => {
    if (!open) return
    openStack.push(instanceId)
    return () => {
      const i = openStack.indexOf(instanceId)
      if (i !== -1) openStack.splice(i, 1)
    }
  }, [open, instanceId])

  // Escape closes only the topmost stacked Sheet.
  useEffect(() => {
    if (!open || !dismissible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (openStack[openStack.length - 1] !== instanceId) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissible, onClose, instanceId])

  // Focus management: focus the panel on open, restore to trigger on close.
  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement
      // focus first focusable, else the panel
      const el = panelRef.current
      const focusable = el?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ;(focusable ?? el)?.focus()
    } else {
      lastFocused.current?.focus?.()
    }
  }, [open])

  // Focus trap: keep Tab/Shift+Tab cycling within the panel while open.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const el = panelRef.current
      if (!el) return
      const focusables = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Desktop popover anchor position.
  const POPOVER_MARGIN = 8
  const POPOVER_FALLBACK_WIDTH = 320
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  useLayoutEffect(() => {
    if (!open || !isDesktop || desktop !== 'popover' || !anchorRef?.current) return
    const r = anchorRef.current.getBoundingClientRect()
    const panelWidth = panelRef.current?.getBoundingClientRect().width || POPOVER_FALLBACK_WIDTH
    const panelHeight = panelRef.current?.getBoundingClientRect().height || 0
    const maxLeft = window.innerWidth - POPOVER_MARGIN - panelWidth
    const left = Math.min(Math.max(r.left, POPOVER_MARGIN), Math.max(maxLeft, POPOVER_MARGIN))
    let top = r.bottom + POPOVER_MARGIN
    if (panelHeight && top + panelHeight > window.innerHeight) {
      const above = r.top - POPOVER_MARGIN - panelHeight
      if (above >= POPOVER_MARGIN) top = above
    }
    setPos({ top, left })
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

  // Desktop content wrapper: only wrap when a contentClassName is given, so modals
  // that don't need content-layout classes keep rendering children directly.
  const desktopContent = contentClassName ? <div className={contentClassName}>{children}</div> : children

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
              {desktopContent}
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
              {desktopContent}
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
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {scrim}
          <motion.div
            {...commonPanelProps}
            className="relative z-50 w-full max-h-[90dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-[var(--dropdown-bg)] shadow-2xl"
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
            <div className="sticky top-0 z-10 flex items-center gap-2 px-4 pt-4 pb-2 bg-[var(--dropdown-bg)]">
              <span className="absolute left-1/2 -translate-x-1/2 top-2 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
              {title != null && (
                <h2 className="flex items-center gap-2 text-[16px] font-semibold text-text-primary">{title}</h2>
              )}
              {dismissible && (
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="ml-auto p-1 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className={`px-4 pb-4 ${contentClassName}`}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
