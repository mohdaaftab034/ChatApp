const { z } = require('zod')

const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Password must include an uppercase letter')
      .regex(/[0-9]/, 'Password must include a number'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Password must include an uppercase letter')
      .regex(/[0-9]/, 'Password must include a number'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
}
