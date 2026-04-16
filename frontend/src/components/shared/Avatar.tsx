import React from 'react'
import { cn } from '../../lib/utils'

interface AvatarProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  src?: string | null
  fallback?: string
  isOnline?: boolean
  showOnlineDot?: boolean
}

export function Avatar({ 
  size = 'md', 
  src, 
  fallback = '?', 
  isOnline = false,
  showOnlineDot = false,
  className,
  ...props 
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl',
  }
  
  const dotClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3 border-[1.5px]',
    xl: 'w-4 h-4 border-2',
    '2xl': 'w-5 h-5 border-2',
    '3xl': 'w-5 h-5 border-2',
  }

  return (
    <div className="relative inline-block flex-shrink-0">
      <div 
        className={cn(
          "relative flex items-center justify-center rounded-full overflow-hidden bg-raised text-foreground font-medium",
          sizeClasses[size],
          className
        )}
      >
        {src ? (
          <img 
            src={src} 
            alt="Avatar" 
            className="w-full h-full object-cover"
            {...props} 
          />
        ) : (
          <span className="uppercase">{fallback.substring(0, 2)}</span>
        )}
      </div>
      
      {showOnlineDot && isOnline && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-[#22C55E] border-surface border-white dark:border-[#161616]",
            dotClasses[size]
          )}
        />
      )}
    </div>
  )
}
 