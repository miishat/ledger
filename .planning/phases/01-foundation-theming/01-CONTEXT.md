# Phase 1: Foundation & Theming - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish Vite project, global routing, PWA shell, and dual-theme switching architecture.

</domain>

<decisions>
## Implementation Decisions

### Global Navigation Layout
- **D-01:** Navigation adapts to device. Desktop/Tablet: Fixed Left Sidebar. Mobile: Bottom Tab Bar for primary modules, top header/slide-out for secondary settings & theme toggle.
- **D-02:** Mobile Bottom Tab Bar overflow: Show top 4 modules as tabs, put the rest in a 'More' menu.
- **D-03:** Top Header behavior: Hide on scroll down, reappear on scroll up.
- **D-04:** Routing library: TanStack Router.

### Theme Storage & Implementation
- **D-05:** Theme/Global State Management: Zustand global store with persist middleware.
- **D-06:** Theme CSS/DOM implementation: CSS variables attached to `[data-theme='...']` attributes on the `<html>` element.
- **D-07:** Theme toggle transition: Hard cut (no smooth cross-fade) to keep the 'tactical' snappy feel.
- **D-08:** Default theme: Always default to the Tactical Monospace theme on first load (do not use OS preference).

### PWA Configuration & Offline Strategy
- **D-09:** Caching strategy: Cache all static assets aggressively for a fully offline local-first experience.
- **D-10:** Update prompting: Show a non-intrusive toast notification with a 'Refresh' button.
- **D-11:** Manifest icons: Generate automatically during build using `vite-plugin-pwa` assets generator.
- **D-12:** iOS Installation: Detect iOS Safari and show a custom 'Install Guide' modal (Share -> Add to Home Screen).

### Codebase Directory Structure
- **D-13:** Folder architecture: Feature-based architecture (`src/features/...`).
- **D-14:** Shared components: `src/components/ui/`.
- **D-15:** File naming: PascalCase for React components (e.g., `BentoGrid.tsx`).

### Tailwind Configuration & Styling Rules
- **D-16:** Tailwind usage: Strict utility classes directly in JSX.
- **D-17:** Class merging: Use `tailwind-merge` combined with `clsx` (e.g., a `cn` utility).
- **D-18:** Color definition: HSL variables in global CSS mapped in `tailwind.config.js`.
- **D-19:** Font loading: Use Fontsource npm packages to self-host the fonts.

### the agent's Discretion
None — we discussed all primary structural and stylistic choices.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None (greenfield phase)

### Established Patterns
- None (greenfield phase)

### Integration Points
- None (greenfield phase)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-Foundation & Theming*
*Context gathered: 2026-06-18*
