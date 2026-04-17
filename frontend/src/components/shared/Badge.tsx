import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  count: number
  maxDefault?: number
}

export function Badge({ count, maxDefault = 99, className, ...props }: BadgeProps) {
  if (count <= 0) return null

  const displayCount = count > maxDefault ? `${maxDefault}+` : count
 
  return (
    <div 
      className={cn(
        "flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-black flex-shrink-0",
        className
      )}
      {...props}
    >
      {displayCount}
    </div>
  )
}