import React from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getTool } from '../components/planner/toolRegistry'

export const PlannerTool: React.FC = () => {
  const { toolId } = useParams()
  const tool = getTool(toolId)
  if (!tool) return <Navigate to="/planner" replace />
  const Component = tool.component
  return (
    <div className="flex flex-col gap-6 w-full h-full p-6 animate-fade-in">
      <header className="flex items-center gap-3">
        <Link to="/planner" aria-label="Back to Planner" className="text-text-secondary hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-[24px] font-semibold text-text-primary">{tool.name}</h1>
      </header>
      <Component />
    </div>
  )
}
