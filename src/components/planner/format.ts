export function formatMoney(n: number): string {
  const rounded = Math.round(n)
  const abs = Math.abs(rounded).toLocaleString('en-CA')
  return `${rounded < 0 ? '-' : ''}$${abs}`
}
