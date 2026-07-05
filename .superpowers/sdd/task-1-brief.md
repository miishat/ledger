### Task 1: OverlayBackdrop component + ToolSwitcher blur (W5)

**Files:**
- Create: `src/components/ui/OverlayBackdrop.tsx`
- Modify: `src/components/planner/ToolSwitcher.tsx`
- Test: `src/components/ui/OverlayBackdrop.test.tsx`

**Interfaces:**
- Produces: `OverlayBackdrop: React.FC<{ onClose: () => void; className?: string }>` — a `fixed inset-0` blurred backdrop rendered as a sibling BEHIND anchored popups (z-20; popup content must use z-30+). Tasks 2, 4, 16 consume it.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/OverlayBackdrop.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { OverlayBackdrop } from './OverlayBackdrop'

describe('OverlayBackdrop', () => {
  it('renders a blurred backdrop and calls onClose when clicked', () => {
    const onClose = vi.fn()
    const { getByTestId } = render(<OverlayBackdrop onClose={onClose} />)
    const el = getByTestId('overlay-backdrop')
    expect(el.className).toContain('backdrop-blur-md')
    expect(el.className).toContain('bg-black/50')
    fireEvent.click(el)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/OverlayBackdrop.test.tsx`
Expected: FAIL (cannot resolve `./OverlayBackdrop`)

- [ ] **Step 3: Write the component**

```tsx
// src/components/ui/OverlayBackdrop.tsx
import React from 'react'

interface OverlayBackdropProps {
  onClose: () => void
  className?: string
}

/** Shared backdrop for click-opened popups and dropdowns. Matches the
 *  CompensationModal overlay treatment (bg-black/50 + backdrop-blur-md).
 *  Render as a sibling BEFORE the popup panel; panel needs z-30 or higher. */
export const OverlayBackdrop: React.FC<OverlayBackdropProps> = ({ onClose, className = '' }) => (
  <div
    data-testid="overlay-backdrop"
    className={`fixed inset-0 z-20 bg-black/50 backdrop-blur-md animate-fade-in ${className}`}
    onClick={onClose}
    aria-hidden="true"
  />
)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/OverlayBackdrop.test.tsx`
Expected: PASS

- [ ] **Step 5: Adopt in ToolSwitcher**

In `src/components/planner/ToolSwitcher.tsx`, import it and wrap the open menu. Replace the `{open && ( <div role="menu" ...> ... </div> )}` block with:

```tsx
{open && (
  <>
    <OverlayBackdrop onClose={() => setOpen(false)} />
    <div
      role="menu"
      className="absolute left-0 top-full mt-2 z-30 w-72 max-h-[70vh] overflow-y-auto themed-card border border-border rounded-lg shadow-xl p-2 flex flex-col gap-1"
    >
      {/* existing group/tool mapping stays unchanged */}
    </div>
  </>
)}
```

Add `import { OverlayBackdrop } from '../ui/OverlayBackdrop'`. The existing window `pointerdown` listener stays (it also handles Escape); the backdrop click closes via `onClose`. Note the trigger button sits BELOW the backdrop; that is fine because clicking anywhere outside the menu should close it.

- [ ] **Step 6: Verify in preview**

Start dev server, navigate to `/planner/mortgage`, click the tool-title dropdown. Expected: background blurs (like the compensation edit-package modal), menu is sharp, clicking the blurred area closes.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/OverlayBackdrop.tsx src/components/ui/OverlayBackdrop.test.tsx src/components/planner/ToolSwitcher.tsx
git commit -m "feat: shared OverlayBackdrop with blur, adopted by planner ToolSwitcher"
```

