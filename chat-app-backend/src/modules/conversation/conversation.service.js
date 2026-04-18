const Conversation = require('../../models/Conversation.model')
const User = require('../../models/User.model')
const crypto = require('crypto')
const { getBlockState } = require('../../utils/blocking')
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
  const participantsForConversation = (conversation.participantIds || [])
    .map((id) => participantMap.get(id))
    .filter(Boolean)
    .map((participant) => {
      const isDirectConversation = conversation.type === 'direct'
      const isBlockedByOtherOnly = Boolean(conversation.isBlocked && !conversation.canUnblock)
      const isOtherParticipant = participant.id !== String(userId)

      if (isDirectConversation && isBlockedByOtherOnly && isOtherParticipant) {
        return {
          ...participant,
          avatar: null,
          email: '',
          bio: '',
          status: 'offline',
          lastSeen: null,
        }
      }

      return participant
    })

  return {
    id: conversation._id,
    type: conversation.type || 'direct',
    participants: participantsForConversation,
    lastMessage: conversation.lastMessage || null,
    unreadCount: Number(conversation.unreadBy?.[userId] || 0),
    isPinned: Boolean(conversation.isPinned),
    isMuted: Boolean(conversation.isMuted),
    isArchived: Boolean(conversation.isArchived),
    isBlocked: Boolean(conversation.type === 'direct' && conversation.isBlocked),
    canUnblock: Boolean(conversation.type === 'direct' && conversation.canUnblock),
    createdAt: conversation.createdAt,
    group: conversation.group || undefined,
  }
}

async function hydrateConversations(conversations, userId) {
  const participantIds = [...new Set(conversations.flatMap((c) => c.participantIds || []))]
  const userIdStr = String(userId)

  const participants = await User.find({ _id: { $in: participantIds } })
    .select('_id name username email avatar status lastSeen bio isVerified privacy')
    .lean()

  const visibilityRows = await Contact.find({
    userId: { $in: participantIds.map((id) => String(id)) },
    contactId: userIdStr,
  }).select('userId').lean()
  const targetHasViewerAsContact = new Set(visibilityRows.map((entry) => String(entry.userId)))

  const participantMap = new Map(
    participants.map((participant) => {
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

  const enrichedConversations = await Promise.all(
    conversations.map(async (conversation) => {
      if (conversation.type !== 'direct') {
        return conversation
      }

      const otherParticipantId = (conversation.participantIds || []).find((id) => id !== userId)
      if (!otherParticipantId) {
        return conversation
      }

      const blockState = await getBlockState(userId, otherParticipantId)
      return {
        ...conversation,
        isBlocked: blockState.isBlocked,
        canUnblock: blockState.viewerBlockedTarget,
      }
    })
  )

  return enrichedConversations.map((conversation) => toConversationPayload(conversation, userId, participantMap))
}

async function listByUser(userId, limit = 100) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200)

  const conversations = await Conversation.find({
    participantIds: userId,
  })
    .limit(safeLimit)
    .lean()

  conversations.sort((a, b) => {
    const aTs = a?.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : -Infinity
    const bTs = b?.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : -Infinity
    return bTs - aTs
  })

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
    const blockState = await getBlockState(userId, targetUserId)
    if (blockState.isBlocked) {
      const error = new Error('You cannot start a chat with this user')
      error.statusCode = 403
      throw error
    }

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

  if (conversation.type === 'direct') {
    const otherParticipantId = (conversation.participantIds || []).find((id) => id !== userId)
    if (otherParticipantId) {
      const blockState = await getBlockState(userId, otherParticipantId)
      conversation.isBlocked = blockState.isBlocked
      conversation.canUnblock = blockState.viewerBlockedTarget
    }
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

  if (conversation.type === 'direct') {
    const otherParticipantId = (conversation.participantIds || []).find((id) => id !== userId)
    if (otherParticipantId) {
      const blockState = await getBlockState(userId, otherParticipantId)
      conversation.isBlocked = blockState.isBlocked
      conversation.canUnblock = blockState.viewerBlockedTarget
    }
  }

  const [result] = await hydrateConversations([conversation], userId)
  return result
}

module.exports = { listByUser, startDirectConversation, getConversationByIdForUser }
