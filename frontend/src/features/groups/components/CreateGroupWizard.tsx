import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Search, Users, X } from 'lucide-react'
import { useUIStore } from '../../../store/uiStore'
import { listContactsApi } from '../../contacts/api/contacts.api'
import { createGroupApi } from '../api/groups.api'
import { User } from '../../../types/user.types'
import { Avatar } from '../../../components/shared/Avatar'
import { useChatStore } from '../../../store/chatStore'

export function CreateGroupWizard() {
  const closeModal = useUIStore((s) => s.closeModal)
  const addConversation = useChatStore((s) => s.addConversation)
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const navigate = useNavigate()

  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [contacts, setContacts] = useState<User[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const data = await listContactsApi()
        if (active) setContacts(data)
      } catch (_error) {
        if (active) setContacts([])
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return contacts
    return contacts.filter((contact) => {
      return contact.name.toLowerCase().includes(query)
        || contact.username.toLowerCase().includes(query)
        || contact.email.toLowerCase().includes(query)
    })
  }, [contacts, search])

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const canCreate = groupName.trim().length >= 2 && selectedIds.size > 0 && !isSubmitting

  const handleCreateGroup = async () => {
    if (!canCreate) return
    setIsSubmitting(true)

    try {
      const conversation = await createGroupApi({
        name: groupName.trim(),
        memberIds: [...selectedIds],
        description: description.trim() || undefined,
      })

      addConversation(conversation)
      setActiveConversation(conversation.id)
      closeModal()
      navigate(`/${conversation.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
      <div 
        className="w-full max-w-140 bg-surface rounded-xl shadow-lg border border-border p-6 animate-in fade-in zoom-in duration-150 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Create Group</h2>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg p-1 text-text-secondary hover:bg-raised hover:text-foreground"
            aria-label="Close create group"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Group name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full rounded-lg bg-raised px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={2}
              className="w-full rounded-lg bg-raised px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Add members</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts"
                className="w-full rounded-lg bg-raised pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
            {filteredContacts.length === 0 ? (
              <div className="py-6 text-center text-sm text-text-tertiary">No contacts available</div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedIds.has(contact.id)
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleSelect(contact.id)}
                    className="w-full flex items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-raised transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={contact.avatar} fallback={contact.name} size="sm" isOnline={contact.status === 'online'} showOnlineDot />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                        <p className="text-xs text-text-secondary truncate">@{contact.username || contact.email}</p>
                      </div>
                    </div>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? 'bg-accent border-accent text-accent-foreground' : 'border-border text-transparent'}`}>
                      <Check size={12} />
                    </span>
                  </button>
                )
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <Users size={16} />
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-raised"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={!canCreate}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
