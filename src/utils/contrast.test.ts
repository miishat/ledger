import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { contrastRatio } from './contrast'

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8')

/** Pulls every theme block out of index.css so a newly added theme is covered
 *  by this test automatically instead of silently shipping unreadable text. */
function themeBlocks(): Array<{ name: string; tokens: Record<string, string> }> {
  const blocks: Array<{ name: string; tokens: Record<string, string> }> = []
  const re = /(:root|\[data-theme='([a-z]+)'\])\s*\{([^}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    const name = m[2] ?? 'root'
    const tokens: Record<string, string> = {}
    for (const line of m[3].split(';')) {
      const kv = line.match(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*$/)
      if (kv) tokens[kv[1]] = kv[2]
    }
    if (tokens['bg-primary']) blocks.push({ name, tokens })
  }
  return blocks
}

describe('theme token contrast', () => {
  const blocks = themeBlocks()

  it('finds every theme defined in index.css', () => {
    expect(blocks.length).toBeGreaterThanOrEqual(6)
  })

  it.each(blocks.map((b) => [b.name, b] as const))(
    '%s meets AA for accent text on the primary background',
    (_name, block) => {
      expect(contrastRatio(block.tokens.accent, block.tokens['bg-primary'])).toBeGreaterThanOrEqual(4.5)
    },
  )

  it.each(blocks.map((b) => [b.name, b] as const))(
    '%s meets AA for secondary text on the primary background',
    (_name, block) => {
      expect(contrastRatio(block.tokens['text-secondary'], block.tokens['bg-primary'])).toBeGreaterThanOrEqual(4.5)
    },
  )

  it.each(blocks.map((b) => [b.name, b] as const))(
    '%s meets AA for primary text on the primary background',
    (_name, block) => {
      expect(contrastRatio(block.tokens['text-primary'], block.tokens['bg-primary'])).toBeGreaterThanOrEqual(4.5)
    },
  )
})
