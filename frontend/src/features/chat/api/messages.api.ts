import { api } from '../../../lib/axios'
import { Message } from '../../../types/message.types'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
}

export async function deleteMessageApi(messageId: string) {
  const response = await api.delete<ApiEnvelope<{ message: Message }>>(`/messages/${messageId}`)
  return response.data.data
}

export async function clearMessagesApi(conversationId: string) {
  const response = await api.post<ApiEnvelope<{ conversationId: string; clearedCount: number }>>('/messages/clear', {
    conversationId,
  })
  return response.data.data
}
