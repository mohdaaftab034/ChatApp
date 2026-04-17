import { useEffect, useState } from 'react'
import { AppShell } from '../../chat/components/layout/AppShell'
import { User, Shield, Bell, Palette, LogOut, Menu, X, ChevronRight, ArrowLeft } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useUIStore } from '../../../store/uiStore'
import { useAuthStore } from '../../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getMyProfileApi, updateMyProfileApi } from '../../profile/api/profile.api'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('theme')
  const [privacyDetailPage, setPrivacyDetailPage] = useState<'lastSeen' | 'profilePhoto' | null>(null)
  const logout = useAuthStore((state) => state.logout)
  const updateUser = useAuthStore((state) => state.updateUser)
  const navigate = useNavigate()
  const isMobileSidebarOpen = useUIStore((state) => state.isMobileSidebarOpen)
  const toggleMobileSidebar = useUIStore((state) => state.toggleMobileSidebar)

  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [accountForm, setAccountForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    headline: '',
    bio: '',
    location: '',
    department: '',
    role: '',
    website: '',
    linkedin: '',
    x: '',
    status: 'online',
  })

  const [privacySettings, setPrivacySettings] = useState({
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    readReceipts: true,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    messageSounds: true,
    desktopNotifications: true,
    muteAll: false,
  })

  useEffect(() => {
    async function loadAccount() {
      try {
        const profile = await getMyProfileApi()
        setAccountForm({
          name: profile.name || '',
          username: profile.username || '',
          email: profile.email || '',
          phone: profile.phone || '',
          headline: profile.headline || '',
          bio: profile.bio || '',
          location: profile.location || '',
          department: profile.department || '',
          role: profile.role || '',
          website: profile.social.website || '',
          linkedin: profile.social.linkedin || '',
          x: profile.social.x || '',
          status: profile.status,
        })
      } catch {
        toast.error('Failed to load account settings')
      }
    }

    const storedPrivacy = window.localStorage.getItem('chat-privacy-settings')
    if (storedPrivacy) {
      setPrivacySettings(JSON.parse(storedPrivacy))
    }

    const storedNotifications = window.localStorage.getItem('chat-notification-settings')
    if (storedNotifications) {
      setNotificationSettings(JSON.parse(storedNotifications))
    }

    loadAccount()
  }, [])

  const updateAccountField = (field: keyof typeof accountForm, value: string) => {
    setAccountForm((previous) => ({ ...previous, [field]: value }))
  }

  const saveAccountSettings = async () => {
    setIsSavingAccount(true)

    try {
      const updated = await updateMyProfileApi({
        name: accountForm.name,
        username: accountForm.username,
        email: accountForm.email,
        phone: accountForm.phone,
        headline: accountForm.headline,
        bio: accountForm.bio,
        location: accountForm.location,
        department: accountForm.department,
        jobTitle: accountForm.role,
        website: accountForm.website,
        linkedin: accountForm.linkedin,
        x: accountForm.x,
        status: accountForm.status,
      })

      updateUser({
        name: updated.name,
        username: updated.username,
        email: updated.email,
        avatar: updated.avatar,
        bio: updated.bio,
        status: updated.status,
      })

      toast.success('Account settings saved')
    } catch {
      toast.error('Failed to save account settings')
    } finally {
      setIsSavingAccount(false)
    }
  }

  const updatePrivacy = (partial: Partial<typeof privacySettings>) => {
    setPrivacySettings((previous) => {
      const next = { ...previous, ...partial }
      window.localStorage.setItem('chat-privacy-settings', JSON.stringify(next))
      return next
    })
  }

  const privacyOptionLabels: Record<string, string> = {
    everyone: 'Everyone',
    contacts: 'My contacts',
    nobody: 'Nobody',
  }

  const renderPrivacyOptionDetail = (
    key: 'lastSeen' | 'profilePhoto',
    title: string,
    description: string,
  ) => {
    const options = [
      { id: 'everyone', label: 'Everyone', hint: 'Visible to all users on the app' },
      { id: 'contacts', label: 'My contacts', hint: 'Visible only to people in your contacts' },
      { id: 'nobody', label: 'Nobody', hint: 'Hidden from everyone' },
    ]

    const selected = privacySettings[key]

    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPrivacyDetailPage(null)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-raised text-foreground hover:bg-surface transition-colors"
            aria-label="Back to privacy settings"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-text-secondary mt-0.5">{description}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => updatePrivacy({ [key]: option.id } as Partial<typeof privacySettings>)}
                className={cn(
                  'rounded-xl border px-3 py-3 text-left transition-colors',
                  selected === option.id
                    ? 'border-foreground bg-raised text-foreground'
                    : 'border-border bg-page text-text-secondary hover:bg-raised hover:text-foreground'
                )}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="mt-1 text-xs">{option.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const updateNotifications = (partial: Partial<typeof notificationSettings>) => {
    setNotificationSettings((previous) => {
      const next = { ...previous, ...partial }
      window.localStorage.setItem('chat-notification-settings', JSON.stringify(next))
      return next
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const closeMobileSidebar = () => {
    if (isMobileSidebarOpen) {
      toggleMobileSidebar()
    }
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setPrivacyDetailPage(null)
    closeMobileSidebar()
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'theme', label: 'Theme & Colors', icon: Palette },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-foreground">Account Information</h2>
            <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={accountForm.name} onChange={(event) => updateAccountField('name', event.target.value)} placeholder="Full name" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input value={accountForm.username} onChange={(event) => updateAccountField('username', event.target.value.toLowerCase())} placeholder="Username" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input value={accountForm.email} onChange={(event) => updateAccountField('email', event.target.value)} placeholder="Email" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input value={accountForm.phone} onChange={(event) => updateAccountField('phone', event.target.value)} placeholder="Phone" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input value={accountForm.headline} onChange={(event) => updateAccountField('headline', event.target.value)} placeholder="Headline" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <select value={accountForm.status} onChange={(event) => updateAccountField('status', event.target.value)} className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="busy">Busy</option>
                  <option value="invisible">Invisible</option>
                </select>
                <input value={accountForm.location} onChange={(event) => updateAccountField('location', event.target.value)} placeholder="Location" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input value={accountForm.department} onChange={(event) => updateAccountField('department', event.target.value)} placeholder="Department" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input value={accountForm.role} onChange={(event) => updateAccountField('role', event.target.value)} placeholder="Role" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input value={accountForm.website} onChange={(event) => updateAccountField('website', event.target.value)} placeholder="Website" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input value={accountForm.linkedin} onChange={(event) => updateAccountField('linkedin', event.target.value)} placeholder="LinkedIn" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <input value={accountForm.x} onChange={(event) => updateAccountField('x', event.target.value)} placeholder="X" className="h-10 rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <textarea value={accountForm.bio} onChange={(event) => updateAccountField('bio', event.target.value)} placeholder="Bio" className="min-h-20 w-full rounded-lg border border-border bg-page px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={saveAccountSettings}
                  disabled={isSavingAccount}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingAccount ? 'Saving...' : 'Save account changes'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl border border-border bg-raised px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-surface transition-colors inline-flex items-center justify-between"
              >
                <span>Log Out</span>
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )
      case 'privacy':
        if (privacyDetailPage === 'lastSeen') {
          return renderPrivacyOptionDetail(
            'lastSeen',
            'Last Seen',
            'Choose who can see your last seen status.'
          )
        }

        if (privacyDetailPage === 'profilePhoto') {
          return renderPrivacyOptionDetail(
            'profilePhoto',
            'Profile Photo',
            'Choose who can see your profile photo.'
          )
        }

        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-foreground">Privacy Settings</h2>
            <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
              <button
                type="button"
                onClick={() => setPrivacyDetailPage('lastSeen')}
                className="w-full p-4 flex justify-between items-center hover:bg-raised transition-colors"
              >
                <span className="text-sm font-medium text-foreground">Last Seen</span>
                <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
                  {privacyOptionLabels[privacySettings.lastSeen]}
                  <ChevronRight size={16} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPrivacyDetailPage('profilePhoto')}
                className="w-full p-4 flex justify-between items-center hover:bg-raised transition-colors"
              >
                <span className="text-sm font-medium text-foreground">Profile Photo</span>
                <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
                  {privacyOptionLabels[privacySettings.profilePhoto]}
                  <ChevronRight size={16} />
                </span>
              </button>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Read Receipts</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={privacySettings.readReceipts} onChange={(event) => updatePrivacy({ readReceipts: event.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                </label>
              </div>
            </div>
          </div>
        )
      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-foreground">Notification Preferences</h2>
            <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Message Sounds</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={notificationSettings.messageSounds} onChange={(event) => updateNotifications({ messageSounds: event.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                </label>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Desktop Notifications</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={notificationSettings.desktopNotifications} onChange={(event) => updateNotifications({ desktopNotifications: event.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                </label>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Mute All</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={notificationSettings.muteAll} onChange={(event) => updateNotifications({ muteAll: event.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                </label>
              </div>
            </div>
          </div>
        )
      case 'theme': {
        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-foreground">Theme & Colors</h2>
            <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
              <button
                type="button"
                onClick={() => navigate('/settings/theme')}
                className="w-full p-4 flex justify-between items-center hover:bg-raised transition-colors"
              >
                <span className="text-sm font-medium text-foreground">Theme style</span>
                <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
                  Open theme settings
                  <ChevronRight size={16} />
                </span>
              </button>
            </div>
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen w-full bg-page">
      <AppShell>
        <div className="relative flex-1 flex max-w-7xl mx-auto w-full h-full p-3 sm:p-4 lg:p-8 gap-4 lg:gap-8 flex-col lg:flex-row pb-20 md:pb-4">
          <div className="lg:hidden flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-secondary">Settings</p>
              <p className="text-sm font-semibold text-foreground">
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-raised text-foreground hover:bg-surface transition-colors"
              aria-label="Open settings menu"
              aria-expanded={isMobileSidebarOpen}
            >
              {isMobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {isMobileSidebarOpen && (
            <>
              <button
                type="button"
                aria-label="Close settings menu"
                onClick={toggleMobileSidebar}
                className="fixed inset-0 z-40 bg-black/35 lg:hidden"
              />
              <div className="fixed left-0 top-0 z-50 h-full w-[min(86vw,320px)] border-r border-border bg-surface p-3 shadow-2xl lg:hidden animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between px-1 pb-3 pt-1">
                  <h2 className="text-lg font-semibold text-foreground">Settings</h2>
                  <button
                    type="button"
                    onClick={toggleMobileSidebar}
                    className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-raised text-text-secondary hover:text-foreground transition-colors"
                    aria-label="Close settings menu"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                        activeTab === tab.id
                          ? 'bg-foreground text-surface'
                          : 'text-text-secondary hover:bg-raised hover:text-foreground'
                      )}
                    >
                      <tab.icon size={18} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="hidden lg:flex lg:w-72 lg:shrink-0 border border-border bg-surface rounded-2xl p-3 sm:p-4 flex-col gap-2 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-8">
            <h2 className="text-lg font-semibold text-foreground px-2 mb-1 sm:mb-2">Settings</h2>
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setPrivacyDetailPage(null)
                  }}
                  className={cn(
                    'min-w-fit lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-foreground text-surface'
                      : 'text-text-secondary hover:bg-raised hover:text-foreground'
                  )}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0 border border-border bg-surface rounded-2xl p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </AppShell>
    </div>
  )
}
