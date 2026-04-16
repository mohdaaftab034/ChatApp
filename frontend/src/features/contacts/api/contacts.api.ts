import { api } from '../../../lib/axios'
import { User } from '../../../types/user.types'
import { Conversation } from '../../../types/conversation.types'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
}

export async function listContactsApi(q?: string) {
  const response = await api.get<ApiEnvelope<User[]>>('/contacts', {
    params: q ? { q } : undefined,
  })
  return response.data.data
}

export async function startDirectConversationApi(targetUserId: string) {
  const response = await api.post<ApiEnvelope<Conversation>>('/conversations/direct', { targetUserId })
  return response.data.data
}
