const User = require('../../models/User.model')
const Contact = require('../../models/Contact.model')
const { DEFAULT_PRIVACY_SETTINGS } = require('../privacy/privacy.service')

function canViewerSeeBySetting(privacyValue, isContact) {
  if (privacyValue === 'nobody') return false
  if (privacyValue === 'contacts') return isContact
  return true
}

function toContact(userDoc, { canSeeProfilePhoto, canSeeLastSeen }) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    username: userDoc.username || '',
    email: userDoc.email,
    avatar: canSeeProfilePhoto ? userDoc.avatar : null,
    status: userDoc.status,
    lastSeen: canSeeLastSeen ? userDoc.lastSeen : null,
    bio: userDoc.bio || '',
    isVerified: userDoc.isVerified,
  }
}

async function listContacts({ userId, q = '', limit = 100 }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200)
  const search = String(q || '').trim()

  const query = {
    _id: { $ne: userId },
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  const users = await User.find(query)
    .select('_id name username email avatar status lastSeen bio isVerified privacy')
    .sort({ name: 1 })
    .limit(safeLimit)
    .lean()

  const visibilityRows = await Contact.find({
    userId: { $in: users.map((user) => String(user._id)) },
    contactId: userId,
  }).select('userId').lean()
  const targetHasViewerAsContact = new Set(visibilityRows.map((entry) => String(entry.userId)))

  return users.map((user) => {
    const isContact = targetHasViewerAsContact.has(String(user._id))
    const privacy = user.privacy || DEFAULT_PRIVACY_SETTINGS

    return toContact(user, {
      canSeeProfilePhoto: canViewerSeeBySetting(privacy.profilePhoto, isContact),
      canSeeLastSeen: canViewerSeeBySetting(privacy.lastSeen, isContact),
    })
  })
}

module.exports = { listContacts }
