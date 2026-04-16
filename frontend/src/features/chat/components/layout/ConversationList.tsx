import { useState } from 'react'
import { Search, X, Users } from 'lucide-react'
import { FilterTabs } from '../conversation/FilterTabs'
import { ConversationRow } from '../conversation/ConversationRow'
import { PinnedSection } from '../conversation/PinnedSection'
import { useChatStore } from '../../../../store/chatStore'
import { useAuthStore } from '../../../../store/authStore'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { useUIStore } from '../../../../store/uiStore'
import { Avatar } from '../../../../components/shared/Avatar'
import { useNavigate } from 'react-router-dom'

export function ConversationList() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'Groups'>('All')
  
  const { conversations, activeConversationId, onlineUsers } = useChatStore()
  const currentUserId = useAuthStore(s => s.user?.id)
  const currentUser = useAuthStore(s => s.user)
  const setModal = useUIStore(s => s.openModal)
  const navigate = useNavigate()

  const realConversations = conversations.filter((conversation) => {
    return conversation.type === 'group' || Boolean(conversation.lastMessage) || conversation.id === activeConversationId
  })

  const pinned = realConversations.filter(c => c.isPinned)
  const unpinned = realConversations.filter(c => !c.isPinned)
  
  // Filter logic
  const filtered = unpinned.filter(c => {
    if (activeTab === 'Unread' && c.unreadCount === 0) return false
    if (activeTab === 'Groups' && c.type !== 'group') return false
    
    if (search) {
      if (c.type === 'group' && c.group?.name.toLowerCase().includes(search.toLowerCase())) return true
      const otherUser = c.participants.find(p => p.id !== currentUserId)
      if (otherUser && (otherUser.name.toLowerCase().includes(search.toLowerCase()) || otherUser.username.toLowerCase().includes(search.toLowerCase()))) return true
      return false
    }
    return true
  })

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68,
    overscan: 5,
  })

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface">
      {/* Header */}
      <div className="shrink-0 p-4 pb-0 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Chats</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal('createGroup')}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-text-secondary hover:text-foreground hover:bg-raised transition-colors"
            aria-label="Create group"
          >
            <Users size={16} />
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center rounded-full border border-border bg-surface p-0.5 shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open profile"
          >
            <Avatar
              src={currentUser?.avatar}
              fallback={currentUser?.name || 'U'}
              size="sm"
              className="rounded-full"
            />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-text-tertiary" size={16} strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 bg-raised rounded-lg pl-9 pr-8 text-sm text-foreground focus-visible:outline-none focus:ring-1 focus:ring-ring border-none"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2 p-1 text-text-tertiary hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <FilterTabs active={activeTab} onChange={setActiveTab} />

      {/* List Container */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto"
      >
        {pinned.length > 0 && !search && activeTab !== 'Unread' && (
          <PinnedSection conversations={pinned} currentUserId={currentUserId} />
        )}

        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const index = virtualRow.index
            const c = filtered[index]
            const isGroup = c.type === 'group'
            const otherUser = c.participants.find(p => p.id !== currentUserId)
            
            const name = isGroup ? c.group?.name : otherUser?.name
            const avatar = isGroup ? c.group?.avatar : otherUser?.avatar
            const isOnline = isGroup ? false : Boolean(otherUser?.id && onlineUsers.has(otherUser.id))
            
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ConversationRow 
                  id={c.id}
                  name={name || 'Unknown'}
                  avatar={avatar || null}
                  lastMessage={c.lastMessage}
                  unreadCount={c.unreadCount}
                  isMuted={c.isMuted}
                  isOnline={isOnline}
                  isActive={activeConversationId === c.id}
                />
              </div>
            )
          })}
        </div>
        
        {filtered.length === 0 && !search && (
          <div className="p-4 text-center text-sm text-text-secondary mt-10">
            No conversations found.
          </div>
        )}
      </div>
    </div>
  )
}
