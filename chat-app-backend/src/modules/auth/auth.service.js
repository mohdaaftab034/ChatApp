const User = require('../../models/User.model')
const OTP = require('../../models/OTP.model')
const crypto = require('crypto')
const { hashPassword, comparePassword } = require('../../utils/hash')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt')
const { generateOtp } = require('../../utils/otp')
const { sendEmail } = require('../../utils/email')
const { getRedis } = require('../../config/redis')

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildOtpEmailTemplate({
  appName = 'Chat App',
  heading,
  intro,
  code,
  expiresInMinutes = 10,
  email,
  actionLabel,
  securityNote,
}) {
  const safeCode = escapeHtml(code)
  const safeEmail = escapeHtml(email)
  const safeHeading = escapeHtml(heading)
  const safeIntro = escapeHtml(intro)
  const safeActionLabel = escapeHtml(actionLabel)
  const safeSecurityNote = escapeHtml(securityNote)
  const safeAppName = escapeHtml(appName)

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeHeading}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;background:linear-gradient(135deg,#0ea5e9 0%,#2563eb 100%);color:#ffffff;">
                <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">${safeAppName} Security</p>
                <h1 style="margin:0;font-size:24px;line-height:1.3;">${safeHeading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;">${safeIntro}</p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px 0;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;text-align:center;">
                      <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;">One-Time Password</p>
                      <p style="margin:0;font-size:34px;line-height:1;font-weight:700;letter-spacing:6px;color:#0f172a;">${safeCode}</p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px 0;">
                  <tr>
                    <td style="padding:0 0 10px 0;font-size:14px;color:#334155;">
                      <strong>Action:</strong> ${safeActionLabel}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 0 10px 0;font-size:14px;color:#334155;">
                      <strong>Sent to:</strong> ${safeEmail}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0;font-size:14px;color:#334155;">
                      <strong>Expires in:</strong> ${expiresInMinutes} minutes
                    </td>
                  </tr>
                </table>

                <div style="padding:14px 16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;margin:0 0 16px 0;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#9a3412;">
                    <strong>Security tip:</strong> ${safeSecurityNote}
                  </p>
                </div>

                <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">
                  If you did not request this code, you can safely ignore this email. For your protection, never share this OTP with anyone.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">
                  This is an automated message from ${safeAppName}. Please do not reply directly to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `
}

function buildPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username || '',
    email: user.email,
    avatar: user.avatar,
    status: user.status,
    lastSeen: user.lastSeen,
    bio: user.bio,
    isVerified: user.isVerified,
    role: user.role,
  }
}

function buildAuthTokens(user) {
  const payload = {
    sub: user._id.toString(),
    role: user.role,
    email: user.email,
  }

  return {
    token: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  }
}

async function persistRefreshToken(userId, refreshToken) {
  const redis = getRedis()
  if (!redis) return
  await redis.set(`refresh:${userId}`, refreshToken)
}

async function sendAuthOtpChallenge({ email, purpose, metadata }) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const challengeId = crypto.randomUUID()
  const code = generateOtp(6)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await OTP.deleteMany({
    email: normalizedEmail,
    purpose,
    usedAt: null,
  })

  await OTP.create({
    email: normalizedEmail,
    challengeId,
    code,
    purpose,
    metadata,
    expiresAt,
  })

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Your verification code',
      html: buildOtpEmailTemplate({
        heading: 'Verify your sign in',
        intro: 'Use the OTP below to continue securely to your account.',
        code,
        expiresInMinutes: 10,
        email: normalizedEmail,
        actionLabel: purpose === 'auth_signup' ? 'Complete account registration' : 'Complete account login',
        securityNote: 'Our support team will never ask for this code via chat, phone, or email.',
      }),
    })
  } catch (error) {
    const mailError = new Error('Unable to send OTP email')
    mailError.statusCode = 502
    mailError.cause = error
    throw mailError
  }

  return {
    challengeId,
    email: normalizedEmail,
    expiresInSeconds: 600,
  }
}

async function resendOtp({ challengeId }) {
  const otpRecord = await OTP.findOne({
    challengeId,
    usedAt: null,
    purpose: { $in: ['auth_signup', 'auth_login'] },
  }).sort({ createdAt: -1 })

  if (!otpRecord) {
    const error = new Error('OTP challenge not found or expired')
    error.statusCode = 404
    throw error
  }

  const code = generateOtp(6)
  otpRecord.code = code
  otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  otpRecord.markModified('metadata')
  await otpRecord.save()

  try {
    await sendEmail({
      to: otpRecord.email,
      subject: 'Your verification code',
      html: buildOtpEmailTemplate({
        heading: 'Your new verification code',
        intro: 'You requested a new OTP. Use this latest code to continue.',
        code,
        expiresInMinutes: 10,
        email: otpRecord.email,
        actionLabel: 'Continue verification',
        securityNote: 'Only the most recently sent OTP is valid.',
      }),
    })
  } catch (error) {
    const mailError = new Error('Unable to resend OTP email')
    mailError.statusCode = 502
    mailError.cause = error
    throw mailError
  }

  return {
    challengeId: otpRecord.challengeId,
    email: otpRecord.email,
    expiresInSeconds: 600,
  }
}

async function signup({ name, email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    const error = new Error('Email is already registered')
    error.statusCode = 409
    throw error
  }

  const hashedPassword = await hashPassword(password)

  const challenge = await sendAuthOtpChallenge({
    email: normalizedEmail,
    purpose: 'auth_signup',
    metadata: {
      name: String(name || '').trim(),
      passwordHash: hashedPassword,
    },
  })

  return {
    requiresOtp: true,
    mode: 'signup',
    ...challenge,
  }
}

async function login({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  const isPasswordValid = await comparePassword(password, user.password)
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  const challenge = await sendAuthOtpChallenge({
    email: normalizedEmail,
    purpose: 'auth_login',
    metadata: {
      userId: user._id.toString(),
    },
  })

  return {
    requiresOtp: true,
    mode: 'login',
    ...challenge,
  }
}

async function verifyOtp({ challengeId, otp }) {
  const otpRecord = await OTP.findOne({
    challengeId,
    code: otp,
    usedAt: null,
    purpose: { $in: ['auth_signup', 'auth_login'] },
  }).sort({ createdAt: -1 })

  if (!otpRecord || otpRecord.expiresAt.getTime() < Date.now()) {
    const error = new Error('Invalid or expired OTP')
    error.statusCode = 400
    throw error
  }

  let user = null

  if (otpRecord.purpose === 'auth_signup') {
    const existing = await User.findOne({ email: otpRecord.email })
    if (existing) {
      const error = new Error('Email is already registered')
      error.statusCode = 409
      throw error
    }

    const name = String(otpRecord.metadata?.name || '').trim()
    const passwordHash = String(otpRecord.metadata?.passwordHash || '')

    if (!name || !passwordHash) {
      const error = new Error('Invalid signup verification challenge')
      error.statusCode = 400
      throw error
    }

    user = await User.create({
      name,
      email: otpRecord.email,
      password: passwordHash,
      isVerified: true,
    })
  } else {
    const userId = String(otpRecord.metadata?.userId || '')
    user = userId ? await User.findById(userId) : null

    if (!user) {
      const error = new Error('User not found')
      error.statusCode = 404
      throw error
    }
  }

  otpRecord.usedAt = new Date()
  await otpRecord.save()

  const tokens = buildAuthTokens(user)
  await persistRefreshToken(user._id.toString(), tokens.refreshToken)

  return { user: buildPublicUser(user), ...tokens }
}

async function forgotPassword({ email }) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    return { message: 'If this email exists, a reset code has been sent' }
  }

  const code = generateOtp(6)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await OTP.create({ email: normalizedEmail, code, purpose: 'reset_password', expiresAt })
  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Your password reset code',
      html: buildOtpEmailTemplate({
        heading: 'Reset your password',
        intro: 'Use this OTP to verify your identity before setting a new password.',
        code,
        expiresInMinutes: 10,
        email: normalizedEmail,
        actionLabel: 'Reset account password',
        securityNote: 'Choose a strong new password and avoid reusing old passwords.',
      }),
    })
  } catch (error) {
    const mailError = new Error('Unable to send password reset email')
    mailError.statusCode = 502
    mailError.cause = error
    throw mailError
  }

  return { message: 'If this email exists, a reset code has been sent' }
}

async function resetPassword({ email, otp, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const otpRecord = await OTP.findOne({ email: normalizedEmail, code: otp, purpose: 'reset_password', usedAt: null })
    .sort({ createdAt: -1 })

  if (!otpRecord || otpRecord.expiresAt.getTime() < Date.now()) {
    const error = new Error('Invalid or expired OTP')
    error.statusCode = 400
    throw error
  }

  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  user.password = await hashPassword(password)
  await user.save()

  otpRecord.usedAt = new Date()
  await otpRecord.save()

  return { message: 'Password reset successfully' }
}

async function refreshToken({ refreshToken }) {
  if (!refreshToken) {
    const error = new Error('Refresh token is required')
    error.statusCode = 401
    throw error
  }

  const payload = verifyRefreshToken(refreshToken)

  const redis = getRedis()
  if (redis) {
    const stored = await redis.get(`refresh:${payload.sub}`)
    if (!stored || stored !== refreshToken) {
      const error = new Error('Invalid refresh token')
      error.statusCode = 401
      throw error
    }
  }

  const user = await User.findById(payload.sub)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  const tokens = buildAuthTokens(user)
  await persistRefreshToken(user._id.toString(), tokens.refreshToken)

  return { user: buildPublicUser(user), ...tokens }
}

async function me({ userId }) {
  const user = await User.findById(userId)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return buildPublicUser(user)
}

module.exports = {
  signup,
  login,
  verifyOtp,
  forgotPassword,
  resetPassword,
  refreshToken,
  me,
}
