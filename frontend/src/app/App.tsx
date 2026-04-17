import { AppRouter } from './router'
import { useEffect } from 'react'
import { useUIStore } from '../store/uiStore'
import { useSocketSetup } from '../features/chat/hooks/useSocket'
import { useAuthStore } from '../store/authStore'
import { buildAutoUnlockSecret, tryAutoUnlockKeyring } from '../lib/e2ee'

type ResolvedMode = 'light' | 'dark'

type ThemePalette = {
  accent: string
  accentText: string
  unreadBadge: string
  messageOutBg: string
  messageOutText: string
  messageOutBorder: string
  messageInBg: string
  messageInText: string
  messageInBorder: string
}

const PALETTES: Record<ResolvedMode, Record<'mono' | 'ocean' | 'coral' | 'forest' | 'gold', ThemePalette>> = {
  light: {
    mono: {
      accent: '#171717',
      accentText: '#FFFFFF',
      unreadBadge: '#171717',
      messageOutBg: '#111827',
      messageOutText: '#F9FAFB',
      messageOutBorder: '#111827',
      messageInBg: '#FFFFFF',
      messageInText: '#111827',
      messageInBorder: '#E5E7EB',
    },
    ocean: {
      accent: '#0A84FF',
      accentText: '#FFFFFF',
      unreadBadge: '#0A84FF',
      messageOutBg: '#0A84FF',
      messageOutText: '#F5FAFF',
      messageOutBorder: '#0A84FF',
      messageInBg: '#F2F8FF',
      messageInText: '#0A2342',
      messageInBorder: '#CDE4FF',
    },
    coral: {
      accent: '#E6554F',
      accentText: '#FFFFFF',
      unreadBadge: '#E6554F',
      messageOutBg: '#E6554F',
      messageOutText: '#FFF7F7',
      messageOutBorder: '#E6554F',
      messageInBg: '#FFF4F3',
      messageInText: '#5A1F1D',
      messageInBorder: '#FFD7D4',
    },
    forest: {
      accent: '#2E7D32',
      accentText: '#FFFFFF',
      unreadBadge: '#2E7D32',
      messageOutBg: '#2E7D32',
      messageOutText: '#F4FFF5',
      messageOutBorder: '#2E7D32',
      messageInBg: '#F2FBF3',
      messageInText: '#1B3B1D',
      messageInBorder: '#CDE8CF',
    },
    gold: {
      accent: '#C69214',
      accentText: '#111111',
      unreadBadge: '#C69214',
      messageOutBg: '#C69214',
      messageOutText: '#1A1408',
      messageOutBorder: '#C69214',
      messageInBg: '#FFF8E9',
      messageInText: '#4E3C0D',
      messageInBorder: '#F2D89B',
    },
  },
  dark: {
    mono: {
      accent: '#FFFFFF',
      accentText: '#0A0A0A',
      unreadBadge: '#FFFFFF',
      messageOutBg: '#F3F4F6',
      messageOutText: '#111827',
      messageOutBorder: '#F3F4F6',
      messageInBg: '#171A20',
      messageInText: '#E5E7EB',
      messageInBorder: '#2F3642',
    },
    ocean: {
      accent: '#55B2FF',
      accentText: '#06213B',
      unreadBadge: '#55B2FF',
      messageOutBg: '#1A6CB8',
      messageOutText: '#EAF6FF',
      messageOutBorder: '#2A84D6',
      messageInBg: '#121C2A',
      messageInText: '#D6E8F9',
      messageInBorder: '#244562',
    },
    coral: {
      accent: '#FF8B84',
      accentText: '#3A0E0C',
      unreadBadge: '#FF8B84',
      messageOutBg: '#B64843',
      messageOutText: '#FFECEC',
      messageOutBorder: '#D95F59',
      messageInBg: '#2A1716',
      messageInText: '#FFD8D6',
      messageInBorder: '#603433',
    },
    forest: {
      accent: '#64C66A',
      accentText: '#0D2A10',
      unreadBadge: '#64C66A',
      messageOutBg: '#2D7A33',
      messageOutText: '#EDFFEE',
      messageOutBorder: '#40984A',
      messageInBg: '#15251A',
      messageInText: '#D8F1DB',
      messageInBorder: '#33563B',
    },
    gold: {
      accent: '#E4B64C',
      accentText: '#2A1E05',
      unreadBadge: '#E4B64C',
      messageOutBg: '#9D7420',
      messageOutText: '#FFF5DD',
      messageOutBorder: '#BA8D2E',
      messageInBg: '#282010',
      messageInText: '#F4E0AF',
      messageInBorder: '#5A4923',
    },
  },
}

function getResolvedMode(theme: 'light' | 'dark' | 'system'): ResolvedMode {
  if (theme === 'light' || theme === 'dark') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function App() {
  const theme = useUIStore((state) => state.theme)
  const accentColor = useUIStore((state) => state.accentColor)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userId = useAuthStore((state) => state.user?.id)
  const token = useAuthStore((state) => state.token)
  const refreshToken = useAuthStore((state) => state.refreshToken)

  useSocketSetup()

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyThemeClass = () => {
      const resolved = getResolvedMode(theme)
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
    }

    applyThemeClass()

    if (theme !== 'system') {
      return
    }

    const listener = () => applyThemeClass()
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [theme])

  useEffect(() => {
    if (!isAuthenticated) return

    const autoUnlockSecret = buildAutoUnlockSecret({ userId, token, refreshToken })
    if (!autoUnlockSecret) return

    void tryAutoUnlockKeyring(autoUnlockSecret)
  }, [isAuthenticated, userId, token, refreshToken])

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyPalette = () => {
      const resolvedMode = getResolvedMode(theme)
      const palette = PALETTES[resolvedMode][accentColor] ?? PALETTES[resolvedMode].mono

      root.style.setProperty('--accent', palette.accent)
      root.style.setProperty('--accent-text', palette.accentText)
      root.style.setProperty('--unread-badge', palette.unreadBadge)
      root.style.setProperty('--message-out-bg', palette.messageOutBg)
      root.style.setProperty('--message-out-text', palette.messageOutText)
      root.style.setProperty('--message-out-border', palette.messageOutBorder)
      root.style.setProperty('--message-in-bg', palette.messageInBg)
      root.style.setProperty('--message-in-text', palette.messageInText)
      root.style.setProperty('--message-in-border', palette.messageInBorder)
    }

    applyPalette()

    if (theme !== 'system') {
      return
    }

    const listener = () => applyPalette()
    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [accentColor, theme, isAuthenticated])

  return <AppRouter />
}

export default App
