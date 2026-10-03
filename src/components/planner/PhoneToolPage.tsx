import React, { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import type { PlannerTool } from './toolRegistry'
import { ToolInfoSheet } from './ToolInfoButton'
import { hasSeenToolIntro, markToolIntroSeen } from '../../utils/toolIntroSeen'

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent'

/** Phone body of a planner tool: a one-time notice above the tool on first visit, the
 *  tool, then an always-present About this tool button after the results. Key this by
 *  tool id so each tool keeps its own first-visit state. */
export const PhoneToolPage: React.FC<{ tool: PlannerTool; children: React.ReactNode }> = ({ tool, children }) => {
  const [infoOpen, setInfoOpen] = useState(false)
  const [noticeVisible, setNoticeVisible] = useState(() => !hasSeenToolIntro(tool.id))

  const aboutRef = useRef<HTMLButtonElement>(null)
  // The notice's own buttons unmount when it goes, which would leave focus on <main> or
  // <body>. The bottom button is always present, so focus moves there once the notice is gone.
  const refocusAbout = useRef(false)
  useEffect(() => {
    if (refocusAbout.current && !noticeVisible && !infoOpen) {
      refocusAbout.current = false
      aboutRef.current?.focus()
    }
  }, [noticeVisible, infoOpen])

  const openInfo = () => {
    markToolIntroSeen(tool.id)
    setInfoOpen(true)
  }
  // The notice leaves only once the sheet is gone, so the sheet's own focus restore never
  // lands on a button that is about to unmount.
  const closeInfo = () => {
    if (noticeVisible) refocusAbout.current = true
    setInfoOpen(false)
    setNoticeVisible(false)
  }
  const dismiss = () => {
    markToolIntroSeen(tool.id)
    refocusAbout.current = true
    setNoticeVisible(false)
  }

  return (
    <>
      {noticeVisible && (
        <div className="rounded-lg border border-border px-3 pb-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={openInfo}
              className={`flex items-center gap-2 min-h-[44px] text-[14px] text-accent rounded ${FOCUS}`}
            >
              <Info className="w-4 h-4" aria-hidden="true" />
              About this tool
            </button>
            <button
              type="button"
              onClick={dismiss}
              className={`min-h-[44px] px-2 -mr-2 text-[14px] text-text-secondary hover:text-accent rounded ${FOCUS}`}
            >
              Got it
            </button>
          </div>
          <p className="text-[12px] text-text-secondary">
            You can find this again at the bottom of the page, after the results.
          </p>
        </div>
      )}
      {children}
      <div className="flex justify-center pt-4">
        <button
          ref={aboutRef}
          type="button"
          onClick={openInfo}
          className={`mx-auto flex items-center justify-center gap-2 min-h-[44px] px-3 text-[14px] text-accent rounded ${FOCUS}`}
        >
          <Info className="w-4 h-4" aria-hidden="true" />
          About this tool
        </button>
      </div>
      <ToolInfoSheet tool={tool} open={infoOpen} onClose={closeInfo} />
    </>
  )
}
