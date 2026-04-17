import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useChatStore } from '../../../store/chatStore'
import { listConversationsApi } from '../api/chat.api'
import { useAuthStore } from '../../../store/authStore'
import { buildAutoUnlockSecret, decryptMessageIfNeeded, tryAutoUnlockKeyring } from '../../../lib/e2ee'

export default function ChatPage() {
  const { conversationId } = useParams()
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const setConversations = useChatStore((s) => s.setConversations)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const token = useAuthStore((s) => s.token)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  useEffect(() => {
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

        const conversations = await listConversationsApi()
        const hydratedConversations = await Promise.all(
          conversations.map(async (conversation) => {
            if (!conversation.lastMessage) return conversation

            const decryptedLastMessage = await decryptMessageIfNeeded(conversation.lastMessage, currentUserId)
            return {
              ...conversation,
              lastMessage: decryptedLastMessage,
            }
          })
        )
        if (!isMounted) return
        setConversations(hydratedConversations)
      } catch (_error) {
        // Keep current state if the request fails (e.g. backend temporarily unavailable).
      }
    })()

    return () => {
      isMounted = false
    }
  }, [currentUserId, token, refreshToken, setConversations])

  useEffect(() => {
    setActiveConversation(conversationId || null)
  }, [conversationId, setActiveConversation])

  return (
    <AppShell />
  )
}
