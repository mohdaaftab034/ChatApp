import React from 'react'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center h-full w-full", className)}>
      <div className="mb-4 text-text-tertiary flex items-center justify-center w-10 h-10">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary mb-4 max-w-[280px]">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
