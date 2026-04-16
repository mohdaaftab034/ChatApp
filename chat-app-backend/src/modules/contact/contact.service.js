const User = require('../../models/User.model')

function toContact(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    username: userDoc.username || '',
    email: userDoc.email,
    avatar: userDoc.avatar,
    status: userDoc.status,
    lastSeen: userDoc.lastSeen,
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
    .select('_id name username email avatar status lastSeen bio isVerified')
    .sort({ name: 1 })
    .limit(safeLimit)
    .lean()

  return users.map(toContact)
}

module.exports = { listContacts }
