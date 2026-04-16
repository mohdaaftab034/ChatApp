const Conversation = require('../../models/Conversation.model')
const User = require('../../models/User.model')
const crypto = require('crypto')

function toParticipant(userDoc) {
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

function toConversationPayload(conversation, userId, participantMap) {
  const participantsForConversation = (conversation.participantIds || [])
    .map((id) => participantMap.get(id))
    .filter(Boolean)

  return {
    id: conversation._id,
    type: conversation.type || 'direct',
    participants: participantsForConversation,
    lastMessage: conversation.lastMessage || null,
    unreadCount: Number(conversation.unreadBy?.[userId] || 0),
    isPinned: Boolean(conversation.isPinned),
    isMuted: Boolean(conversation.isMuted),
    isArchived: Boolean(conversation.isArchived),
    createdAt: conversation.createdAt,
    group: conversation.group || undefined,
  }
}

async function hydrateConversations(conversations, userId) {
  const participantIds = [...new Set(conversations.flatMap((c) => c.participantIds || []))]

  const participants = await User.find({ _id: { $in: participantIds } })
    .select('_id name username email avatar status lastSeen bio isVerified')
    .lean()

  const participantMap = new Map(participants.map((u) => [u._id.toString(), toParticipant(u)]))
  return conversations.map((conversation) => toConversationPayload(conversation, userId, participantMap))
}

async function listByUser(userId, limit = 100) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200)

  const conversations = await Conversation.find({
    participantIds: userId,
  })
    .sort({ updatedAt: -1 })
    .limit(safeLimit)
    .lean()

  if (conversations.length === 0) {
    return []
  }

  return hydrateConversations(conversations, userId)
}

async function startDirectConversation({ userId, targetUserId }) {
  if (!targetUserId || targetUserId === userId) {
    const error = new Error('Invalid target user')
    error.statusCode = 400
    throw error
  }

  const targetUser = await User.findById(targetUserId).select('_id').lean()
  if (!targetUser) {
    const error = new Error('Target user not found')
    error.statusCode = 404
    throw error
  }

  let conversation = await Conversation.findOne({
    type: 'direct',
    participantIds: { $all: [userId, targetUserId], $size: 2 },
  }).lean()

  if (!conversation) {
    const newConversation = await Conversation.create({
      _id: `conv-${crypto.randomUUID()}`,
      type: 'direct',
      participantIds: [userId, targetUserId],
      unreadBy: {
        [userId]: 0,
        [targetUserId]: 0,
      },
      isPinned: false,
      isMuted: false,
      isArchived: false,
      lastMessage: null,
    })
    conversation = newConversation.toObject()
  }

  const [result] = await hydrateConversations([conversation], userId)
  return result
}

async function getConversationByIdForUser({ conversationId, userId }) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participantIds: userId,
  }).lean()

  if (!conversation) {
    return null
  }

  const [result] = await hydrateConversations([conversation], userId)
  return result
}

module.exports = { listByUser, startDirectConversation, getConversationByIdForUser }
