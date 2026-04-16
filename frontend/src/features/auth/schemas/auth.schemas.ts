import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Needs at least one uppercase letter')
    .regex(/[0-9]/, 'Needs at least one number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export type RegisterFormValues = z.infer<typeof registerSchema>

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Needs at least one uppercase letter')
    .regex(/[0-9]/, 'Needs at least one number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export const profileSetupSchema = z.object({
  username: z.string().min(3).max(20)
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores allowed'),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  status: z.enum(['online', 'away', 'busy', 'invisible']).default('online')
})

export type ProfileSetupFormValues = z.infer<typeof profileSetupSchema>
