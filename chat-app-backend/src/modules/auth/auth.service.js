const User = require('../../models/User.model')
const OTP = require('../../models/OTP.model')
const { hashPassword, comparePassword } = require('../../utils/hash')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt')
const { generateOtp } = require('../../utils/otp')
const { sendEmail } = require('../../utils/email')
const { getRedis } = require('../../config/redis')

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

async function signup({ name, email, password }) {
  const existing = await User.findOne({ email })
  if (existing) {
    const error = new Error('Email is already registered')
    error.statusCode = 409
    throw error
  }

  const hashedPassword = await hashPassword(password)
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified: true,
  })

  const tokens = buildAuthTokens(user)
  await persistRefreshToken(user._id.toString(), tokens.refreshToken)

  return { user: buildPublicUser(user), ...tokens }
}

async function login({ email, password }) {
  const user = await User.findOne({ email })
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

  const tokens = buildAuthTokens(user)
  await persistRefreshToken(user._id.toString(), tokens.refreshToken)

  return { user: buildPublicUser(user), ...tokens }
}

async function forgotPassword({ email }) {
  const user = await User.findOne({ email })
  if (!user) {
    return { message: 'If this email exists, a reset code has been sent' }
  }

  const code = generateOtp(6)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await OTP.create({ email, code, purpose: 'reset_password', expiresAt })
  await sendEmail({
    to: email,
    subject: 'Your password reset code',
    html: `<p>Your password reset code is <b>${code}</b>. It expires in 10 minutes.</p>`,
  })

  return { message: 'If this email exists, a reset code has been sent' }
}

async function resetPassword({ email, otp, password }) {
  const otpRecord = await OTP.findOne({ email, code: otp, purpose: 'reset_password', usedAt: null })
    .sort({ createdAt: -1 })

  if (!otpRecord || otpRecord.expiresAt.getTime() < Date.now()) {
    const error = new Error('Invalid or expired OTP')
    error.statusCode = 400
    throw error
  }

  const user = await User.findOne({ email })
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
  forgotPassword,
  resetPassword,
  refreshToken,
  me,
}
