import { api } from '../../../lib/axios'

export type ProfileData = {
  id: string
  name: string
  username: string
  avatar: string | null
  status: 'online' | 'offline' | 'away' | 'busy' | 'invisible'
  headline: string
  bio: string
  email: string
  phone: string
  location: string
  department: string
  role: string
  joinedAt: string
  social: {
    website: string
    linkedin: string
    x: string
  }
}

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
}

export async function getMyProfileApi() {
  const response = await api.get<ApiEnvelope<ProfileData>>('/users/me')
  return response.data.data
}

export async function getProfileByIdApi(userId: string) {
  const response = await api.get<ApiEnvelope<ProfileData>>(`/users/${userId}`)
  return response.data.data
}

export async function updateMyProfileApi(payload: {
  name?: string
  email?: string
  username?: string
  bio?: string
  headline?: string
  phone?: string
  location?: string
  department?: string
  jobTitle?: string
  status?: string
  website?: string
  linkedin?: string
  x?: string
  avatar?: File | null
}) {
  const formData = new FormData()

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (key === 'avatar' && value instanceof File) {
      formData.append('avatar', value)
      return
    }

    formData.append(key, String(value))
  })

  const response = await api.patch<ApiEnvelope<ProfileData>>('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data.data
}
