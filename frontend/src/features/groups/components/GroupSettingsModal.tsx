import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Check, ImagePlus, Search, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { useUIStore } from '../../../store/uiStore'
import { useChatStore } from '../../../store/chatStore'
import { useAuthStore } from '../../../store/authStore'
import { Avatar } from '../../../components/shared/Avatar'
import { addGroupMembersApi, updateGroupApi } from '../api/groups.api'
import { listContactsApi } from '../../contacts/api/contacts.api'
import type { User } from '../../../types/user.types'

export function GroupSettingsModal() {
  const closeModal = useUIStore((s) => s.closeModal)
  const updateConversation = useChatStore((s) => s.updateConversation)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const conversation = useChatStore((s) => s.conversations.find((item) => item.id === activeConversationId))

  const isGroup = conversation?.type === 'group'
  const isAdmin = Boolean(isGroup && currentUserId && conversation.group?.adminIds.includes(currentUserId))

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [whoCanSend, setWhoCanSend] = useState<'all' | 'admins'>('all')
  const [whoCanAdd, setWhoCanAdd] = useState<'all' | 'admins'>('admins')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [contacts, setContacts] = useState<User[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [isAddingMembers, setIsAddingMembers] = useState(false)

  useEffect(() => {
    if (!conversation?.group) return
    setName(conversation.group.name || '')
    setDescription(conversation.group.description || '')
    setWhoCanSend(conversation.group.settings?.whoCanSend || 'all')
    setWhoCanAdd(conversation.group.settings?.whoCanAdd || 'admins')
    setAvatarPreview(null)
    setAvatarFile(null)
    setMemberSearch('')
    setSelectedMemberIds(new Set())
  }, [conversation])

  useEffect(() => {
    let active = true
    setIsLoadingContacts(true)

    ;(async () => {
      try {
        const data = await listContactsApi()
        if (active) setContacts(data)
      } catch {
        if (active) setContacts([])
      } finally {
        if (active) setIsLoadingContacts(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const memberCount = useMemo(() => conversation?.participants.length || 0, [conversation])
  const existingMemberIds = useMemo(() => new Set((conversation?.participants || []).map((member) => member.id)), [conversation])
  const canCurrentUserAddMembers = useMemo(() => {
    if (!conversation?.group) return false
    if (isAdmin) return true
    return conversation.group.settings?.whoCanAdd === 'all'
  }, [conversation, isAdmin])

  const selectableContacts = useMemo(() => {
    return contacts.filter((contact) => !existingMemberIds.has(contact.id))
  }, [contacts, existingMemberIds])

  const filteredContacts = useMemo(() => {
    const query = memberSearch.trim().toLowerCase()
    if (!query) return selectableContacts

    return selectableContacts.filter((contact) => {
      return contact.name.toLowerCase().includes(query)
        || contact.username.toLowerCase().includes(query)
        || contact.email.toLowerCase().includes(query)
    })
  }, [memberSearch, selectableContacts])

  if (!isGroup || !conversation) return null

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    const nextPreview = URL.createObjectURL(file)
    setAvatarFile(file)
    setAvatarPreview(nextPreview)
  }

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Only group admins can update settings')
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateGroupApi({
        groupId: conversation.id,
        name: name.trim(),
        description: description.trim(),
        whoCanSend,
        whoCanAdd,
        avatar: avatarFile,
      })

      updateConversation(updated.id, updated)
      toast.success('Group updated')
      closeModal()
    } catch {
      toast.error('Failed to update group')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const handleAddMembers = async () => {
    if (!canCurrentUserAddMembers) {
      toast.error('You do not have permission to add members')
      return
    }

    if (selectedMemberIds.size === 0) {
      toast.error('Select at least one member to add')
      return
    }

    setIsAddingMembers(true)
    try {
      const updated = await addGroupMembersApi({
        groupId: conversation.id,
        memberIds: [...selectedMemberIds],
      })

      updateConversation(updated.id, updated)
      setSelectedMemberIds(new Set())
      setMemberSearch('')
      toast.success('Members added')
    } catch {
      toast.error('Failed to add members')
    } finally {
      setIsAddingMembers(false)
    }
  }

  const currentAvatar = avatarPreview || conversation.group?.avatar || null

  return (
    <div className="fixed inset-0 z-50 bg-black/55 sm:flex sm:items-center sm:justify-center sm:p-4" onClick={closeModal}>
      <div
        className="h-dvh w-full overflow-y-auto bg-surface shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-border"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Group settings</h2>
            <p className="text-sm text-text-secondary">Update the group profile and permissions.</p>
          </div>
          <button type="button" onClick={closeModal} className="rounded-lg p-2 text-text-secondary hover:bg-raised hover:text-foreground" aria-label="Close group settings">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-page p-4 text-center">
              <div className="mb-3 flex justify-center">
                <Avatar src={currentAvatar} fallback={conversation.group?.name || 'Group'} size="xl" />
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-raised">
                <ImagePlus size={16} />
                Change photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            <div className="rounded-2xl border border-border bg-page p-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Members</p>
              <p className="text-sm text-foreground">{memberCount} people in this group</p>
              <p className="text-sm text-text-secondary">Admins can change the photo, name, description, and permissions.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Group name</label>
                <input value={name} onChange={(event) => setName(event.target.value)} disabled={!isAdmin} className="h-11 w-full rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Who can add members</label>
                <select value={whoCanAdd} onChange={(event) => setWhoCanAdd(event.target.value as 'all' | 'admins')} disabled={!isAdmin} className="h-11 w-full rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60">
                  <option value="admins">Admins only</option>
                  <option value="all">Everyone</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} disabled={!isAdmin} className="w-full rounded-lg border border-border bg-page px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Who can send messages</label>
                <select value={whoCanSend} onChange={(event) => setWhoCanSend(event.target.value as 'all' | 'admins')} disabled={!isAdmin} className="h-11 w-full rounded-lg border border-border bg-page px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60">
                  <option value="all">All members</option>
                  <option value="admins">Admins only</option>
                </select>
              </div>
              <div className="rounded-lg border border-border bg-page p-3">
                <p className="text-xs uppercase tracking-wide text-text-secondary">Access</p>
                <p className="mt-1 text-sm text-foreground">All active group settings are available here.</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-page p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Add members</p>
                  <p className="text-xs text-text-secondary">Invite more contacts to this group.</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                  <Users size={14} />
                  {selectedMemberIds.size} selected
                </span>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search contacts"
                  disabled={!canCurrentUserAddMembers}
                  className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1 rounded-lg border border-border bg-surface p-1">
                {isLoadingContacts ? (
                  <div className="py-6 text-center text-sm text-text-secondary">Loading contacts...</div>
                ) : filteredContacts.length === 0 ? (
                  <div className="py-6 text-center text-sm text-text-secondary">No contacts available to add</div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isSelected = selectedMemberIds.has(contact.id)

                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => toggleMemberSelection(contact.id)}
                        disabled={!canCurrentUserAddMembers}
                        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-page disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar src={contact.avatar} fallback={contact.name} size="sm" isOnline={contact.status === 'online'} showOnlineDot />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{contact.name}</p>
                            <p className="truncate text-xs text-text-secondary">@{contact.username || contact.email}</p>
                          </div>
                        </div>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-transparent'}`}>
                          <Check size={12} />
                        </span>
                      </button>
                    )
                  })
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddMembers}
                  disabled={!canCurrentUserAddMembers || selectedMemberIds.size === 0 || isAddingMembers}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-raised disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAddingMembers ? 'Adding...' : 'Add selected members'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-sm text-text-secondary">
                {isAdmin ? 'Changes will update the group everywhere immediately.' : 'Only group admins can edit these settings.'}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-raised">Cancel</button>
                <button type="button" onClick={handleSave} disabled={!isAdmin || isSaving} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}