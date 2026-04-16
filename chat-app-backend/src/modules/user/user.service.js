const User = require('../../models/User.model')
const cloudinary = require('../../config/cloudinary')

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

async function getProfileById(userId) {
  const user = await User.findById(userId).select('-password')
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return toProfile(user)
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
    .select('_id name username email avatar status lastSeen bio isVerified phone')
    .sort({ name: 1 })
    .limit(safeLimit)
    .lean()

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    username: user.username || '',
    email: user.email,
    avatar: user.avatar,
    status: user.status,
    lastSeen: user.lastSeen,
    bio: user.bio || '',
    isVerified: Boolean(user.isVerified),
    phone: user.phone || '',
  }))
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
    website: typeof payload.website === 'string' ? payload.website.trim() : (user.social?.website || ''),
    linkedin: typeof payload.linkedin === 'string' ? payload.linkedin.trim() : (user.social?.linkedin || ''),
    x: typeof payload.x === 'string' ? payload.x.trim() : (user.social?.x || ''),
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
  updateMyPublicKey,
  getUserPublicKey,
}
