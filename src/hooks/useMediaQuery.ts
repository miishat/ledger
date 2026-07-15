import { useEffect, useState } from 'react'

/** Reactive matchMedia. SSR-safe (returns false when window is absent). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && 'matchMedia' in window
      ? window.matchMedia(query).matches
      : false
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent | { matches: boolean }) => setMatches(e.matches)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a new matchMedia query on query-string change, not a render-loop
    setMatches(mql.matches)
    mql.addEventListener('change', onChange as (e: MediaQueryListEvent) => void)
    return () => mql.removeEventListener('change', onChange as (e: MediaQueryListEvent) => void)
  }, [query])

  return matches
}

export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 768px)')
