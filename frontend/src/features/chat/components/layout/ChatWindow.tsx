import { useChatStore } from '../../../../store/chatStore'
import { useAuthStore } from '../../../../store/authStore'
import { MessageCircle } from 'lucide-react'
import { EmptyState } from '../../../../components/shared/EmptyState'
import { ChatHeader } from '../header/ChatHeader'
import { MessageList } from '../message/MessageList'
import { InputBar } from '../input/InputBar'
import { useEffect } from 'react'
import { joinConversation, leaveConversation } from '../../hooks/useSocket'
import { listMessagesApi } from '../../api/chat.api'
import { buildAutoUnlockSecret, decryptMessageIfNeeded, tryAutoUnlockKeyring } from '../../../../lib/e2ee'

export function ChatWindow() {
  const { activeConversationId, setMessages, setConversationUnreadCount } = useChatStore()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const token = useAuthStore((state) => state.token)
  const refreshToken = useAuthStore((state) => state.refreshToken)

  useEffect(() => {
    if (!activeConversationId) return

    setConversationUnreadCount(activeConversationId, 0)

    joinConversation(activeConversationId)
    return () => {
      leaveConversation(activeConversationId)
    }
  }, [activeConversationId, setConversationUnreadCount])

  useEffect(() => {
    if (!activeConversationId) return

    let isMounted = true

    ;(async () => {
      try {
        const autoUnlockSecret = buildAutoUnlockSecret({
          userId: currentUserId,
          token,
          refreshToken,
        })
        if (autoUnlockSecret) {
          await tryAutoUnlockKeyring(autoUnlockSecret)
        }

        const messages = await listMessagesApi(activeConversationId)
        const hydratedMessages = await Promise.all(
          messages.map((message) => decryptMessageIfNeeded(message, currentUserId))
        )
        if (isMounted) {
          setMessages(activeConversationId, hydratedMessages)
          setConversationUnreadCount(activeConversationId, 0)
        }
      } catch (_error) {
        // Keep existing in-memory messages if backend fetch fails.
      }
    })()

    return () => {
      isMounted = false
    }
  }, [activeConversationId, currentUserId, token, refreshToken, setMessages, setConversationUnreadCount])

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex w-full h-full bg-page items-center justify-center">
        <EmptyState 
          icon={<MessageCircle className="w-full h-full text-text-tertiary" />}
          title="Select a conversation"
          description="Choose a contact from the sidebar or start a new chat to begin messaging."
          action={
            <button className="mt-4 text-sm font-medium text-foreground underline hover:no-underline">
              Start new chat &rarr;
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-page relative">
      <ChatHeader />
      <MessageList />
      <InputBar />
    </div>
  )
}
