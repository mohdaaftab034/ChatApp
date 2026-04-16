import { api } from '../../../lib/axios'
import { Conversation } from '../../../types/conversation.types'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
}

export async function createGroupApi(payload: { name: string; memberIds: string[]; description?: string }) {
  const response = await api.post<ApiEnvelope<Conversation>>('/groups', payload)
  return response.data.data
}

export async function updateGroupApi(payload: {
  groupId: string
  name?: string
  description?: string
  whoCanSend?: 'all' | 'admins'
  whoCanAdd?: 'all' | 'admins'
  avatar?: File | null
}) {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'groupId') return
    if (value === undefined || value === null || value === '') return
    if (key === 'avatar' && value instanceof File) {
      formData.append('avatar', value)
      return
    }

    formData.append(key, String(value))
  })

  const response = await api.patch<ApiEnvelope<Conversation>>(`/groups/${payload.groupId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data.data
}

export async function listGroupsApi(limit = 100) {
  const response = await api.get<ApiEnvelope<Conversation[]>>('/groups', {
    params: { limit },
  })
  return response.data.data
}

export async function addGroupMembersApi(payload: { groupId: string; memberIds: string[] }) {
  const response = await api.post<ApiEnvelope<Conversation>>(`/groups/${payload.groupId}/members`, {
    memberIds: payload.memberIds,
  })
  return response.data.data
}
