import { useEffect } from 'react'
import { socket } from '../../../lib/socket'
import { useChatStore } from '../../../store/chatStore'
import { useSocketStore } from '../../../store/socketStore'
import { SendMessagePayload } from '../../../types/socket.types'
import { useAuthStore } from '../../../store/authStore'
import { buildAutoUnlockSecret, decryptMessageIfNeeded, tryAutoUnlockKeyring } from '../../../lib/e2ee'

export function useSocketSetup() {
  const {
    addMessage,
    replaceMessage,
    updateMessage,
    deleteMessage,
    bumpConversationToTop,
    setOnlineUsers,
    setUserOnline,
    setUserOffline,
    setTyping,
    updateConversation,
    markMessagesRead,
    setConversationUnreadCount,
    setMessages,
  } = useChatStore()
  const token = useAuthStore((s) => s.token)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { setConnected } = useSocketStore()

  useEffect(() => {
    if (!token) {
      setConnected(false)
      if (socket.connected) {
        socket.disconnect()
      }
      return
    }

    const onConnect = () => {
      setConnected(true)
    }

    const onDisconnect = () => {
      setConnected(false)
    }

    const onReceiveMessage = async (incomingMessage: Parameters<typeof addMessage>[1]) => {
      const authState = useAuthStore.getState()
      const autoUnlockSecret = buildAutoUnlockSecret({
        userId: authState.user?.id,
        token: authState.token,
        refreshToken: authState.refreshToken,
      })

      if (autoUnlockSecret) {
        await tryAutoUnlockKeyring(autoUnlockSecret)
      }

      const message = await decryptMessageIfNeeded(incomingMessage, currentUserId)
      const conversationMessages = useChatStore.getState().messages[message.conversationId] || []

      const pendingUploadingMessage = message.clientTempId
        ? conversationMessages.find((existingMessage) =>
            existingMessage.isUploading
            && existingMessage.clientTempId
            && existingMessage.clientTempId === message.clientTempId
          )
        : undefined

      const messageAlreadyExists = conversationMessages.some((existingMessage) => existingMessage.id === message.id)

      if (pendingUploadingMessage) {
        replaceMessage(message.conversationId, pendingUploadingMessage.id, {
          ...message,
          isUploading: false,
        })
        updateConversation(message.conversationId, { lastMessage: message })
        bumpConversationToTop(message.conversationId, { lastMessage: message })
      } else {
        if (!messageAlreadyExists) {
          addMessage(message.conversationId, message)
        }
        updateConversation(message.conversationId, { lastMessage: message })
        bumpConversationToTop(message.conversationId, { lastMessage: message })
      }
    }

    const onMessageUpdated = (message: Parameters<typeof updateMessage>[2] & { id: string; conversationId: string }) => {
      updateMessage(message.conversationId, message.id, message)
    }

    const onMessageDeleted = (data: { conversationId: string; messageId: string }) => {
      deleteMessage(data.conversationId, data.messageId)
    }

    const onUserOnline = (userId: string) => {
      setUserOnline(String(userId))
    }

    const onPresenceSync = (userIds: string[]) => {
      setOnlineUsers(userIds.map((id) => String(id)))
    }

    const onUserOffline = (data: { userId: string; lastSeen?: string | null }) => {
      setUserOffline(String(data.userId), data.lastSeen ?? null)
    }

    const onTypingStart = (data: { conversationId: string; userId: string }) => {
      setTyping(data.conversationId, data.userId, true)
    }

    const onTypingStop = (data: { conversationId: string; userId: string }) => {
      setTyping(data.conversationId, data.userId, false)
    }

    const onMessagesRead = (data: { conversationId: string; messageIds: string[]; readerId: string }) => {
      markMessagesRead(data.conversationId, data.messageIds, data.readerId)

      if (data.readerId === currentUserId) {
        setConversationUnreadCount(data.conversationId, 0)
      }
    }

    const onConversationUpdated = async (conversation: { id: string; lastMessage?: Parameters<typeof addMessage>[1] | null }) => {
      const authState = useAuthStore.getState()
      const autoUnlockSecret = buildAutoUnlockSecret({
        userId: authState.user?.id,
        token: authState.token,
        refreshToken: authState.refreshToken,
      })

      if (autoUnlockSecret) {
        await tryAutoUnlockKeyring(autoUnlockSecret)
      }

      if (!conversation.lastMessage) {
        updateConversation(conversation.id, conversation)
        return
      }

      const decryptedLastMessage = await decryptMessageIfNeeded(conversation.lastMessage, currentUserId)
      updateConversation(conversation.id, {
        ...conversation,
        lastMessage: decryptedLastMessage,
      })
      bumpConversationToTop(conversation.id, {
        ...conversation,
        lastMessage: decryptedLastMessage,
      })
    }

    const onMessagesCleared = (data: { conversationId: string }) => {
      setMessages(data.conversationId, [])
      updateConversation(data.conversationId, { lastMessage: null, unreadCount: 0 })
    }

    const onConnectError = () => {
      setConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('receive_message', onReceiveMessage)
    socket.on('message_updated', onMessageUpdated)
    socket.on('message_deleted', onMessageDeleted)
    socket.on('presence_sync', onPresenceSync)
    socket.on('user_online', onUserOnline)
    socket.on('user_offline', onUserOffline)
    socket.on('typing_start', onTypingStart)
    socket.on('typing_stop', onTypingStop)
    socket.on('messages_read', onMessagesRead)
    socket.on('conversation_updated', onConversationUpdated)
    socket.on('messages_cleared', onMessagesCleared)
    socket.on('connect_error', onConnectError)

    socket.auth = { token }
    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('receive_message', onReceiveMessage)
      socket.off('message_updated', onMessageUpdated)
      socket.off('message_deleted', onMessageDeleted)
      socket.off('presence_sync', onPresenceSync)
      socket.off('user_online', onUserOnline)
      socket.off('user_offline', onUserOffline)
      socket.off('typing_start', onTypingStart)
      socket.off('typing_stop', onTypingStop)
      socket.off('messages_read', onMessagesRead)
      socket.off('conversation_updated', onConversationUpdated)
      socket.off('messages_cleared', onMessagesCleared)
      socket.off('connect_error', onConnectError)
    }
  }, [
    addMessage, replaceMessage, updateMessage, deleteMessage, bumpConversationToTop, setOnlineUsers, setUserOnline, 
    setUserOffline, setTyping, updateConversation, setConnected, markMessagesRead, setConversationUnreadCount, setMessages, token, currentUserId
  ])
}

// Emits
let typingTimeoutRef: ReturnType<typeof setTimeout> | null = null

export const sendMessage = (payload: SendMessagePayload) => {
  socket.emit('send_message', payload)
}

export const startTyping = (conversationId: string) => {
  socket.emit('typing_start', conversationId)
  
  if (typingTimeoutRef) clearTimeout(typingTimeoutRef)
  
  typingTimeoutRef = setTimeout(() => {
    socket.emit('typing_stop', conversationId)
  }, 3000)
}

export const stopTyping = (conversationId: string) => {
  socket.emit('typing_stop', conversationId)
  if (typingTimeoutRef) clearTimeout(typingTimeoutRef)
}

export const markRead = (messageIds: string[]) => {
  if (messageIds.length === 0) return
  socket.emit('mark_read', messageIds)
}

export const joinConversation = (conversationId: string) => {
  socket.emit('join_conversation', conversationId)
}

export const leaveConversation = (conversationId: string) => {
  socket.emit('leave_conversation', conversationId)
}
