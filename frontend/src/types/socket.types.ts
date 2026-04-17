import { Message } from './message.types'
import { Conversation } from './conversation.types'

export interface SendMessagePayload {
  conversationId: string
  text?: string
  mediaUrl?: string
  fileName?: string
  fileSize?: number
  audioDuration?: number
  location?: {
    lat: number
    lng: number
    label?: string
  }
  sharedContact?: {
    userId: string
    name: string
    username?: string
    email?: string
    phone?: string
    avatar?: string | null
  }
  encryptedPayload?: {
    ciphertext: string
    iv: string
    encryptedKeys: Record<string, string>
    senderKeyId?: string
  }
  clientTempId?: string
  type: Message['type']
  replyToId?: string
  participantIds?: string[]
}

export interface ClientToServerEvents {
  send_message: (data: SendMessagePayload) => void
  typing_start: (conversationId: string) => void
  typing_stop: (conversationId: string) => void
  mark_read: (messageIds: string[]) => void
  join_conversation: (conversationId: string) => void
  leave_conversation: (conversationId: string) => void
}

export interface ServerToClientEvents {
  receive_message: (message: Message) => void
  message_updated: (message: Message) => void
  message_deleted: (data: { messageId: string; conversationId: string }) => void
  presence_sync: (userIds: string[]) => void
  user_online: (userId: string) => void
  user_offline: (data: { userId: string; lastSeen: string }) => void
  typing_start: (data: { userId: string; conversationId: string }) => void
  typing_stop: (data: { userId: string; conversationId: string }) => void
  messages_read: (data: { messageIds: string[]; readerId: string; conversationId: string }) => void
  conversation_updated: (conversation: Conversation) => void
  messages_cleared: (data: { conversationId: string }) => void
}


