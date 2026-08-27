import { readFileSync } from 'node:fs'
import { URL as NodeURL } from 'node:url'
import { THEME_BACKGROUNDS, type AppTheme } from './store/useThemeStore'

// Read the stylesheet as text, not through jsdom. jsdom does not resolve
// custom properties declared in a stylesheet (getComputedStyle returns ''),
// so any assertion made through the CSSOM here would pass no matter what the
// file said. Parsing the source is the only way this guard can actually fail.
//
// Explicitly import URL from node:url rather than using the ambient global:
// this suite runs under the jsdom test environment, which replaces the
// global URL constructor with its own implementation. fs.readFileSync only
// accepts a URL created by Node's own url module; handed a jsdom URL
// instance it throws "TypeError: The URL must be of scheme file" regardless
// of the actual protocol, because Node checks the object's internal brand,
// not its string value.
const css = readFileSync(new NodeURL('./index.css', import.meta.url), 'utf8')

const THEMES: AppTheme[] = ['geometric', 'tactical', 'luxury', 'aurora', 'glass', 'nouveau']

function blockFor(theme: string): string {
  const marker = `[data-theme='${theme}'] {`
  const start = css.indexOf(marker)
  if (start === -1) throw new Error(`no [data-theme='${theme}'] block in src/index.css`)
  const end = css.indexOf('\n}', start)
  if (end === -1) throw new Error(`unterminated [data-theme='${theme}'] block in src/index.css`)
  return css.slice(start, end)
}

function tokensIn(theme: string): string[] {
  return [...blockFor(theme).matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1])
}

// Geometric is the reference set: it is the oldest block and every other
// theme has always mirrored it. A theme may declare extra tokens of its own
// (nouveau adds --ornament and --card-gradient); it may not be missing one.
const REQUIRED = tokensIn('geometric')

describe('theme token blocks', () => {
  it.each(THEMES)('%s declares every token geometric declares', (theme) => {
    const present = tokensIn(theme)
    expect(REQUIRED.filter((t) => !present.includes(t))).toEqual([])
  })

  it.each(THEMES)('%s declares a color-scheme', (theme) => {
    expect(blockFor(theme)).toMatch(/color-scheme:\s*(light|dark)/)
  })

  // THEME_BACKGROUNDS exists only because jsdom cannot read the stylesheet,
  // which means nothing but this test stops the two copies drifting apart.
  it.each(THEMES)('%s THEME_BACKGROUNDS entry matches its --bg-primary', (theme) => {
    const match = /--bg-primary:\s*(#[0-9a-fA-F]{3,8})/.exec(blockFor(theme))
    expect(match).not.toBeNull()
    expect(THEME_BACKGROUNDS[theme].toLowerCase()).toBe(match![1].toLowerCase())
  })
})
