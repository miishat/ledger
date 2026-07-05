import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  message: string
  hint?: string
  action?: { label: string; onClick: () => void }
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, message, hint, action }) => (
  <div className="flex flex-col items-center gap-2 py-8 text-center">
    {Icon && <Icon className="w-6 h-6 text-text-secondary" />}
    <p className="text-[15px] font-medium text-text-primary">{message}</p>
    {hint && <p className="text-[13px] text-text-secondary">{hint}</p>}
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="mt-1 px-3 py-1.5 rounded-md text-[13px] font-medium border border-accent text-accent bg-accent/10 hover:opacity-90 transition-opacity"
      >
        {action.label}
      </button>
    )}
  </div>
)
