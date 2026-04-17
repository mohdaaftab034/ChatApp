import { X, Mail, Phone, MapPin, Briefcase, CalendarDays, Link as LinkIcon, MessageCircle, Search, Archive, Trash2, Flag, Ban, Image, FileText, Users, Info, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useUIStore } from '../../../../store/uiStore'
import { useChatStore } from '../../../../store/chatStore'
import { useAuthStore } from '../../../../store/authStore'
import { Avatar } from '../../../../components/shared/Avatar'
import { cn, normalizeExternalUrl } from '../../../../lib/utils'
import { toast } from 'sonner'
import { getMyProfileApi, getProfileByIdApi, type ProfileData } from '../../../profile/api/profile.api'
import { clearMessagesApi } from '../../api/messages.api'

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
  isBlocked: boolean
}

function toProfileRecord(profile: ProfileData): ProfileRecord {
  return {
    id: profile.id,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    status: profile.status,
    headline: profile.headline || 'Chat app member',
    bio: profile.bio || '',
    email: profile.email || '',
    phone: profile.phone || '',
    location: profile.location || '',
    department: profile.department || '',
    role: profile.role || 'Member',
    joinedAt: profile.joinedAt,
    social: {
      website: profile.social?.website || '',
      linkedin: profile.social?.linkedin || '',
      x: profile.social?.x || '',
    },
    isBlocked: Boolean(profile.isBlocked),
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
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const updateConversation = useChatStore((s) => s.updateConversation)
  const setMessages = useChatStore((s) => s.setMessages)
  const conversations = useChatStore((s) => s.conversations)
  const messages = useChatStore((s) => s.messages)
  const currentUser = useAuthStore((s) => s.user)
  const currentUserId = currentUser?.id
  const [profileDataFromApi, setProfileDataFromApi] = useState<ProfileRecord | null>(null)

  const conversationId = profilePanelConversationId ?? activeConversationId
  const conversation = conversations.find((item) => item.id === conversationId)
  const targetUser = conversation?.participants.find((participant) => participant.id !== currentUserId)
  const isGroupConversation = conversation?.type === 'group'
  const groupSettings = conversation?.group
  const groupMembers = isGroupConversation ? conversation?.participants ?? [] : []
  const conversationMessages = conversationId ? (messages[conversationId] || []) : []

  const fallbackContactProfile: ProfileRecord | null = targetUser
    ? {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
        avatar: targetUser.avatar,
        status: targetUser.status,
        headline: targetUser.bio || 'Team member',
        bio: targetUser.bio || '',
        email: targetUser.email,
        phone: '',
        location: '',
        department: '',
        role: 'Member',
        joinedAt: '',
        social: {
          website: '',
          linkedin: '',
          x: '',
        },
        isBlocked: Boolean(conversation?.isBlocked),
      }
    : null

  // Show current user's profile if no conversation is selected
  const fallbackCurrentUserProfile: ProfileRecord | null = currentUser && !conversation
    ? {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        status: currentUser.status,
        headline: 'Your Profile',
        bio: currentUser.bio || '',
        email: currentUser.email,
        phone: '',
        location: '',
        department: '',
        role: 'Member',
        joinedAt: '',
        social: {
          website: '',
          linkedin: '',
          x: '',
        },
        isBlocked: false,
      }
    : null

  useEffect(() => {
    if (isGroupConversation) {
      setProfileDataFromApi(null)
      return
    }

    const targetProfileId = targetUser?.id || (!conversation && currentUserId ? currentUserId : null)
    if (!targetProfileId) {
      setProfileDataFromApi(null)
      return
    }

    let isMounted = true
    ;(async () => {
      try {
        const data = targetUser?.id
          ? await getProfileByIdApi(targetProfileId)
          : await getMyProfileApi()

        if (!isMounted) return
        setProfileDataFromApi(toProfileRecord(data))
      } catch {
        if (!isMounted) return
        setProfileDataFromApi(null)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [conversation, currentUserId, isGroupConversation, targetUser?.id])

  const profile = profileDataFromApi ?? fallbackContactProfile ?? fallbackCurrentUserProfile
  const socialLinks = {
    website: normalizeExternalUrl(profile?.social.website),
    linkedin: normalizeExternalUrl(profile?.social.linkedin),
    x: normalizeExternalUrl(profile?.social.x),
  }

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

  const profileData = {
    ...(profile as ProfileRecord),
    isBlocked: Boolean(conversation?.isBlocked || (profile as ProfileRecord | null)?.isBlocked),
  }
  const isProfileOwner = Boolean(currentUserId && profileData.id === currentUserId)

  const mediaShortcuts = [
    {
      id: 'media',
      label: 'Media, links, and docs',
      detail: `${conversationMessages.filter((message) => ['image', 'video', 'link', 'file'].includes(message.type)).length} items`,
      icon: Image,
    },
    {
      id: 'files',
      label: 'Files',
      detail: `${conversationMessages.filter((message) => message.type === 'file').length} documents`,
      icon: FileText,
    },
    {
      id: 'groups',
      label: 'Shared groups',
      detail: `${conversations.filter((item) => item.type === 'group' && targetUser && item.participants.some((participant) => participant.id === targetUser.id)).length} groups in common`,
      icon: Users,
    },
  ]

  const handleQuickAction = (actionId: string) => {
    if (!conversationId) return

    if (actionId === 'message') {
      setActiveConversation(conversationId)
      handleCloseRightPanel()
      return
    }

    if (actionId === 'search') {
      setActiveConversation(conversationId)
      handleCloseRightPanel()
      openModal('search')
    }
  }

  const handleSharedContentAction = (actionId: string) => {
    if (!conversationId) {
      toast.info('Open a conversation first')
      return
    }

    if (actionId === 'media') {
      const latestVisual = [...conversationMessages]
        .reverse()
        .find((message) => (message.type === 'image' || message.type === 'video') && Boolean(message.mediaUrl))

      if (latestVisual?.mediaUrl) {
        setActiveConversation(conversationId)
        handleCloseRightPanel()
        openImageViewer(latestVisual.mediaUrl)
        return
      }

      toast.info('No media available yet')
      return
    }

    if (actionId === 'files') {
      const latestFile = [...conversationMessages]
        .reverse()
        .find((message) => message.type === 'file' && Boolean(message.mediaUrl))

      if (latestFile?.mediaUrl) {
        window.open(latestFile.mediaUrl, '_blank', 'noopener,noreferrer')
        return
      }

      toast.info('No shared files available yet')
      return
    }

    if (actionId === 'groups') {
      const sharedGroup = conversations.find(
        (item) => item.type === 'group' && targetUser && item.participants.some((participant) => participant.id === targetUser.id)
      )

      if (!sharedGroup) {
        toast.info('No shared groups found')
        return
      }

      setActiveConversation(sharedGroup.id)
      handleCloseRightPanel()
      return
    }
  }

  const safetyActions = isProfileOwner
    ? []
    : [
        { id: 'star', label: 'Star messages', icon: Star },
        { id: 'archive', label: 'Archive chat', icon: Archive },
        { id: 'block', label: profileData.isBlocked ? 'Unblock contact' : 'Block contact', icon: Ban, destructive: true },
        { id: 'report', label: 'Report contact', icon: Flag, destructive: true },
        { id: 'clear', label: 'Clear messages', icon: Trash2, destructive: true },
      ] as const

  const handleSafetyAction = async (actionId: string) => {
    if (!conversationId) {
      toast.info('Open a conversation first')
      return
    }

    if (actionId === 'clear') {
      try {
        await clearMessagesApi(conversationId)
        setMessages(conversationId, [])
        updateConversation(conversationId, { lastMessage: null, unreadCount: 0 })
        toast.success('Messages cleared')
      } catch {
        // API interceptor already shows error message.
      }
      return
    }

    if (actionId === 'block') {
      if (!targetUser?.id) {
        toast.error('No contact selected')
        return
      }

      openModal('blockContactConfirm')
      return
    }

    if (actionId === 'archive') {
      updateConversation(conversationId, { isArchived: true })
      toast.success('Chat archived')
      return
    }

    if (actionId === 'star') {
      toast.info('Starred messages view is coming soon')
      return
    }

    if (actionId === 'report') {
      toast.info('Report flow is coming soon')
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-surface relative">
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
        <h3 className="font-semibold text-lg text-foreground">Contact Info</h3>
        <button onClick={handleCloseRightPanel} className="p-1 hover:bg-raised rounded-lg text-text-secondary hover:text-foreground">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                onClick={() => handleSafetyAction(action.id)}
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

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action.id)}
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

          {isProfileOwner ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Contact</p>
                  <p className="text-sm text-foreground flex items-start gap-2 min-w-0">
                    <Mail size={14} className="mt-0.5 shrink-0" />
                    <span className="break-all">{profileData.email || 'Not available'}</span>
                  </p>
                  <p className="text-sm text-foreground flex items-start gap-2 min-w-0">
                    <Phone size={14} className="mt-0.5 shrink-0" />
                    <span className="break-all">{profileData.phone || 'Not available'}</span>
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Work</p>
                  <p className="text-sm text-foreground inline-flex items-center gap-2"><Briefcase size={14} />{profileData.role}</p>
                  <p className="text-sm text-text-secondary">{profileData.department}</p>
                  <p className="text-sm text-foreground inline-flex items-center gap-2"><MapPin size={14} />{profileData.location}</p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
                <p className="text-xs uppercase tracking-wide text-text-secondary">Social</p>
                {profileData.isBlocked ? (
                  <p className="text-sm text-text-secondary">Social links are hidden for blocked contacts.</p>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
                    {socialLinks.website && (
                      <a href={socialLinks.website} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-foreground hover:bg-raised transition-colors min-w-0"><LinkIcon size={14} className="shrink-0" /><span className="truncate">Website</span></a>
                    )}
                    {socialLinks.linkedin && (
                      <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-foreground hover:bg-raised transition-colors min-w-0"><LinkIcon size={14} className="shrink-0" /><span className="truncate">LinkedIn</span></a>
                    )}
                    {socialLinks.x && (
                      <a href={socialLinks.x} target="_blank" rel="noreferrer" className="text-sm inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-foreground hover:bg-raised transition-colors min-w-0"><LinkIcon size={14} className="shrink-0" /><span className="truncate">X</span></a>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-3 text-sm text-text-secondary">
              Private contact and social details are visible only to the profile owner.
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
            <p className="text-xs uppercase tracking-wide text-text-secondary">Shared content</p>
            {mediaShortcuts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSharedContentAction(item.id)}
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

          {!isProfileOwner && (
            <div className="rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden">
              {safetyActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleSafetyAction(action.id)}
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
          )}

          <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-text-secondary">Joined</p>
            <p className="text-sm text-foreground inline-flex items-center gap-2"><CalendarDays size={14} />{profileData.joinedAt || 'Not available'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
