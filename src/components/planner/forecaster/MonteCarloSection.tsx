import React from 'react'
import type { LumpSum } from '../../../utils/finance/forecast'

interface MonteCarloSectionProps {
  startBalance: number
  monthlySavings: number
  years: number
  meanReturnPct: number
  stdDevPct: number
  stepUpPct: number
  lumpSums: LumpSum[]
  target: number
  onStdDevChange: (v: number) => void
}

export const MonteCarloSection: React.FC<MonteCarloSectionProps> = () => {
  // Task 8: Monte Carlo simulation section (stub for Task 7)
  return <div />
}
