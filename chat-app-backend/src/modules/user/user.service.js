const User = require('../../models/User.model')
const cloudinary = require('../../config/cloudinary')
const { getBlockState } = require('../../utils/blocking')
const privacyService = require('../privacy/privacy.service')
const Contact = require('../../models/Contact.model')

function normalizeExternalUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)
    ? raw
    : `https://${raw.replace(/^\/+/, '')}`

  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

function toProfile(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    username: userDoc.username || '',
    avatar: userDoc.avatar,
    status: userDoc.status,
    headline: userDoc.headline || 'Chat app member',
    bio: userDoc.bio || '',
    email: userDoc.email,
    phone: userDoc.phone || '',
    location: userDoc.location || '',
    department: userDoc.department || '',
    role: userDoc.jobTitle || 'Member', 
    joinedAt: userDoc.createdAt,
    social: {
      website: userDoc.social?.website || '',
      linkedin: userDoc.social?.linkedin || '',
      x: userDoc.social?.x || '',
    },
  } 
}

async function uploadAvatarToCloudinary(file) {
  const base64 = file.buffer.toString('base64')
  const dataUri = `data:${file.mimetype};base64,${base64}`

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: 'chat-app/avatars',
    resource_type: 'image',
  })

  return uploaded.secure_url
}

async function getMyProfile(userId) {
  const user = await User.findById(userId).select('-password')
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return toProfile(user)
}

async function getProfileById(viewerId, userId) {
  const user = await User.findById(userId).select('-password')
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  const blockState = await getBlockState(viewerId, userId)
  if (blockState.isBlocked) {
    return {
      id: user._id.toString(),
      name: user.name,
      username: user.username || '',
      avatar: user.avatar,
      status: 'offline',
      headline: '',
      bio: 'Profile is unavailable',
      email: '',
      phone: '',
      location: '',
      department: '',
      role: '',
      joinedAt: user.createdAt,
      social: {
        website: '',
        linkedin: '',
        x: '',
      },
      isBlocked: true,
    }
  }

  // If viewing own profile, show all info
  if (viewerId === userId) {
    return { ...toProfile(user), isBlocked: false }
  }

  // Apply privacy settings for viewing other user's profile
  const profile = { ...toProfile(user), isBlocked: false }

  // Check if viewer is a contact (for privacy decisions)
  const isContact = await Contact.findOne({
    userId: user._id,
    contactId: viewerId,
  })

  // Helper function to check if info should be visible
  const canViewInfo = (privacySettingValue) => {
    if (privacySettingValue === 'everyone') return true
    if (privacySettingValue === 'nobody') return false
    if (privacySettingValue === 'contacts') return !!isContact
    return true
  }

  // Apply privacy settings
  const privacy = user.privacy || privacyService.DEFAULT_PRIVACY_SETTINGS

  // Hide profile photo if privacy setting is restrictive
  if (!canViewInfo(privacy.profilePhoto)) {
    profile.avatar = null
  }

  // Hide about info (bio, headline, location, dept, social) if privacy setting is restrictive
  if (!canViewInfo(privacy.aboutInfo)) {
    profile.bio = ''
    profile.headline = ''
    profile.location = ''
    profile.department = ''
    profile.social = {
      website: '',
      linkedin: '',
      x: '',
    }
  }

  return profile
}

async function listDirectoryUsers(requesterId, { q = '', limit = 30 } = {}) {
  const normalizedQuery = String(q || '').trim()
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100)

  const criteria = {
    _id: { $ne: requesterId },
  }

  if (normalizedQuery) {
    criteria.$or = [
      { name: { $regex: normalizedQuery, $options: 'i' } },
      { username: { $regex: normalizedQuery, $options: 'i' } },
      { email: { $regex: normalizedQuery, $options: 'i' } },
      { phone: { $regex: normalizedQuery, $options: 'i' } },
    ]
  }

  const users = await User.find(criteria)
    .select('_id name username email avatar status lastSeen bio isVerified phone privacy')
    .sort({ name: 1 })
    .limit(safeLimit)
    .lean()

  const visibilityRows = await Contact.find({
    userId: { $in: users.map((user) => user._id) },
    contactId: requesterId,
  }).select('userId').lean()
  const targetHasViewerAsContact = new Set(visibilityRows.map((row) => row.userId.toString()))

  return users.map((user) => {
    const privacy = user.privacy || privacyService.DEFAULT_PRIVACY_SETTINGS
    const isContact = targetHasViewerAsContact.has(user._id.toString())

    const canViewBySetting = (privacySettingValue) => {
      if (privacySettingValue === 'nobody') return false
      if (privacySettingValue === 'contacts') return isContact
      return true
    }

    const result = {
      id: user._id.toString(),
      name: user.name,
      username: user.username || '',
      email: user.email,
      avatar: canViewBySetting(privacy.profilePhoto) ? user.avatar : null,
      status: user.status,
      bio: user.bio || '',
      isVerified: Boolean(user.isVerified),
      phone: user.phone || '',
    }

    // Apply privacy settings for lastSeen
    const canViewLastSeen = canViewBySetting(privacy.lastSeen)

    result.lastSeen = canViewLastSeen ? user.lastSeen : null

    return result
  })
}

async function updateMyProfile(userId, payload, file) {
  const user = await User.findById(userId)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  const allowedStatus = ['online', 'away', 'busy', 'invisible']

  if (typeof payload.email === 'string') {
    const normalizedEmail = payload.email.trim().toLowerCase()
    if (normalizedEmail && normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail })
      if (existing) {
        const error = new Error('Email is already in use')
        error.statusCode = 409
        throw error
      }
      user.email = normalizedEmail
    }
  }

  if (typeof payload.name === 'string') user.name = payload.name.trim()
  if (typeof payload.username === 'string') user.username = payload.username.trim().toLowerCase()
  if (typeof payload.bio === 'string') user.bio = payload.bio.trim()
  if (typeof payload.headline === 'string') user.headline = payload.headline.trim()
  if (typeof payload.phone === 'string') user.phone = payload.phone.trim()
  if (typeof payload.location === 'string') user.location = payload.location.trim()
  if (typeof payload.department === 'string') user.department = payload.department.trim()
  if (typeof payload.jobTitle === 'string') user.jobTitle = payload.jobTitle.trim()

  if (typeof payload.status === 'string' && allowedStatus.includes(payload.status)) {
    user.status = payload.status
  }

  user.social = {
    website: typeof payload.website === 'string' ? normalizeExternalUrl(payload.website) : (user.social?.website || ''),
    linkedin: typeof payload.linkedin === 'string' ? normalizeExternalUrl(payload.linkedin) : (user.social?.linkedin || ''),
    x: typeof payload.x === 'string' ? normalizeExternalUrl(payload.x) : (user.social?.x || ''),
  }

  if (file) {
    user.avatar = await uploadAvatarToCloudinary(file)
  }

  await user.save()

  return toProfile(user)
}

async function updateMyPublicKey(userId, payload) {
  const publicKey = String(payload?.publicKey || '').trim()
  const keyId = String(payload?.keyId || '').trim()

  if (!publicKey || !keyId) {
    const error = new Error('publicKey and keyId are required')
    error.statusCode = 400
    throw error
  }

  const user = await User.findById(userId)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  const history = Array.isArray(user.e2ee?.keyHistory) ? user.e2ee.keyHistory : []
  const existing = history.find((entry) => entry.keyId === keyId)

  if (existing) {
    existing.publicKey = publicKey
    existing.createdAt = existing.createdAt || new Date()
  } else {
    history.push({ keyId, publicKey, createdAt: new Date() })
  }

  user.e2ee = {
    activeKeyId: keyId,
    publicKey,
    keyHistory: history,
  }

  await user.save()

  return {
    userId: user._id.toString(),
    keyId,
    publicKey,
  }
}

async function blockUser(userId, targetUserId) {
  if (!targetUserId || targetUserId === userId) {
    const error = new Error('Invalid user to block')
    error.statusCode = 400
    throw error
  }

  const target = await User.findById(targetUserId).select('_id').lean()
  if (!target) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  await User.updateOne(
    { _id: userId },
    { $addToSet: { blockedUserIds: targetUserId } }
  )

  return { blockedUserId: targetUserId }
}

async function unblockUser(userId, targetUserId) {
  if (!targetUserId || targetUserId === userId) {
    const error = new Error('Invalid user to unblock')
    error.statusCode = 400
    throw error
  }

  await User.updateOne(
    { _id: userId },
    { $pull: { blockedUserIds: targetUserId } }
  )

  return { unblockedUserId: targetUserId }
}

async function getUserPublicKey(userId) {
  const user = await User.findById(userId).select('_id e2ee')
  if (!user || !user.e2ee?.publicKey || !user.e2ee?.activeKeyId) {
    const error = new Error('Public key not found for user')
    error.statusCode = 404
    throw error
  }

  return {
    userId: user._id.toString(),
    keyId: user.e2ee.activeKeyId,
    publicKey: user.e2ee.publicKey,
  }
}

module.exports = {
  getMyProfile,
  getProfileById,
  listDirectoryUsers,
  updateMyProfile,
  blockUser,
  unblockUser,
  updateMyPublicKey,
  getUserPublicKey,
}
