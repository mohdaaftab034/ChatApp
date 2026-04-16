import React from 'react'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-page relative px-4">
      <div className="mb-8 flex items-center justify-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-accent text-accent-foreground font-bold">
          C
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">ChatApp</span>
      </div>
      
      <div className="w-full max-w-[400px] rounded-xl border border-border bg-surface p-8 shadow-sm dark:bg-[#161616]">
        {children}
      </div>
    </div>
  )
}
