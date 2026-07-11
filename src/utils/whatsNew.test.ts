import { shouldShowWhatsNew } from './whatsNew'

describe('shouldShowWhatsNew', () => {
  it('does not show on first ever visit (no stored version)', () => {
    expect(shouldShowWhatsNew(null, '0.3.0-beta')).toBe(false)
  })
  it('shows when the stored version differs', () => {
    expect(shouldShowWhatsNew('0.2.0-beta', '0.3.0-beta')).toBe(true)
  })
  it('does not show when versions match', () => {
    expect(shouldShowWhatsNew('0.3.0-beta', '0.3.0-beta')).toBe(false)
  })
})
