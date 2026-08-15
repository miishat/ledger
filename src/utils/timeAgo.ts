/** Short relative age for a timestamp, for example "5 min ago". Beyond a month
 *  the calendar date is more useful than a count, and an unparseable timestamp
 *  yields an empty string so a caller can render nothing rather than "NaN". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.floor((now.getTime() - then) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days <= 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return iso.slice(0, 10)
}
