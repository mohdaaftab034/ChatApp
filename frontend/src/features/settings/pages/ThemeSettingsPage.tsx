import { ArrowLeft, Check, ChevronRight, Monitor, Moon, Sun } from 'lucide-react'
import { AppShell } from '../../chat/components/layout/AppShell'
import { useUIStore } from '../../../store/uiStore'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/utils'

const modeOptions: Array<{
  id: 'light' | 'dark' | 'system'
  label: string
  description: string
  icon: typeof Sun
}> = [
  {
    id: 'light',
    label: 'Light',
    description: 'Bright layout for daytime use',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Comfortable low-light appearance',
    icon: Moon,
  },
  {
    id: 'system',
    label: 'System default',
    description: 'Automatically follows your device theme',
    icon: Monitor,
  },
]

const colorOptions: Array<{
  id: 'mono' | 'ocean' | 'coral' | 'forest' | 'gold'
  label: string
  description: string
  outBg: string
  outText: string
  inBg: string
  inText: string
}> = [
  {
    id: 'mono',
    label: 'Monochrome',
    description: 'Neutral professional contrast',
    outBg: '#111827',
    outText: '#F9FAFB',
    inBg: '#FFFFFF',
    inText: '#111827',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Cool blues with airy incoming cards',
    outBg: '#0A84FF',
    outText: '#F5FAFF',
    inBg: '#F2F8FF',
    inText: '#0A2342',
  },
  {
    id: 'coral',
    label: 'Coral',
    description: 'Warm energetic reds and soft blush',
    outBg: '#E6554F',
    outText: '#FFF7F7',
    inBg: '#FFF4F3',
    inText: '#5A1F1D',
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Balanced green tones with calm surfaces',
    outBg: '#2E7D32',
    outText: '#F4FFF5',
    inBg: '#F2FBF3',
    inText: '#1B3B1D',
  },
  {
    id: 'gold',
    label: 'Gold',
    description: 'Premium amber highlights and parchment chat',
    outBg: '#C69214',
    outText: '#1A1408',
    inBg: '#FFF8E9',
    inText: '#4E3C0D',
  },
]

export default function ThemeSettingsPage() {
  const navigate = useNavigate()
  const theme = useUIStore((state) => state.theme)
  const accentColor = useUIStore((state) => state.accentColor)
  const setTheme = useUIStore((state) => state.setTheme)
  const setAccentColor = useUIStore((state) => state.setAccentColor)

  return (
    <div className="flex h-screen w-full bg-page">
      <AppShell>
        <div className="relative flex-1 flex max-w-4xl mx-auto w-full h-full p-3 sm:p-4 lg:p-8 pb-20 md:pb-4">
          <div className="flex-1 min-w-0 border border-border bg-surface rounded-2xl p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="space-y-7 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-raised text-foreground hover:bg-surface transition-colors"
                  aria-label="Back to settings"
                >
                  <ArrowLeft size={14} />
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Theme & Colors</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Customize app appearance and chat bubble styles.</p>
                </div>
              </div>

              <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Appearance mode</p>
                  <p className="text-xs text-text-secondary mt-0.5">Choose how the overall interface looks.</p>
                </div>
                {modeOptions.map((option) => {
                  const Icon = option.icon
                  const active = theme === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTheme(option.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-raised transition-colors"
                    >
                      <span className="inline-flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-page text-foreground">
                          <Icon size={15} />
                        </span>
                        <span className="text-left">
                          <span className="block text-sm font-medium text-foreground">{option.label}</span>
                          <span className="block text-xs text-text-secondary truncate">{option.description}</span>
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-2 text-text-secondary">
                        {active ? <Check size={16} className="text-foreground" /> : null}
                        <ChevronRight size={16} />
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Chat color style</p>
                  <p className="text-xs text-text-secondary mt-0.5">Applies to sent and received message backgrounds.</p>
                </div>
                {colorOptions.map((option) => {
                  const active = accentColor === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAccentColor(option.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-raised transition-colors"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center gap-1">
                          <span className="h-6 w-6 rounded-md border border-border" style={{ backgroundColor: option.outBg }} />
                          <span className="h-6 w-6 rounded-md border border-border" style={{ backgroundColor: option.inBg }} />
                        </span>
                        <span className="text-left min-w-0">
                          <span className="block text-sm font-medium text-foreground">{option.label}</span>
                          <span className="block text-xs text-text-secondary truncate">{option.description}</span>
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-2 text-text-secondary">
                        {active ? <Check size={16} className="text-foreground" /> : null}
                        <ChevronRight size={16} />
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-wide text-text-secondary">Message preview</p>
                <div className="mt-3 rounded-xl border border-border bg-page p-3 space-y-2">
                  <div className="flex justify-end">
                    <div
                      className={cn('max-w-[75%] rounded-[16px] rounded-br-sm border px-3 py-2 text-sm')}
                      style={{
                        backgroundColor: 'var(--message-out-bg)',
                        color: 'var(--message-out-text)',
                        borderColor: 'var(--message-out-border)',
                      }}
                    >
                      Sent message preview
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div
                      className={cn('max-w-[75%] rounded-[16px] rounded-bl-sm border px-3 py-2 text-sm')}
                      style={{
                        backgroundColor: 'var(--message-in-bg)',
                        color: 'var(--message-in-text)',
                        borderColor: 'var(--message-in-border)',
                      }}
                    >
                      Received message preview
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}
