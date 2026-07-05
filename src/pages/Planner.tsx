import React from 'react'
import { Link } from 'react-router-dom'
import { BentoGrid } from '../components/dashboard/BentoGrid'
import { PLANNER_GROUPS, PLANNER_TOOLS } from '../components/planner/toolRegistry'

export const Planner: React.FC = () => (
  <div className="flex flex-col gap-8 w-full h-full p-6 animate-fade-in">
    <header>
      <h1 className="text-[24px] font-semibold text-text-primary">Planner</h1>
      <p className="text-[14px] text-text-secondary mt-1">
        Financial tools and calculators — every input is saved automatically.
      </p>
    </header>
    {PLANNER_GROUPS.map((group) => {
      const tools = PLANNER_TOOLS.filter((t) => t.group === group)
      if (tools.length === 0) return null
      return (
        <section key={group} className="flex flex-col gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-secondary">{group}</h2>
          <BentoGrid>
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.id}
                  to={`/planner/${tool.id}`}
                  className="themed-card rounded-lg p-4 flex flex-col gap-2 hover:border-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-accent" />
                    <h3 className="text-[16px] font-semibold text-text-primary">{tool.name}</h3>
                  </div>
                  <p className="text-[13px] text-text-secondary">{tool.description}</p>
                </Link>
              )
            })}
          </BentoGrid>
        </section>
      )
    })}
  </div>
)
