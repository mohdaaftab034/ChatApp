import { api } from '../../../lib/axios'
import { User } from '../../../types/user.types'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
}

type AuthPayload = {
  user: User
  token: string
  refreshToken: string
}

export async function loginApi(payload: { email: string; password: string }) {
  const response = await api.post<ApiEnvelope<AuthPayload>>('/auth/login', payload)
  return response.data.data
}

export async function signupApi(payload: { name: string; email: string; password: string }) {
  const response = await api.post<ApiEnvelope<AuthPayload>>('/auth/signup', payload)
  return response.data.data
}

export async function forgotPasswordApi(payload: { email: string }) {
  const response = await api.post<ApiEnvelope<null>>('/auth/forgot-password', payload)
  return response.data
}

export async function resetPasswordApi(payload: { email: string; otp: string; password: string }) {
  const response = await api.post<ApiEnvelope<null>>('/auth/reset-password', payload)
  return response.data
}
