import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, ...props }, ref) => {
    const [show, setShow] = useState(false)

    return (
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={cn(
            "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 pr-10",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-0 top-0 h-full px-3 py-2 text-text-tertiary hover:text-foreground flex items-center justify-center p-0 bg-transparent"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'
