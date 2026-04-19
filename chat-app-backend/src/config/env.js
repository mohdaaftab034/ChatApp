const { z } = require('zod')
const dotenv = require('dotenv')

dotenv.config()

function normalizeCredential(value) {
  return String(value || '').replace(/\s+/g, '').trim()
}

const hasNodemailerCredentials = Boolean(
  process.env.NODEMAILER_EMAIL ||
  process.env.nodemailer_email ||
  process.env.NODEMAILER_PASS ||
  process.env.nodemailer_pass
)

const mergedEnv = {
  ...process.env,
  SMTP_HOST: hasNodemailerCredentials
    ? (process.env.NODEMAILER_HOST || process.env.nodemailer_host || 'smtp.gmail.com')
    : (process.env.SMTP_HOST || 'smtp.gmail.com'),
  SMTP_PORT: hasNodemailerCredentials
    ? (process.env.NODEMAILER_PORT || process.env.nodemailer_port || '465')
    : (process.env.SMTP_PORT || '587'),
  SMTP_USER: normalizeCredential(process.env.NODEMAILER_EMAIL || process.env.nodemailer_email || process.env.SMTP_USER),
  SMTP_PASS: normalizeCredential(process.env.NODEMAILER_PASS || process.env.nodemailer_pass || process.env.SMTP_PASS),
  SMTP_FROM: hasNodemailerCredentials
    ? (
      process.env.NODEMAILER_FROM
      || process.env.nodemailer_from
      || process.env.NODEMAILER_EMAIL
      || process.env.nodemailer_email
      || process.env.SMTP_FROM
    )
    : (
      process.env.SMTP_FROM
      || process.env.NODEMAILER_EMAIL
      || process.env.nodemailer_email
    ),
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api'),
  CLIENT_URL: z.string().url(),
  CLIENT_URLS: z.string().optional().default(''),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  REDIS_URL: z.string().min(1).optional().default(''),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(2525),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().email(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
}) 


const parsed = envSchema.safeParse(mergedEnv)

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`)
}

module.exports = parsed.data
