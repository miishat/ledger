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
import { useCompensationStore, calcTotalComp, calcAnnualBaseSalary, calcAnnualBonus, calcAnnualESPP, calcAnnualRRSP, calcAnnualRSU, generateVestEvents, getBaseSalaryForMonth } from '../../store/useCompensationStore'

interface CompHeroWidgetProps {
  className?: string
}

const COMP_COLORS = {
  baseSalary: 'var(--color-accent)',
  cashBonus: '#10b981', // emerald-500
  espp: '#f59e0b', // amber-500
  rrsp: '#8b5cf6', // violet-500
  rsu: '#ec4899', // pink-500
}

export function CompHeroWidget({ className = '' }: CompHeroWidgetProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-3 shadow-md">
          <p className="font-semibold text-[var(--color-text-primary)] mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex justify-between items-center gap-4 text-[13px] mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-[var(--color-text-secondary)]">{entry.name}</span>
              </div>
              <span className="text-[var(--color-text-primary)] font-medium">
                {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(entry.value)}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center gap-4 text-[13px] mt-2 pt-2 border-t border-[var(--color-border)]">
            <span className="text-[var(--color-text-primary)] font-semibold">Total</span>
            <span className="text-[var(--color-text-primary)] font-bold">
              {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(total)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const { primaryPackage, timeMode, setTimeMode } = useCompensationStore()
  const [view, setView] = useState<'annualized' | 'monthly'>('annualized')

  const totalComp = calcTotalComp(primaryPackage, timeMode)

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

  const baseValue = calcAnnualBaseSalary(primaryPackage, timeMode)
  const bonusValue = calcAnnualBonus(primaryPackage, timeMode)
  const esppValue = calcAnnualESPP(primaryPackage, timeMode)
  const rrspValue = calcAnnualRRSP(primaryPackage, timeMode)
  const rsuValue = calcAnnualRSU(primaryPackage, timeMode)

  const pieData = [
    { name: 'Base Salary', value: baseValue, color: COMP_COLORS.baseSalary },
    { name: 'Bonus', value: bonusValue, color: COMP_COLORS.cashBonus },
    { name: 'Equity (RSU)', value: rsuValue, color: COMP_COLORS.rsu },
    { name: 'ESPP', value: esppValue, color: COMP_COLORS.espp },
    { name: 'RRSP', value: rrspValue, color: COMP_COLORS.rrsp },
  ].filter(d => d.value > 0)

  const today = new Date();
  const targetYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const displayMonths = Array.from({ length: 12 }).map((_, i) => {
    if (timeMode === 'current-year') {
      return {
        label: new Date(targetYear, i, 1).toLocaleString('default', { month: 'short' }),
        monthIndex: i,
        year: targetYear
      }
    } else {
      const date = new Date(targetYear, currentMonth + i, 1);
      return {
        label: date.toLocaleString('default', { month: 'short' }),
        monthIndex: date.getMonth(),
        year: date.getFullYear()
      }
    }
  });

  const monthlyData = displayMonths.map((dm) => {
    let rsuThisMonth = 0
    primaryPackage.rsuGrants.forEach(grant => {
      const events = generateVestEvents(grant, primaryPackage.companyCurrentPrice || 0)
      const eventsThisMonth = events.filter((e: any) => {
        if (!e.date) return false;
        const eventDate = new Date(e.date);
        return eventDate.getMonth() === dm.monthIndex && eventDate.getFullYear() === dm.year;
      })
      rsuThisMonth += eventsThisMonth.reduce((sum, e) => sum + e.vestValue, 0)
    })

    return {
      month: dm.label,
      baseSalary: getBaseSalaryForMonth(primaryPackage, dm.year, dm.monthIndex) / 12,
      bonus: dm.monthIndex === ((primaryPackage.cashBonusMonth || 12) - 1) ? bonusValue : 0, 
      espp: esppValue / 12,
      rrsp: rrspValue / 12,
      rsu: rsuThisMonth,
    }
  })

  return (
    <div className={`bg-[var(--color-bg-secondary)] rounded-lg p-4 shadow-sm flex flex-col border border-[var(--color-border)] ${className}`}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">Total Compensation</h3>
        <div className="flex items-center gap-3">
          {/* Time Mode Toggle */}
          <div className="flex bg-[var(--color-bg-primary)] rounded-md border border-[var(--color-border)] p-1">
            <button
              onClick={() => setTimeMode('current-year')}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${timeMode === 'current-year' ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              Current Year
            </button>
            <button
              onClick={() => setTimeMode('next-1-year')}
              className={`px-3 py-1 rounded-[4px] text-[12px] font-medium transition-colors ${timeMode === 'next-1-year' ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            >
              Next 1 Year
            </button>
          </div>

          {/* View Mode Toggle */}
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
      </div>

      <div className="relative w-full h-[400px]">
        {view === 'annualized' ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={110}
                  outerRadius={135}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => (percent || 0) > 0 ? `${name} ${((percent || 0) * 100).toFixed(0)}%` : ''}
                  labelLine={true}
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
              <span className="text-[24px] font-semibold text-[var(--color-text-primary)]">
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
                content={<CustomTooltip />}
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
