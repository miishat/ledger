import { useState, useEffect } from 'react'
import { WidgetWrapper } from '../dashboard/WidgetWrapper'
import { useCompensationStore, generateVestEvents } from '../../store/useCompensationStore'
import type { VestingPreset, VestingFrequency } from '../../store/useCompensationStore'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

export function EquityVestingWidget() {
  const { primaryPackage, updateRSUGrant } = useCompensationStore()

  const firstGrant = primaryPackage.rsuGrants[0]
  const [selectedPreset, setSelectedPreset] = useState<VestingPreset>(
    firstGrant?.vestingSchedule.preset || '4yr-1yr-cliff'
  )
  const [customTotalMonths, setCustomTotalMonths] = useState(
    firstGrant?.vestingSchedule.totalVestMonths.toString() || '48'
  )
  const [customCliffMonths, setCustomCliffMonths] = useState(
    firstGrant?.vestingSchedule.cliffMonths.toString() || '12'
  )
  const [customFrequency, setCustomFrequency] = useState<VestingFrequency>(
    firstGrant?.vestingSchedule.frequency || 'monthly'
  )

  useEffect(() => {
    if (firstGrant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPreset(firstGrant.vestingSchedule.preset)
      setCustomTotalMonths(firstGrant.vestingSchedule.totalVestMonths.toString())
      setCustomCliffMonths(firstGrant.vestingSchedule.cliffMonths.toString())
      setCustomFrequency(firstGrant.vestingSchedule.frequency)
    }
  }, [firstGrant])

  if (primaryPackage.rsuGrants.length === 0) {
    return (
      <WidgetWrapper title="Equity Vesting Schedule">
        <div className="flex flex-col items-center justify-center h-[280px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-6">
          <p className="text-[16px] font-semibold text-[var(--color-text-primary)]">No RSU Grants Added</p>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-2 text-center">
            Add RSU details in the compensation modal to see your vesting timeline.
          </p>
        </div>
      </WidgetWrapper>
    )
  }

  // Merge events
  const eventMap = new Map<number, { monthIndex: number, vestValue: number }>()
  primaryPackage.rsuGrants.forEach((grant) => {
    const events = generateVestEvents(grant)
    events.forEach(e => {
      const existing = eventMap.get(e.monthIndex)
      if (existing) {
        existing.vestValue += e.vestValue
      } else {
        eventMap.set(e.monthIndex, { monthIndex: e.monthIndex, vestValue: e.vestValue })
      }
    })
  })

  const mergedEvents = Array.from(eventMap.values())
    .sort((a, b) => a.monthIndex - b.monthIndex)

  const chartData = mergedEvents.map((e, i, arr) => {
    const cum = arr.slice(0, i + 1).reduce((sum, item) => sum + item.vestValue, 0)
    return { ...e, cumulativeVested: cum }
  })

  // Find first cliff month > 0 across grants
  const firstCliff = primaryPackage.rsuGrants.find(g => g.vestingSchedule.cliffMonths > 0)?.vestingSchedule.cliffMonths

  const handlePresetChange = (preset: VestingPreset) => {
    setSelectedPreset(preset)
    if (!firstGrant) return

    if (preset === '4yr-1yr-cliff') {
      updateRSUGrant(firstGrant.id, {
        vestingSchedule: { preset, totalVestMonths: 48, cliffMonths: 12, frequency: 'quarterly' }
      })
    } else if (preset === '3yr-no-cliff') {
      updateRSUGrant(firstGrant.id, {
        vestingSchedule: { preset, totalVestMonths: 36, cliffMonths: 0, frequency: 'quarterly' }
      })
    } else {
      updateRSUGrant(firstGrant.id, {
        vestingSchedule: { 
          preset, 
          totalVestMonths: parseInt(customTotalMonths, 10), 
          cliffMonths: parseInt(customCliffMonths, 10), 
          frequency: customFrequency 
        }
      })
    }
  }

  const handleCustomChange = (updates: { total?: string, cliff?: string, freq?: VestingFrequency }) => {
    if (!firstGrant) return
    const total = updates.total ?? customTotalMonths
    const cliff = updates.cliff ?? customCliffMonths
    const freq = updates.freq ?? customFrequency

    if (updates.total) setCustomTotalMonths(updates.total)
    if (updates.cliff) setCustomCliffMonths(updates.cliff)
    if (updates.freq) setCustomFrequency(updates.freq)

    updateRSUGrant(firstGrant.id, {
      vestingSchedule: {
        preset: 'custom',
        totalVestMonths: parseInt(total, 10) || 1,
        cliffMonths: parseInt(cliff, 10) || 0,
        frequency: freq
      }
    })
  }

  const btnClass = (active: boolean) => 
    `min-h-[44px] px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${active ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`
  const inputClass = "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md p-2 text-[14px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
  
  return (
    <WidgetWrapper title="Equity Vesting Schedule">
      <div className="flex flex-col gap-4">
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis 
                dataKey="monthIndex" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} 
                tickFormatter={(v) => `M${v}`} 
              />
              <YAxis 
                yAxisId="left" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} 
                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} 
                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', borderRadius: '8px' }} 
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} 
              />
              {firstCliff && firstCliff > 0 && (
                <ReferenceLine 
                  yAxisId="left" 
                  x={firstCliff} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Cliff', position: 'top', fill: '#ef4444', fontSize: 11 }} 
                />
              )}
              <Bar 
                yAxisId="left" 
                dataKey="vestValue" 
                name="Vest Event" 
                fill="var(--color-accent)" 
                opacity={0.6} 
                radius={[3, 3, 0, 0]} 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="cumulativeVested" 
                name="Cumulative" 
                stroke="var(--color-accent)" 
                strokeWidth={2} 
                dot={false} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-4 border-t border-[var(--color-border)] pt-4">
          <div className="flex flex-wrap gap-2">
            <button
              id="preset-4yr-1yr-cliff"
              onClick={() => handlePresetChange('4yr-1yr-cliff')}
              className={btnClass(selectedPreset === '4yr-1yr-cliff')}
            >
              4-Year with 1-Year Cliff
            </button>
            <button
              id="preset-3yr-no-cliff"
              onClick={() => handlePresetChange('3yr-no-cliff')}
              className={btnClass(selectedPreset === '3yr-no-cliff')}
            >
              3-Year, No Cliff
            </button>
            <button
              id="preset-custom"
              onClick={() => handlePresetChange('custom')}
              className={btnClass(selectedPreset === 'custom')}
            >
              Custom Schedule
            </button>
          </div>

          {selectedPreset === 'custom' && (
            <div className="grid grid-cols-3 gap-4 bg-[var(--color-bg-secondary)] p-4 rounded-md border border-[var(--color-border)]">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-[var(--color-text-secondary)]">Total Vest (months)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customTotalMonths}
                  onChange={(e) => handleCustomChange({ total: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-[var(--color-text-secondary)]">Cliff (months)</label>
                <input
                  type="number"
                  min="0"
                  value={customCliffMonths}
                  onChange={(e) => handleCustomChange({ cliff: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-[var(--color-text-secondary)]">Frequency</label>
                <select
                  value={customFrequency}
                  onChange={(e) => handleCustomChange({ freq: e.target.value as VestingFrequency })}
                  className={inputClass}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </WidgetWrapper>
  )
}
