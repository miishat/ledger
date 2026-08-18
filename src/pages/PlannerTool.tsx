import React from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getTool } from '../components/planner/toolRegistry'
import { PLANNER_TOOL_COMPONENTS } from '../components/planner/toolComponents'
import { ToolSwitcher } from '../components/planner/ToolSwitcher'
import { ToolInfoButton } from '../components/planner/ToolInfoButton'

export const PlannerTool: React.FC = () => {
  const { toolId } = useParams()
  const tool = getTool(toolId)
  if (!tool) return <Navigate to="/planner" replace />
  const Component = PLANNER_TOOL_COMPONENTS[tool.id]
  if (!Component) return <Navigate to="/planner" replace />
  return (
    <div className="flex flex-col gap-6 w-full min-h-full animate-fade-in">
      <header className="flex items-center gap-2">
        <Link
          to="/planner"
          aria-label="Back to Planner"
          className="text-[24px] font-semibold text-text-secondary hover:text-accent transition-colors"
        >
          Planner
        </Link>
        <span className="text-[24px] text-text-secondary">/</span>
        <ToolSwitcher current={tool} />
        <ToolInfoButton tool={tool} />
      </header>
      <Component />
    </div>
  )
}
