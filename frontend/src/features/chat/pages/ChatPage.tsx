import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useChatStore } from '../../../store/chatStore'
import { listConversationsApi } from '../api/chat.api'

export default function ChatPage() {
  const { conversationId } = useParams()
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const setConversations = useChatStore((s) => s.setConversations)

  useEffect(() => {
    let isMounted = true

    ;(async () => {
      try {
        const conversations = await listConversationsApi()
        if (!isMounted) return
        setConversations(conversations)
      } catch (_error) {
        // Keep current state if the request fails (e.g. backend temporarily unavailable).
      }
    })()

    return () => {
      isMounted = false
    }
  }, [setConversations])

  useEffect(() => {
    setActiveConversation(conversationId || null)
  }, [conversationId, setActiveConversation])

  return (
    <AppShell />
  )
}
