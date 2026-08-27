import React from 'react'
import type { AppTheme } from '../../store/useThemeStore'

interface SidebarFloralProps {
  theme: AppTheme
}

/** The art nouveau ornament for the Gilded Bloom theme: whiplash stems in
 *  gold leaf sweeping up out of the bottom left, with stylised four-petal
 *  blooms in the theme accent.
 *
 *  It is mounted inside the desktop sidebar rather than in ThemeBackground
 *  on purpose. ThemeBackground paints the full viewport, and cards are
 *  opaque, so ornament placed there would be visible only in whatever gaps
 *  the page happened to leave. Confined to the sidebar it draws on a
 *  reliably uncluttered width, and it can never intrude on the data.
 *
 *  Sizes are fixed rather than responsive: the sidebar is a fixed w-64, so a
 *  256px drawing anchored to the bottom left lands the same way at every
 *  window height, and the wrapper's overflow-hidden clips it. On a phone
 *  there is no desktop sidebar and therefore no ornament, which is the
 *  intended scope for this theme.
 *
 *  The height is not equally reliable, and the wrapper being absolute
 *  inset-0 inside an overflow-y-auto nav is why: when the nav actually
 *  scrolls, the ornament scrolls away with the content and leaves the
 *  revealed lower area bare. Shrinking the window does not cause this, since
 *  the nav's justify-between absorbs the slack and scrollHeight stays equal
 *  to clientHeight. An enlarged root font size does: at a 24px root the nav
 *  measured scrollHeight 670 against clientHeight 492, and scrolled to the
 *  bottom the drawing ended 186px above the nav's lower edge. Cosmetic only,
 *  and it costs nothing functional, but do not describe this ornament as
 *  always covering the sidebar.
 *
 *  Every id is prefixed `gb-` because these live in the main document, not a
 *  shadow root, and a bare `#leaf` would be one collision away from another
 *  component's defs. */
export const SidebarFloral: React.FC<SidebarFloralProps> = ({ theme }) => {
  if (theme !== 'nouveau') return null

  return (
    <div
      aria-hidden="true"
      data-testid="sidebar-floral"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        // Inline rather than a `-z-10` utility: this has to paint behind the
        // sidebar's in-flow nav links, and an inline value cannot go missing
        // because a utility was never generated.
        zIndex: -10,
        // Fade the drawing out before it reaches the settings dock. That dock
        // is 69px tall and scrimmed at only 20% opacity, so stems and blooms
        // were running straight under "Settings" and the version number and
        // making both hard to read. The gradient is fully opaque down to
        // 150px from the bottom and fully clear by 78px, which lands the end
        // of the fade a few pixels above the dock's top border rather than
        // cutting the artwork off at a hard edge.
        maskImage: 'linear-gradient(to bottom, #000 calc(100% - 150px), transparent calc(100% - 78px))',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 calc(100% - 150px), transparent calc(100% - 78px))',
      }}
    >
      <svg
        width="256"
        height="520"
        viewBox="0 0 256 520"
        className="absolute bottom-0 left-0"
        style={{ color: 'var(--ornament)' }}
      >
        <defs>
          <g id="gb-leaf">
            <path d="M0,0 C4,-5 12,-5.4 16.5,0 C12,5.4 4,5 0,0 Z" fill="none" stroke="currentColor" strokeWidth="1.15" />
            <path d="M1.5,0 L15,0" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.75" />
          </g>
          <g id="gb-bud">
            <path d="M0,0 C-3.4,-3 -3.2,-8.4 0,-11.4 C3.2,-8.4 3.4,-3 0,0 Z" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <path d="M0,0 L0,5.5" fill="none" stroke="currentColor" strokeWidth="1" />
          </g>
          <g id="gb-tendril">
            <path
              d="M0,0 C9,-7 19,-2.5 16.5,7 C14.6,14 6,14.6 4.6,7.6 C3.7,3.2 8.4,0.6 11,4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.05"
              strokeLinecap="round"
            />
          </g>
          <g id="gb-bloom">
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M0,-5 C11,-27 33,-22 27,-3 C23.6,8 8,9 0,-5 Z" />
              <path d="M0,-5 C11,-27 33,-22 27,-3 C23.6,8 8,9 0,-5 Z" transform="rotate(90)" />
              <path d="M0,-5 C11,-27 33,-22 27,-3 C23.6,8 8,9 0,-5 Z" transform="rotate(180)" />
              <path d="M0,-5 C11,-27 33,-22 27,-3 C23.6,8 8,9 0,-5 Z" transform="rotate(270)" />
            </g>
            <circle r="5.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </g>
        </defs>

        <g opacity="0.62">
          <g fill="none" stroke="currentColor" strokeLinecap="round">
            <path d="M40,520 C104,456 74,372 124,306 C168,248 148,166 196,110" strokeWidth="2.1" />
            <path d="M40,520 C82,474 136,448 170,392 C200,342 190,282 160,244" strokeWidth="1.4" opacity="0.8" />
            <path d="M96,520 C142,482 166,436 174,380" strokeWidth="1.1" opacity="0.6" />
          </g>

          <use href="#gb-leaf" transform="translate(78,450) rotate(-48) scale(1.9)" />
          <use href="#gb-leaf" transform="translate(88,394) rotate(196) scale(1.7)" />
          <use href="#gb-leaf" transform="translate(112,334) rotate(-36) scale(1.8)" />
          <use href="#gb-leaf" transform="translate(142,266) rotate(198) scale(1.6)" />
          <use href="#gb-leaf" transform="translate(166,198) rotate(-40) scale(1.5)" />
          <use href="#gb-tendril" transform="translate(168,442) rotate(-20) scale(1.6)" />
          <use href="#gb-tendril" transform="translate(60,296) rotate(152) scale(1.4)" />

          <g data-testid="floral-blooms" style={{ color: 'var(--accent)' }} opacity="0.55">
            <use href="#gb-bloom" transform="translate(202,96) scale(1.15)" />
            <use href="#gb-bloom" transform="translate(110,378) scale(0.82)" />
            <use href="#gb-bud" transform="translate(168,322) rotate(-30) scale(1.7)" />
          </g>
        </g>
      </svg>
    </div>
  )
}
