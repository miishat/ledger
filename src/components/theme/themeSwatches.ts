import type { AppTheme } from '../../store/useThemeStore'

export interface ThemeSwatch {
  name: string
  bg: string
  accent: string
  headerBg: string
  light?: boolean
  spark: string
}

// Swatch colors mirror each theme's --bg-primary / --accent in index.css.
// headerBg is a neutral "app header" tone one step off the theme bg.
export const SWATCHES: Record<AppTheme, ThemeSwatch> = {
  geometric: { name: 'Geometric Light', bg: '#ffffff', accent: '#3b82f6', headerBg: '#f3f4f6', light: true, spark: '0,14 12,10 24,12 36,6 48,8 60,2' },
  tactical: { name: 'Tactical Dark', bg: '#0a0a0a', accent: '#10b981', headerBg: '#1a1a1a', spark: '0,12 12,14 24,8 36,10 48,4 60,6' },
  luxury: { name: 'Luxury Dark', bg: '#000000', accent: '#d4a853', headerBg: '#151515', spark: '0,10 12,6 24,12 36,4 48,10 60,3' },
  aurora: { name: 'Aurora Gradient', bg: '#090d16', accent: '#34d399', headerBg: '#111827', spark: '0,13 12,9 24,11 36,5 48,9 60,4' },
  glass: { name: 'Glassmorphism', bg: '#0b0910', accent: '#22d3ee', headerBg: '#17141f', spark: '0,12 12,8 24,13 36,6 48,9 60,3' },
  nouveau: { name: 'Gilded Bloom', bg: '#FDF6EA', accent: '#2F6B5E', headerBg: '#F5EDDD', light: true, spark: '0,13 12,11 24,7 36,9 48,4 60,2' },
}
