export const LAST_SEEN_VERSION_KEY = 'ledger-last-seen-version'

/** Show once per version change; never on a brand-new install. */
export function shouldShowWhatsNew(stored: string | null, current: string): boolean {
  return stored !== null && stored !== current
}
