import { cn } from '../../lib/utils'

interface SkeletonListProps {
  count?: number
  className?: string
}

export function SkeletonList({ count = 3, className }: SkeletonListProps) {
  return (
    <div className={cn("flex flex-col w-full", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 px-3 h-[68px] animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-raised flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-4 bg-raised rounded w-1/3" />
            <div className="h-3 bg-raised rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
