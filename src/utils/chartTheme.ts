/** Shared recharts tooltip styling: themed box AND themed text (recharts
 *  defaults item text to near-black, which is invisible on dark themes). */
export const chartTooltipStyles = {
  contentStyle: {
    backgroundColor: 'var(--dropdown-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    color: 'var(--text-primary)',
  },
  itemStyle: { color: 'var(--text-primary)' },
  labelStyle: { color: 'var(--text-secondary)' },
} as const

/** Theme-defined categorical chart colours, in slice order. */
const BASE_SLICE_COLORS = [
  'var(--accent)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
]

/** Each pass beyond the first mixes the base colour toward white or black, so
 *  a seventh slice reads as a lighter variant rather than an exact repeat of
 *  the first. Five passes give 30 distinct fills before any colour recurs. */
const SLICE_MIXES: ({ toward: string; keep: number } | null)[] = [
  null,
  { toward: '#ffffff', keep: 58 },
  { toward: '#000000', keep: 58 },
  { toward: '#ffffff', keep: 32 },
  { toward: '#000000', keep: 32 },
]

/** Fill for the nth slice of a pie, donut, or its legend swatch. Charts used
 *  to index the base palette with `i % 6`, which handed identical colours to
 *  slices 1 and 7 of any portfolio with more than six holdings. */
export function sliceColor(i: number): string {
  const base = BASE_SLICE_COLORS[i % BASE_SLICE_COLORS.length]
  const mix = SLICE_MIXES[Math.floor(i / BASE_SLICE_COLORS.length) % SLICE_MIXES.length]
  return mix ? `color-mix(in srgb, ${base} ${mix.keep}%, ${mix.toward})` : base
}
