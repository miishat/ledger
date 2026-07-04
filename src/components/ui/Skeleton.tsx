import React from 'react'

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-bg-primary/60 border border-border ${className}`} aria-hidden="true" />
)
