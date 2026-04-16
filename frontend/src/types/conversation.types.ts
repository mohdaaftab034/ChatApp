import { User } from './user.types'
import { Message } from './message.types'

export interface Conversation {
  id: string
  type: 'direct' | 'group'
  participants: User[]
  lastMessage: Message | null
  unreadCount: number
  isPinned: boolean
  isMuted: boolean
  isArchived: boolean
  createdAt: string
  group?: {
    name: string
    avatar: string | null
    description: string
    adminIds: string[]
    inviteLink: string
    settings: {
      whoCanSend: 'all' | 'admins'
      whoCanAdd: 'all' | 'admins'
    }
  }
}
