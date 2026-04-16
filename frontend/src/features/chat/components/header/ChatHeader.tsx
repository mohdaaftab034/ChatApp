import { ChevronLeft } from 'lucide-react'
import { Avatar } from '../../../../components/shared/Avatar'
import { ChatHeaderActions } from './ChatHeaderActions'
import { useChatStore } from '../../../../store/chatStore'
import { useAuthStore } from '../../../../store/authStore'
import { useUIStore } from '../../../../store/uiStore'

export function ChatHeader() {
  const { activeConversationId, conversations, typingUsers, onlineUsers } = useChatStore()
  const currentUserId = useAuthStore(s => s.user?.id)
  const openProfilePanel = useUIStore(s => s.openProfilePanel)
  const setActiveConversation = useChatStore(s => s.setActiveConversation)

  if (!activeConversationId) return null

  const conversation = conversations.find(c => c.id === activeConversationId)
  if (!conversation) return null

  const isGroup = conversation.type === 'group'
  const otherUser = conversation.participants.find(p => p.id !== currentUserId)
  
  const name = isGroup ? conversation.group?.name : otherUser?.name
  const avatar = isGroup ? conversation.group?.avatar : otherUser?.avatar
  const isOnline = isGroup ? false : Boolean(otherUser?.id && onlineUsers.has(otherUser.id))

  const typingInThis = typingUsers[activeConversationId] || []
  const otherTypingUsers = typingInThis.filter(id => id !== currentUserId)
  
  let subText: React.ReactNode = ''
  
  if (otherTypingUsers.length > 0) {
    const typingNames = otherTypingUsers.map(id => conversation.participants.find(p => p.id === id)?.name).filter(Boolean)
    const text = typingNames.length === 1 ? `${typingNames[0]} is typing...` : `${typingNames.length} people are typing...`
    subText = <span className="text-accent-foreground font-medium animate-pulse">{text}</span>
  } else if (isGroup) {
    subText = `${conversation.participants.length} members`
  } else if (isOnline) {
    subText = <span className="text-online">Online</span>
  } else if (otherUser?.lastSeen) {
    subText = `Last seen ${new Date(otherUser.lastSeen).toLocaleDateString()}`
  } else {
    subText = 'Offline'
  }

  return (
    <div className="flex items-center justify-between h-14 px-4 bg-surface border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Back Button */}
        <button 
          onClick={() => setActiveConversation(null)}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-raised text-text-secondary transition-colors"
        >
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          className="flex items-center gap-3 text-left cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => openProfilePanel(activeConversationId)}
          aria-label={`Open profile for ${name ?? 'contact'}`}
        >
          <Avatar 
            src={avatar} 
            fallback={name || '?'} 
            size="md" 
            isOnline={isOnline} 
            showOnlineDot={true} 
          />
          <div className="flex flex-col min-w-0 max-w-50">
            <h3 className="text-sm font-medium text-foreground truncate">{name}</h3>
            <span className="text-xs text-text-secondary truncate">{subText}</span>
          </div>
        </button>
      </div>
      
      <ChatHeaderActions />
    </div>
  )
}
