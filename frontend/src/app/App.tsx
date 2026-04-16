import { AppRouter } from './router'
import { useEffect } from 'react'
import { useUIStore } from '../store/uiStore'
import { useSocketSetup } from '../features/chat/hooks/useSocket'
import { useAuthStore } from '../store/authStore'

export function App() {
  const theme = useUIStore((state) => state.theme)
  const accentColor = useUIStore((state) => state.accentColor)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useSocketSetup()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    if (!isAuthenticated) return

    const root = window.document.documentElement
    const accentPalette: Record<string, { accent: string; accentText: string }> = {
      mono: { accent: '#0A0A0A', accentText: '#FFFFFF' },
      ocean: { accent: '#0A84FF', accentText: '#FFFFFF' },
      coral: { accent: '#E6554F', accentText: '#FFFFFF' },
      forest: { accent: '#2E7D32', accentText: '#FFFFFF' },
      gold: { accent: '#C69214', accentText: '#111111' },
    }

    const palette = accentPalette[accentColor] ?? accentPalette.mono
    root.style.setProperty('--accent', palette.accent)
    root.style.setProperty('--accent-text', palette.accentText)
    root.style.setProperty('--unread-badge', palette.accent)
  }, [accentColor, isAuthenticated])

  return <AppRouter />
}

export default App
