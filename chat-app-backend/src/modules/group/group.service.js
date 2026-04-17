const crypto = require('crypto')
const Conversation = require('../../models/Conversation.model')
const User = require('../../models/User.model')
const cloudinary = require('../../config/cloudinary')
const Contact = require('../../models/Contact.model')
const { DEFAULT_PRIVACY_SETTINGS } = require('../privacy/privacy.service')

function canViewerSeeBySetting(privacyValue, isContact) {
  if (privacyValue === 'nobody') return false
  if (privacyValue === 'contacts') return isContact
  return true
}

function toParticipant(userDoc, { canSeeLastSeen, canSeeProfilePhoto }) {
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

function toConversationPayload(conversation, userId, participantMap) {
  return {
    id: conversation._id,
    type: 'group',
    participants: (conversation.participantIds || []).map((id) => participantMap.get(id)).filter(Boolean),
    lastMessage: conversation.lastMessage || null,
    unreadCount: Number(conversation.unreadBy?.[userId] || 0),
    isPinned: Boolean(conversation.isPinned),
    isMuted: Boolean(conversation.isMuted),
    isArchived: Boolean(conversation.isArchived),
    createdAt: conversation.createdAt,
    group: conversation.group || undefined,
  }
}

async function hydrate(conversations, userId) {
  const participantIds = [...new Set(conversations.flatMap((conversation) => conversation.participantIds || []))]
  const userIdStr = String(userId)
  const users = await User.find({ _id: { $in: participantIds } })
    .select('_id name username email avatar status lastSeen bio isVerified privacy')
    .lean()

  const visibilityRows = await Contact.find({
    userId: { $in: participantIds.map((id) => String(id)) },
    contactId: userIdStr,
  }).select('userId').lean()
  const targetHasViewerAsContact = new Set(visibilityRows.map((entry) => String(entry.userId)))

  const participantMap = new Map(
    users.map((participant) => {
      const participantId = String(participant._id)
      const isSelf = participantId === userIdStr
      const isContact = targetHasViewerAsContact.has(participantId)
      const privacy = participant.privacy || DEFAULT_PRIVACY_SETTINGS

      const canSeeLastSeen = isSelf
        ? true
        : canViewerSeeBySetting(privacy.lastSeen, isContact)

      const canSeeProfilePhoto = isSelf
        ? true
        : canViewerSeeBySetting(privacy.profilePhoto, isContact)

      return [
        participantId,
        toParticipant(participant, {
          canSeeLastSeen,
          canSeeProfilePhoto,
        }),
      ]
    })
  )

  return conversations.map((conversation) => toConversationPayload(conversation, userId, participantMap))
}

async function listByUser({ userId, limit = 100 }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200)
  const groups = await Conversation.find({
    type: 'group',
    participantIds: userId,
  })
    .sort({ updatedAt: -1 })
    .limit(safeLimit)
    .lean()

  if (groups.length === 0) return []
  return hydrate(groups, userId)
}

async function createGroup({ creatorId, name, memberIds, description }) {
  const requestedMembers = [...new Set((memberIds || []).filter(Boolean))]
  const participantIds = [...new Set([creatorId, ...requestedMembers])]

  const existingUsers = await User.find({ _id: { $in: participantIds } }).select('_id').lean()
  const existingUserIds = new Set(existingUsers.map((user) => user._id.toString()))

  const missing = participantIds.filter((id) => !existingUserIds.has(id))
  if (missing.length > 0) {
    const error = new Error('Some selected users were not found')
    error.statusCode = 400
    throw error
  }

  const unreadBy = Object.fromEntries(participantIds.map((id) => [id, 0]))

  const conversation = await Conversation.create({
    _id: `conv-${crypto.randomUUID()}`,
    type: 'group',
    participantIds,
    unreadBy,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    lastMessage: null,
    group: {
      name,
      avatar: null,
      description: description || '',
      adminIds: [creatorId],
      inviteLink: '',
      settings: {
        whoCanSend: 'all',
        whoCanAdd: 'admins',
      },
    },
  })

  const [result] = await hydrate([conversation.toObject()], creatorId)
  return result
}

async function uploadAvatarToCloudinary(file) {
  const base64 = file.buffer.toString('base64')
  const dataUri = `data:${file.mimetype};base64,${base64}`

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: 'chat-app/group-avatars',
    resource_type: 'image',
  })

  return uploaded.secure_url
}

async function updateGroup({ updaterId, groupId, payload, file }) {
  const conversation = await Conversation.findOne({
    _id: groupId,
    type: 'group',
    participantIds: updaterId,
  })

  if (!conversation) {
    const error = new Error('Group not found')
    error.statusCode = 404
    throw error
  }

  if (!Array.isArray(conversation.group?.adminIds) || !conversation.group.adminIds.includes(updaterId)) {
    const error = new Error('Only group admins can update group settings')
    error.statusCode = 403
    throw error
  }

  if (typeof payload.name === 'string' && payload.name.trim()) {
    conversation.group.name = payload.name.trim()
  }

  if (typeof payload.description === 'string') {
    conversation.group.description = payload.description.trim()
  }

  if (typeof payload.whoCanSend === 'string' && ['all', 'admins'].includes(payload.whoCanSend)) {
    conversation.group.settings.whoCanSend = payload.whoCanSend
  }

  if (typeof payload.whoCanAdd === 'string' && ['all', 'admins'].includes(payload.whoCanAdd)) {
    conversation.group.settings.whoCanAdd = payload.whoCanAdd
  }

  if (file) {
    conversation.group.avatar = await uploadAvatarToCloudinary(file)
  }

  await conversation.save()

  const [result] = await hydrate([conversation.toObject()], updaterId)
  return result
}

async function addMembers({ actorId, groupId, memberIds }) {
  const conversation = await Conversation.findOne({
    _id: groupId,
    type: 'group',
    participantIds: actorId,
  })

  if (!conversation) {
    const error = new Error('Group not found')
    error.statusCode = 404
    throw error
  }

  const isAdmin = Array.isArray(conversation.group?.adminIds) && conversation.group.adminIds.includes(actorId)
  const whoCanAdd = conversation.group?.settings?.whoCanAdd || 'all'

  if (whoCanAdd === 'admins' && !isAdmin) {
    const error = new Error('Only group admins can add members')
    error.statusCode = 403
    throw error
  }

  const requestedIds = [...new Set((memberIds || []).filter(Boolean))]
  const existingParticipantIds = new Set(conversation.participantIds || [])
  const idsToAdd = requestedIds.filter((id) => !existingParticipantIds.has(id))

  if (idsToAdd.length === 0) {
    const error = new Error('All selected users are already in the group')
    error.statusCode = 400
    throw error
  }

  const existingUsers = await User.find({ _id: { $in: idsToAdd } }).select('_id').lean()
  const existingUserIds = new Set(existingUsers.map((user) => user._id.toString()))

  const missing = idsToAdd.filter((id) => !existingUserIds.has(id))
  if (missing.length > 0) {
    const error = new Error('Some selected users were not found')
    error.statusCode = 400
    throw error
  }

  conversation.participantIds = [...existingParticipantIds, ...idsToAdd]

  for (const id of idsToAdd) {
    conversation.unreadBy.set(id, 0)
  }

  await conversation.save()

  const [result] = await hydrate([conversation.toObject()], actorId)
  return result
}

module.exports = { listByUser, createGroup, updateGroup, addMembers }
