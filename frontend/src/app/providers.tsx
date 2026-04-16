import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '../lib/queryClient'
import { useUIStore } from '../store/uiStore'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((state) => state.theme)
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        theme={theme === 'system' ? 'system' : theme} 
        position="bottom-right"
        toastOptions={{
          className: 'bg-white dark:bg-[#161616] border-[#E8E8E8] dark:border-[#2A2A2A] text-[#0A0A0A] dark:text-[#F0F0F0]',
        }}
      />
    </QueryClientProvider>
  )
}
