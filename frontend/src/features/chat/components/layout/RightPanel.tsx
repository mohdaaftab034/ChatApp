import { X, Mail, Phone, MapPin, Briefcase, CalendarDays, Link as LinkIcon, MessageCircle, Search, BellOff, Archive, Trash2, Flag, Ban, Image, FileText, Users, Info, Star } from 'lucide-react'
import { useUIStore } from '../../../../store/uiStore'
import { useChatStore } from '../../../../store/chatStore'
import { useAuthStore } from '../../../../store/authStore'
import { Avatar } from '../../../../components/shared/Avatar'
import { cn } from '../../../../lib/utils'

type ProfileRecord = {
  id: string
  name: string
  username: string
  avatar: string | null
  status: 'online' | 'offline' | 'away' | 'busy' | 'invisible'
  headline: string
  bio: string
  email: string
  phone: string
  location: string
  department: string
  role: string
  joinedAt: string
  social: {
    website: string
    linkedin: string
    x: string
  }
}

export function RightPanel() {
  const closeRightPanel = useUIStore((s) => s.closeRightPanel)
  const handleCloseRightPanel = () => {
    clearProfilePanel()
    closeRightPanel()
  }
  const clearProfilePanel = useUIStore((s) => s.clearProfilePanel)
  const openImageViewer = useUIStore((s) => s.openImageViewer)
  const openModal = useUIStore((s) => s.openModal)
  const profilePanelConversationId = useUIStore((s) => s.profilePanelConversationId)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const conversations = useChatStore((s) => s.conversations)
  const currentUser = useAuthStore((s) => s.user)
  const currentUserId = currentUser?.id

  const conversationId = profilePanelConversationId ?? activeConversationId
  const conversation = conversations.find((item) => item.id === conversationId)
  const targetUser = conversation?.participants.find((participant) => participant.id !== currentUserId)
  const isGroupConversation = conversation?.type === 'group'
  const groupSettings = conversation?.group
  const groupMembers = isGroupConversation ? conversation?.participants ?? [] : []

  const contactProfile: ProfileRecord | null = targetUser
    ? {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
        avatar: targetUser.avatar,
        status: targetUser.status,
        headline: targetUser.bio || 'Team member',
        bio: targetUser.bio || 'No additional profile details provided.',
        email: targetUser.email,
        phone: '+1 555 000 0000',
        location: 'Unknown',
        department: 'General',
        role: 'Member',
        joinedAt: '2025-01-01',
        social: {
          website: 'https://example.com',
          linkedin: 'https://linkedin.com',
          x: 'https://x.com',
        },
      }
    : null

  // Show current user's profile if no conversation is selected
  const currentUserProfile: ProfileRecord | null = currentUser && !conversation
    ? {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        status: currentUser.status,
        headline: 'Your Profile',
        bio: currentUser.bio || 'Welcome to your profile!',
        email: currentUser.email,
        phone: '+1 555 000 0000',
        location: 'Unknown',
        department: 'General',
        role: 'Member',
        joinedAt: '2025-01-01',
        social: {
          website: 'https://example.com',
          linkedin: 'https://linkedin.com',
          x: 'https://x.com',
        },
      }
    : null

  const profile = contactProfile ?? currentUserProfile

  const handleOpenGroupSettings = () => {
    closeRightPanel()
    openModal('groupSettings')
  }

  const groupActions = [
    { id: 'change-photo', label: 'Change photo', icon: Image, action: handleOpenGroupSettings },
    { id: 'group-settings', label: 'Group settings', icon: Info, action: handleOpenGroupSettings },
    { id: 'members', label: 'Members', icon: Users, action: handleOpenGroupSettings },
  ]

  const quickActions = [
    { id: 'message', label: 'Message', icon: MessageCircle, tone: 'bg-foreground text-surface' },
    { id: 'search', label: 'Search', icon: Search, tone: 'bg-raised text-foreground' },
  ]

  const profileData = profile as ProfileRecord

  const mediaShortcuts = [
    { id: 'media', label: 'Media, links, and docs', detail: '132 items', icon: Image },
    { id: 'files', label: 'Files', detail: '24 documents', icon: FileText },
    { id: 'groups', label: 'Shared groups', detail: '7 groups in common', icon: Users },
  ]

  const safetyActions = [
    { id: 'mute', label: 'Mute notifications', icon: BellOff },
    { id: 'star', label: 'Star messages', icon: Star },
    { id: 'archive', label: 'Archive chat', icon: Archive },
    { id: 'block', label: 'Block contact', icon: Ban, destructive: true },
    { id: 'report', label: 'Report contact', icon: Flag, destructive: true },
    { id: 'delete', label: 'Delete chat', icon: Trash2, destructive: true },
  ] as const

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-surface relative">
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
        <h3 className="font-semibold text-lg text-foreground">Contact Info</h3>
        <button onClick={() => { clearProfilePanel(); closeRightPanel(); }} className="p-1 hover:bg-raised rounded-lg text-text-secondary hover:text-foreground">
          <X size={20} />
        </button>
      </div>
      {!profile && !isGroupConversation ? (
        <div className="p-4 flex flex-col items-center justify-center flex-1 text-text-tertiary text-center">
          <p>No contact selected.</p>
          <p className="text-sm mt-1">Open a conversation and tap the header avatar to view profile details.</p>
        </div>
      ) : isGroupConversation && groupSettings ? (
        <div className="p-4 space-y-4">
          <div className="rounded-[28px] border border-border bg-linear-to-b from-raised to-surface p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (groupSettings.avatar) {
                      openImageViewer(groupSettings.avatar)
                    }
                  }}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Open ${groupSettings.name} display photo`}
                >
                  <Avatar
                    src={groupSettings.avatar}
                    fallback={groupSettings.name}
                    size="3xl"
                    className="ring-4 ring-surface cursor-zoom-in"
                  />
                </button>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-surface border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary shadow-sm">
                  Group
                </div>
              </div>
              <div className="min-w-0 flex-1 pt-2">
                <p className="text-xl font-semibold text-foreground truncate">{groupSettings.name}</p>
                <p className="text-sm text-text-secondary truncate">{conversation.participants.length} members</p>
                <p className="mt-2 text-sm text-foreground">{groupSettings.description || 'No description added yet.'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {groupActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.action}
                      className={cn(
                        'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                        action.id === 'change-photo' ? 'bg-foreground text-surface hover:opacity-90' : 'bg-raised text-foreground hover:bg-surface'
                      )}
                    >
                      <action.icon size={16} />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Group Settings</p>
              <p className="text-sm text-foreground">Send messages: {groupSettings.settings?.whoCanSend === 'admins' ? 'Admins only' : 'All members'}</p>
              <p className="text-sm text-foreground">Add members: {groupSettings.settings?.whoCanAdd === 'admins' ? 'Admins only' : 'All members'}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Members</p>
              <p className="text-sm text-foreground">{conversation.participants.length} participants</p>
              <p className="text-sm text-text-secondary">Open group settings to manage the profile and permissions.</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-secondary">Group members</p>
              <p className="text-sm text-text-secondary">Everyone in the group can view the current member list.</p>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {groupMembers.map((member) => {
                const isMe = member.id === currentUserId
                const isAdmin = Boolean(groupSettings?.adminIds?.includes(member.id))

                return (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border bg-page px-3 py-2">
                    <Avatar
                      src={member.avatar}
                      fallback={member.name}
                      size="sm"
                      isOnline={member.status === 'online'}
                      showOnlineDot
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                        {isMe && <span className="shrink-0 rounded-full bg-raised px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">You</span>}
                        {isAdmin && <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">Admin</span>}
                      </div>
                      <p className="truncate text-xs text-text-secondary">@{member.username || member.email}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-text-secondary">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{groupSettings.description || 'No description provided.'}</p>
          </div>

          <div className="rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden">
            {safetyActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-raised',
                  'destructive' in action && action.destructive ? 'text-destructive' : 'text-foreground'
                )}
              >
                <action.icon size={16} />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="rounded-[28px] border border-border bg-linear-to-b from-raised to-surface p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (profileData.avatar) {
                      openImageViewer(profileData.avatar)
                    }
                  }}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Open ${profileData.name} display photo`}
                >
                  <Avatar
                    src={profileData.avatar}
                    fallback={profileData.name}
                    size="3xl"
                    className="ring-4 ring-surface cursor-zoom-in"
                    isOnline={profileData.status === 'online'}
                    showOnlineDot
                  />
                </button>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-surface border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary shadow-sm">
                  {profileData.status}
                </div>
              </div>
              <div className="min-w-0 flex-1 pt-2">
                <p className="text-xl font-semibold text-foreground truncate">{profileData.name}</p>
                <p className="text-sm text-text-secondary truncate">@{profileData.username}</p>
                <p className="mt-2 text-sm text-foreground">{profileData.headline}</p>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{profileData.bio}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    action.tone,
                    action.tone === 'bg-raised text-foreground' ? 'hover:bg-surface' : 'hover:opacity-90'
                  )}
                >
                  <action.icon size={16} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Contact</p>
              <p className="text-sm text-foreground inline-flex items-center gap-2"><Mail size={14} />{profileData.email}</p>
              <p className="text-sm text-foreground inline-flex items-center gap-2"><Phone size={14} />{profileData.phone}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Work</p>
              <p className="text-sm text-foreground inline-flex items-center gap-2"><Briefcase size={14} />{profileData.role}</p>
              <p className="text-sm text-text-secondary">{profileData.department}</p>
              <p className="text-sm text-foreground inline-flex items-center gap-2"><MapPin size={14} />{profileData.location}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
            <p className="text-xs uppercase tracking-wide text-text-secondary">Shared content</p>
            {mediaShortcuts.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full flex items-center justify-between rounded-lg px-2 py-2 hover:bg-raised transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-raised text-foreground">
                    <item.icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                    <p className="text-xs text-text-secondary truncate">{item.detail}</p>
                  </div>
                </div>
                <Info size={14} className="text-text-tertiary shrink-0" />
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-text-secondary">Social</p>
            <a href={profileData.social.website} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center gap-2 text-foreground hover:text-accent"><LinkIcon size={14} />Website</a>
            <a href={profileData.social.linkedin} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center gap-2 text-foreground hover:text-accent"><LinkIcon size={14} />LinkedIn</a>
            <a href={profileData.social.x} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center gap-2 text-foreground hover:text-accent"><LinkIcon size={14} />X</a>
          </div>

          <div className="rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden">
            {safetyActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-raised',
                  'destructive' in action && action.destructive ? 'text-destructive' : 'text-foreground'
                )}
              >
                <action.icon size={16} />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-text-secondary">Joined</p>
            <p className="text-sm text-foreground inline-flex items-center gap-2"><CalendarDays size={14} />{profileData.joinedAt}</p>
          </div>
        </div>
      )}
    </div>
  )
}
