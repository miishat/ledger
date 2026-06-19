import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useCompensationStore, calcTotalComp, calcAnnualBonus, calcAnnualESPP, calcAnnualRRSP, calcAnnualRSU } from '../../store/useCompensationStore'

interface CompHeroWidgetProps {
  className?: string
}

const COMP_COLORS = {
  baseSalary: 'var(--color-accent)',
  cashBonus: '#10b981', // emerald-500
  espp: '#f59e0b', // amber-500
  rrsp: '#8b5cf6', // violet-500
  rsu: '#06b6d4', // cyan-500
}

export function CompHeroWidget({ className = '' }: CompHeroWidgetProps) {
  const { primaryPackage } = useCompensationStore()
  const [view, setView] = useState<'annualized' | 'monthly'>('annualized')

  const totalComp = calcTotalComp(primaryPackage)

  if (totalComp === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-[320px] bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] p-6 ${className}`}>
        <p className="text-[18px] font-semibold text-[var(--color-text-primary)]">No Compensation Data Yet</p>
        <p className="text-[14px] text-[var(--color-text-secondary)] mt-2 text-center max-w-sm">
          Enter your compensation details to see the breakdown.
        </p>
      </div>
    )
  }

  const baseValue = primaryPackage.baseSalary
  const bonusValue = calcAnnualBonus(primaryPackage)
  const esppValue = calcAnnualESPP(primaryPackage)
  const rrspValue = calcAnnualRRSP(primaryPackage)
  const rsuValue = calcAnnualRSU(primaryPackage)

  const pieData = [
    { name: 'Base Salary', value: baseValue, color: COMP_COLORS.baseSalary },
    { name: 'Cash Bonus', value: bonusValue, color: COMP_COLORS.cashBonus },
    { name: 'ESPP Benefit', value: esppValue, color: COMP_COLORS.espp },
    { name: 'RRSP Match', value: rrspValue, color: COMP_COLORS.rrsp },
    { name: 'RSU (1st Yr)', value: rsuValue, color: COMP_COLORS.rsu },
  ].filter(d => d.value > 0)

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyData = months.map((m, i) => {
    // Determine RSU vest for this month (month index 1 to 12)
    // generateVestEvents gives events with monthIndex. We sum them.
    // For simplicity, we just distribute RSU evenly for the first year if no specific grant logic per month is needed for the hero chart,
    // wait, the spec says: "rsu: vest events in that month"
    // So let's calculate RSU exactly
    let rsuThisMonth = 0
    primaryPackage.rsuGrants.forEach(grant => {
      // Assuming grantStartDate is effectively month 0. monthIndex 1..12 correspond to Jan..Dec of first year.
      // We will just use the monthIndex (1-12) for the 12 months.
      const { vestingSchedule, totalGrantValue } = grant
      const { cliffMonths, totalVestMonths, frequency } = vestingSchedule
      const freqMonths = frequency === 'quarterly' ? 3 : 1
      
      const isCliffMonth = i + 1 === cliffMonths
      if (isCliffMonth) {
        rsuThisMonth += totalGrantValue * (cliffMonths / totalVestMonths)
      } else if (i + 1 > cliffMonths && (i + 1 - cliffMonths) % freqMonths === 0) {
        const postCliffMonths = totalVestMonths - cliffMonths
        const postCliffValue = cliffMonths > 0 
          ? totalGrantValue * ((totalVestMonths - cliffMonths) / totalVestMonths)
          : totalGrantValue
        const vestCount = Math.floor(postCliffMonths / freqMonths)
        rsuThisMonth += vestCount > 0 ? postCliffValue / vestCount : 0
      }
    })

    return {
      month: m,
      baseSalary: baseValue / 12,
      bonus: i === 11 ? bonusValue : 0, // Paid in December
      espp: esppValue / 12,
      rrsp: rrspValue / 12,
      rsu: rsuThisMonth,
    }
  })

  return (
    <div className={`bg-[var(--color-bg-secondary)] rounded-lg p-4 shadow-sm flex flex-col border border-[var(--color-border)] ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Total Compensation</h3>
        <div className="flex bg-[var(--color-bg-primary)] rounded-md border border-[var(--color-border)] p-1">
          <button
            onClick={() => setView('annualized')}
            className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${view === 'annualized' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
          >
            Annualized Breakdown
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${view === 'monthly' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
          >
            Monthly Cash Flow View
          </button>
        </div>
      </div>

      <div className="relative w-full h-[280px]">
        {view === 'annualized' ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value),
                    ''
                  ]}
                  contentStyle={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[28px] font-semibold text-[var(--color-text-primary)]">
                {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(totalComp)}
              </span>
              <span className="text-[12px] text-[var(--color-text-secondary)]">Total Annual Compensation</span>
            </div>
          </>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
              <Tooltip 
                formatter={(v: any) => [new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(v), '']} 
                contentStyle={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' }}
                itemStyle={{ color: 'var(--color-text-primary)' }}
              />
              <Bar dataKey="baseSalary" stackId="a" fill={COMP_COLORS.baseSalary} name="Base Salary" />
              <Bar dataKey="bonus" stackId="a" fill={COMP_COLORS.cashBonus} name="Bonus" />
              <Bar dataKey="espp" stackId="a" fill={COMP_COLORS.espp} name="ESPP" />
              <Bar dataKey="rrsp" stackId="a" fill={COMP_COLORS.rrsp} name="RRSP" />
              <Bar dataKey="rsu" stackId="a" fill={COMP_COLORS.rsu} name="RSU" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
