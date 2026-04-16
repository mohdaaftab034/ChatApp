import { create } from 'zustand'
import { Conversation } from '../types/conversation.types'
import { Message, Reaction } from '../types/message.types'

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Record<string, Message[]>
  typingUsers: Record<string, string[]> // convId -> userIds
  onlineUsers: Set<string>
  pinnedMessages: Record<string, Message[]>
  searchQuery: string

  setConversations: (c: Conversation[]) => void
  addConversation: (c: Conversation) => void
  updateConversation: (id: string, partial: Partial<Conversation>) => void
  bumpConversationToTop: (id: string, partial?: Partial<Conversation>) => void
  setActiveConversation: (id: string | null) => void
  
  addMessage: (conversationId: string, msg: Message) => void
  replaceMessage: (conversationId: string, existingMessageId: string, nextMessage: Message) => void
  removeMessage: (conversationId: string, messageId: string) => void
  updateMessage: (conversationId: string, msgId: string, partial: Partial<Message>) => void
  deleteMessage: (conversationId: string, msgId: string) => void
  setMessages: (conversationId: string, msgs: Message[]) => void
  prependMessages: (conversationId: string, msgs: Message[]) => void
  setConversationUnreadCount: (conversationId: string, unreadCount: number) => void
  
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void
  setOnlineUsers: (userIds: string[]) => void
  setUserOnline: (userId: string) => void
  setUserOffline: (userId: string) => void
  addReaction: (conversationId: string, msgId: string, reaction: Reaction) => void
  markMessagesRead: (conversationId: string, messageIds: string[], readerId: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),
  pinnedMessages: {},
  searchQuery: '',

  setConversations: (c) => set({ conversations: c }),
  
  addConversation: (c) => set((state) => {
    const exists = state.conversations.some((conversation) => conversation.id === c.id)
    if (exists) {
      return {
        conversations: state.conversations.map((conversation) =>
          conversation.id === c.id ? { ...conversation, ...c } : conversation
        ),
      }
    }

    return { conversations: [c, ...state.conversations] }
  }),
  
  updateConversation: (id, partial) => set((state) => {
    const exists = state.conversations.some((conversation) => conversation.id === id)

    if (!exists) {
      return {
        conversations: [{ id, ...partial } as Conversation, ...state.conversations],
      }
    }

    return {
      conversations: state.conversations.map((conversation) =>
        conversation.id === id ? { ...conversation, ...partial } : conversation
      ),
    }
  }),

  bumpConversationToTop: (id, partial = {}) => set((state) => {
    const existingConversation = state.conversations.find((conversation) => conversation.id === id)

    if (!existingConversation) {
      return {
        conversations: [{ id, ...partial } as Conversation, ...state.conversations],
      }
    }

    return {
      conversations: [
        { ...existingConversation, ...partial },
        ...state.conversations.filter((conversation) => conversation.id !== id),
      ],
    }
  }),
  
  setActiveConversation: (id) => set({ activeConversationId: id }),
  
  addMessage: (conversationId, msg) => set((state) => {
    const existing = state.messages[conversationId] || []
    return {
      messages: {
        ...state.messages,
        [conversationId]: [...existing, msg]
      }
    }
  }),

  replaceMessage: (conversationId, existingMessageId, nextMessage) => set((state) => {
    const existing = state.messages[conversationId] || []
    return {
      messages: {
        ...state.messages,
        [conversationId]: existing.map((message) =>
          message.id === existingMessageId ? nextMessage : message
        ),
      },
    }
  }),

  removeMessage: (conversationId, messageId) => set((state) => {
    const existing = state.messages[conversationId] || []
    return {
      messages: {
        ...state.messages,
        [conversationId]: existing.filter((message) => message.id !== messageId),
      },
    }
  }),
  
  updateMessage: (conversationId, msgId, partial) => set((state) => {
    const existing = state.messages[conversationId] || []
    return {
      messages: {
        ...state.messages,
        [conversationId]: existing.map(m => m.id === msgId ? { ...m, ...partial } : m)
      }
    }
  }),
  
  deleteMessage: (conversationId, msgId) => set((state) => {
    const existing = state.messages[conversationId] || []
    return {
      messages: {
        ...state.messages,
        [conversationId]: existing.map(m => 
          m.id === msgId ? { ...m, isDeleted: true, text: 'Message deleted', mediaUrl: undefined } : m
        )
      }
    }
  }),
  
  setMessages: (conversationId, msgs) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: msgs
    }
  })),

  setConversationUnreadCount: (conversationId, unreadCount) => set((state) => ({
    conversations: state.conversations.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, unreadCount: Math.max(0, unreadCount) }
        : conversation
    ),
  })),
  
  prependMessages: (conversationId, msgs) => set((state) => {
    const existing = state.messages[conversationId] || []
    return {
      messages: {
        ...state.messages,
        [conversationId]: [...msgs, ...existing]
      }
    }
  }),
  
  setTyping: (conversationId, userId, isTyping) => set((state) => {
    const existing = state.typingUsers[conversationId] || []
    const updated = isTyping 
      ? [...new Set([...existing, userId])]
      : existing.filter(id => id !== userId)
    
    return {
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: updated
      }
    }
  }),

  setOnlineUsers: (userIds) => set((state) => {
    const liveOnlineSet = new Set(userIds)

    const updatedConversations = state.conversations.map((conversation) => ({
      ...conversation,
      participants: conversation.participants.map((participant) => {
        const isOnline = liveOnlineSet.has(participant.id)
        const nextStatus: 'online' | 'offline' = isOnline ? 'online' : 'offline'
        return {
          ...participant,
          status: nextStatus,
        }
      }),
    }))

    return {
      onlineUsers: liveOnlineSet,
      conversations: updatedConversations,
    }
  }),
  
  setUserOnline: (userId) => set((state) => {
    const newSet = new Set(state.onlineUsers)
    newSet.add(userId)
    
    // Update participant status in all conversations
    const updatedConversations = state.conversations.map(conversation => ({
      ...conversation,
      participants: conversation.participants.map(participant =>
        participant.id === userId ? { ...participant, status: 'online' as const } : participant
      )
    }))
    
    return { onlineUsers: newSet, conversations: updatedConversations }
  }),
  
  setUserOffline: (userId) => set((state) => {
    const newSet = new Set(state.onlineUsers)
    newSet.delete(userId)
    
    // Update participant status in all conversations
    const updatedConversations = state.conversations.map(conversation => ({
      ...conversation,
      participants: conversation.participants.map(participant =>
        participant.id === userId ? { ...participant, status: 'offline' as const } : participant
      )
    }))
    
    return { onlineUsers: newSet, conversations: updatedConversations }
  }),
  
  addReaction: (conversationId, msgId, reaction) => set((state) => {
    const existing = state.messages[conversationId] || []
    return {
      messages: {
        ...state.messages,
        [conversationId]: existing.map(m => {
          if (m.id !== msgId) return m
          const newReactions = [...m.reactions]
          const rxIndex = newReactions.findIndex(r => r.emoji === reaction.emoji)
          if (rxIndex >= 0) {
            newReactions[rxIndex] = reaction
          } else {
            newReactions.push(reaction)
          }
          return { ...m, reactions: newReactions }
        })
      }
    }
  }),

  markMessagesRead: (conversationId, messageIds, readerId) => set((state) => {
    const existing = state.messages[conversationId] || []
    const idSet = new Set(messageIds)

    return {
      messages: {
        ...state.messages,
        [conversationId]: existing.map((message) => {
          if (!idSet.has(message.id)) return message
          if (message.readBy.includes(readerId)) return message
          return { ...message, readBy: [...message.readBy, readerId] }
        }),
      },
    }
  })
}))
