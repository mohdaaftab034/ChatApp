export type MessageType =
  | 'text' | 'image' | 'video' | 'audio'
  | 'file' | 'link' | 'location' | 'contact' | 'system'

export interface SharedContact {
  userId: string
  name: string
  username?: string
  email?: string
  phone?: string
  avatar?: string | null
}

export interface Reaction {
  emoji: string
  userIds: string[]
}

export interface ReplyTo {
  messageId: string
  text: string
  senderName: string
}

export interface EncryptedMessagePayload {
  ciphertext: string
  iv: string
  encryptedKeys: Record<string, string>
  senderKeyId?: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  type: MessageType
  text?: string
  mediaUrl?: string
  localPreviewUrl?: string
  fileName?: string
  fileSize?: number
  clientTempId?: string
  audioDuration?: number
  location?: { lat: number; lng: number; label: string }
  sharedContact?: SharedContact
  linkPreview?: { url: string; title: string; image: string }
  replyTo?: ReplyTo
  encryptedPayload?: EncryptedMessagePayload
  reactions: Reaction[]
  readBy: string[]
  deliveredTo: string[]
  isEdited: boolean
  isDeleted: boolean
  isPinned: boolean
  isStarred: boolean
  isUploading?: boolean
  createdAt: string
  updatedAt: string
}
