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

type OtpChallengePayload = {
  requiresOtp: boolean
  mode: 'signup' | 'login'
  challengeId: string
  email: string
  expiresInSeconds: number
}

export async function loginApi(payload: { email: string; password: string }) {
  const response = await api.post<ApiEnvelope<OtpChallengePayload>>('/auth/login', payload)
  return response.data.data
}

export async function signupApi(payload: { name: string; email: string; password: string }) {
  const response = await api.post<ApiEnvelope<OtpChallengePayload>>('/auth/signup', payload)
  return response.data.data
}

export async function verifyOtpApi(payload: { challengeId: string; otp: string }) {
  const response = await api.post<ApiEnvelope<AuthPayload>>('/auth/verify-otp', payload)
  return response.data.data
}

export async function resendOtpApi(payload: { challengeId: string }) {
  const response = await api.post<ApiEnvelope<{ challengeId: string; email: string; expiresInSeconds: number }>>('/auth/resend-otp', payload)
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
