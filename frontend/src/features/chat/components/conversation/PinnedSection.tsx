import { Pin } from 'lucide-react'
import { Conversation } from '../../../../types/conversation.types'
import { ConversationRow } from './ConversationRow'
import { useChatStore } from '../../../../store/chatStore'

interface PinnedSectionProps {
  conversations: Conversation[]
  currentUserId: string | undefined
}

export function PinnedSection({ conversations, currentUserId }: PinnedSectionProps) {
  const activeConversationId = useChatStore(s => s.activeConversationId)

  if (conversations.length === 0) return null

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center px-4 pt-2 pb-1">
        <span className="text-xs font-semibold text-text-tertiary flex items-center gap-1">
          <Pin size={12} /> Pinned
        </span>
      </div>
      <div>
        {conversations.map(c => {
          const isGroup = c.type === 'group'
          const otherUser = c.participants.find(p => p.id !== currentUserId)
          const name = isGroup ? c.group?.name : otherUser?.name
          const avatar = isGroup ? c.group?.avatar : otherUser?.avatar
          const isOnline = isGroup ? false : otherUser?.status === 'online'

          return (
            <ConversationRow 
              key={c.id}
              id={c.id}
              name={name || 'Unknown'}
              avatar={avatar || null}
              lastMessage={c.lastMessage}
              unreadCount={c.unreadCount}
              isMuted={c.isMuted}
              isOnline={isOnline}
              isActive={activeConversationId === c.id}
            />
          )
        })}
      </div>
    </div>
  )
}
