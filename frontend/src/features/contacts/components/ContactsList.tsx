import { useEffect, useMemo, useState } from 'react'
import { Search, MoreVertical, MessageSquare } from 'lucide-react'
import { Avatar } from '../../../components/shared/Avatar'
import { useNavigate } from 'react-router-dom'
import { listContactsApi, startDirectConversationApi } from '../api/contacts.api'
import { User } from '../../../types/user.types'
import { useChatStore } from '../../../store/chatStore'

export function ContactsList() {
  const [search, setSearch] = useState('')
  const [contacts, setContacts] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const addConversation = useChatStore((state) => state.addConversation)

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const data = await listContactsApi()
        if (active) setContacts(data)
      } catch (_error) {
        if (active) setContacts([])
      } finally {
        if (active) setIsLoading(false)
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
      return (
        contact.name.toLowerCase().includes(query)
        || contact.username.toLowerCase().includes(query)
        || contact.email.toLowerCase().includes(query)
      )
    })
  }, [contacts, search])

  const handleStartChat = async (contact: User) => {
    try {
      const conversation = await startDirectConversationApi(contact.id)
      addConversation(conversation)
      navigate(`/${conversation.id}`)
    } catch (_error) {
      // API errors are surfaced by the global axios error interceptor.
    }
  }

  return (
    <div className="flex h-full w-full flex-col md:w-75 md:border-r md:bg-surface border-border md:z-10 bg-surface md:shrink-0 pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-foreground">Contacts</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search contacts" 
              className="pl-9 pr-4 py-2 bg-raised border-none rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-tertiary py-8">
            <p>Loading contacts...</p>
          </div>
        ) : null}

        {!isLoading && filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-tertiary py-8">
            <p>No contacts found</p>
          </div>
        ) : (
          filteredContacts.map(contact => (
            <div
              key={contact.id}
              className="w-full flex items-start justify-between p-3 rounded-xl hover:bg-raised transition-colors group border border-transparent hover:border-border text-left"
            >
              <button
                type="button"
                onClick={() => navigate(`/profile/${contact.id}`)}
                className="flex items-start gap-3 min-w-0 flex-1"
              >
                <Avatar src={contact.avatar} fallback={contact.name} size="lg" isOnline={contact.status === 'online'} showOnlineDot />
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate">{contact.name}</h3>
                </div>
              </button>

              <div className="flex items-center gap-2 opacity-100 group-hover:opacity-100 transition-opacity mt-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStartChat(contact)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-surface border border-border hover:bg-raised text-foreground transition-colors shadow-sm"
                  aria-label={`Message ${contact.name}`}
                >
                  <MessageSquare size={16} />
                </button>
                <button type="button" className="w-9 h-9 flex items-center justify-center rounded-full bg-surface border border-border hover:bg-raised text-text-secondary hover:text-foreground transition-colors shadow-sm">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
