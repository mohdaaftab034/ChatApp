import { api } from '../../../lib/axios'
import { Conversation } from '../../../types/conversation.types'
import { Message } from '../../../types/message.types'
import { User } from '../../../types/user.types'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
}

export type MessageSearchResult = {
  messageId: string
  conversationId: string
  senderId: string
  type: Message['type']
  text: string
  createdAt: string
}

export async function listConversationsApi() {
  const response = await api.get<ApiEnvelope<Conversation[]>>('/conversations')
  return response.data.data
}

export async function listMessagesApi(conversationId: string, limit = 50) {
  const response = await api.get<ApiEnvelope<Message[]>>('/messages', {
    params: { conversationId, limit },
  })
  return response.data.data
}

export async function searchMessagesApi(conversationId: string, q: string, limit = 50) {
  const response = await api.get<ApiEnvelope<Message[]>>('/messages/search', {
    params: { conversationId, q, limit },
  })
  return response.data.data
}

export async function searchGlobalMessagesApi(
  q: string,
  options: {
    conversationId?: string
    limit?: number
    signal?: AbortSignal
  } = {}
) {
  const response = await api.get<ApiEnvelope<MessageSearchResult[]>>('/search', {
    params: {
      q,
      conversationId: options.conversationId,
      limit: options.limit ?? 30,
    },
    signal: options.signal,
  })
  return response.data.data
}

export async function uploadChatImageApi(file: File) {
  const formData = new FormData()
  formData.append('image', file)

  const response = await api.post<ApiEnvelope<{ mediaUrl: string }>>('/media/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data.data
}

export async function uploadChatDocumentApi(file: File) {
  const formData = new FormData()
  formData.append('document', file)

  const response = await api.post<ApiEnvelope<{ mediaUrl: string; fileName: string; fileSize: number; mimeType: string }>>('/media/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data.data
}

export async function uploadChatAudioApi(file: File) {
  const formData = new FormData()
  formData.append('audio', file)

  const response = await api.post<ApiEnvelope<{ mediaUrl: string; fileName: string; fileSize: number; mimeType: string }>>('/media/audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data.data
}

export async function searchAppUsersApi(q: string, limit = 30) {
  const response = await api.get<ApiEnvelope<User[]>>('/users/directory', {
    params: { q, limit },
  })
  return response.data.data
}

export async function getUserPublicKeyApi(userId: string) {
  const response = await api.get<ApiEnvelope<{ userId: string; keyId: string; publicKey: string }>>(`/users/${userId}/public-key`)
  return response.data.data
}

export async function updateMyPublicKeyApi(payload: { keyId: string; publicKey: string }) {
  const response = await api.patch<ApiEnvelope<{ userId: string; keyId: string; publicKey: string }>>('/users/me/public-key', payload)
  return response.data.data
}
