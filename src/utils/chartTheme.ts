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
