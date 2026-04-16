const crypto = require('crypto')
const Message = require('../../models/Message.model')
const Conversation = require('../../models/Conversation.model')
const User = require('../../models/User.model')

function newId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toMessagePayload(messageDoc) {
  const encryptedKeys = messageDoc.encryptedPayload?.encryptedKeys
    ? messageDoc.encryptedPayload.encryptedKeys instanceof Map
      ? Object.fromEntries(messageDoc.encryptedPayload.encryptedKeys.entries())
      : Object.fromEntries(Object.entries(messageDoc.encryptedPayload.encryptedKeys))
    : {}

  return {
    id: messageDoc._id,
    conversationId: messageDoc.conversationId,
    senderId: messageDoc.senderId,
    type: messageDoc.type,
    text: messageDoc.text || undefined,
    mediaUrl: messageDoc.mediaUrl || undefined,
    fileName: messageDoc.fileName || undefined,
    fileSize: messageDoc.fileSize || undefined,
    audioDuration: messageDoc.audioDuration || undefined,
    location: messageDoc.location?.lat != null ? messageDoc.location : undefined,
    sharedContact: messageDoc.sharedContact?.userId ? messageDoc.sharedContact : undefined,
    linkPreview: messageDoc.linkPreview?.url ? messageDoc.linkPreview : undefined,
    replyTo: messageDoc.replyTo?.messageId ? messageDoc.replyTo : undefined,
    encryptedPayload: messageDoc.encryptedPayload?.ciphertext
      ? {
          ciphertext: messageDoc.encryptedPayload.ciphertext,
          iv: messageDoc.encryptedPayload.iv,
          encryptedKeys,
          senderKeyId: messageDoc.encryptedPayload.senderKeyId || undefined,
        }
      : undefined,
    reactions: messageDoc.reactions || [],
    readBy: messageDoc.readBy || [],
    deliveredTo: messageDoc.deliveredTo || [],
    isEdited: Boolean(messageDoc.isEdited),
    isDeleted: Boolean(messageDoc.isDeleted),
    isPinned: Boolean(messageDoc.isPinned),
    isStarred: Boolean(messageDoc.isStarred),
    createdAt: messageDoc.createdAt,
    updatedAt: messageDoc.updatedAt,
  }
}

function normalizeSharedContact(sharedContact) {
  if (!sharedContact) return null

  const userId = String(sharedContact.userId || '').trim()
  const name = String(sharedContact.name || '').trim()

  if (!userId || !name) {
    const error = new Error('Invalid shared contact payload')
    error.statusCode = 400
    throw error
  }

  return {
    userId,
    name,
    username: String(sharedContact.username || '').trim(),
    email: String(sharedContact.email || '').trim(),
    phone: String(sharedContact.phone || '').trim(),
    avatar: sharedContact.avatar || null,
  }
}

function withClientTempId(messagePayload, clientTempId) {
  if (!clientTempId) return messagePayload
  return {
    ...messagePayload,
    clientTempId,
  }
}

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

async function toConversationPayload(conversationDoc, userId) {
  const participantIds = conversationDoc.participantIds || []
  const users = await User.find({ _id: { $in: participantIds } })
    .select('_id name username email avatar status lastSeen bio isVerified')
    .lean()

  const participantMap = new Map(users.map((user) => [user._id.toString(), toParticipant(user)]))
  const participants = participantIds.map((id) => participantMap.get(id)).filter(Boolean)

  return {
    id: conversationDoc._id,
    type: conversationDoc.type || 'direct',
    participants,
    lastMessage: conversationDoc.lastMessage || null,
    unreadCount: Number(conversationDoc.unreadBy?.[userId] || 0),
    isPinned: Boolean(conversationDoc.isPinned),
    isMuted: Boolean(conversationDoc.isMuted),
    isArchived: Boolean(conversationDoc.isArchived),
    createdAt: conversationDoc.createdAt,
    group: conversationDoc.group || undefined,
  }
}

async function ensureConversation({ conversationId, senderId, participantIds = [] }) {
  const now = new Date()
  const desiredParticipants = [...new Set([senderId, ...(participantIds || [])].filter(Boolean))]

  const conversation = await Conversation.findOneAndUpdate(
    { _id: conversationId },
    {
      $setOnInsert: {
        _id: conversationId,
        type: 'direct',
        participantIds: desiredParticipants.length > 0 ? desiredParticipants : [senderId],
        unreadBy: {},
        isPinned: false,
        isMuted: false,
        isArchived: false,
        lastMessage: null,
        createdAt: now,
      },
      $set: { updatedAt: now },
    },
    { new: true, upsert: true }
  )

  const participantSet = new Set([...(conversation.participantIds || []), ...desiredParticipants])
  conversation.participantIds = [...participantSet]

  return conversation
}

function normalizeLocation(location) {
  if (!location) return null

  const lat = Number(location.lat)
  const lng = Number(location.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const error = new Error('Invalid location coordinates')
    error.statusCode = 400
    throw error
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    const error = new Error('Location coordinates are out of range')
    error.statusCode = 400
    throw error
  }

  const label = String(location.label || '').trim()
  return {
    lat,
    lng,
    label: label || 'Pinned location',
  }
}

async function sendMessage({ senderId, conversationId, type, text, mediaUrl, fileName, fileSize, audioDuration, location, sharedContact, encryptedPayload, clientTempId, replyToId, participantIds }) {
  if (!conversationId) {
    const error = new Error('conversationId is required')
    error.statusCode = 400
    throw error
  }

  const normalizedLocation = normalizeLocation(location)
  const normalizedSharedContact = normalizeSharedContact(sharedContact)

  const normalizedEncryptedPayload = normalizeEncryptedPayload(encryptedPayload)

  if (!text && !mediaUrl && !normalizedLocation && !normalizedSharedContact) {
    if (!normalizedEncryptedPayload) {
      const error = new Error('Message content is required')
      error.statusCode = 400
      throw error
    }
  }

  if (normalizedEncryptedPayload && (normalizedLocation || normalizedSharedContact || mediaUrl)) {
    const error = new Error('encryptedPayload is only supported for text messages')
    error.statusCode = 400
    throw error
  }

  const safeType = type || (normalizedLocation ? 'location' : normalizedSharedContact ? 'contact' : 'text')
  if (safeType === 'location' && !normalizedLocation) {
    const error = new Error('Location payload is required for location messages')
    error.statusCode = 400
    throw error
  }

  if (safeType === 'contact' && !normalizedSharedContact) {
    const error = new Error('Contact payload is required for contact messages')
    error.statusCode = 400
    throw error
  }

  const safeText = normalizedEncryptedPayload
    ? ''
    : text || (normalizedLocation ? normalizedLocation.label : normalizedSharedContact ? `Shared contact: ${normalizedSharedContact.name}` : '')
  const now = new Date()
  const existingConversation = await Conversation.findById(conversationId).lean()

  if (existingConversation) {
    const participantSet = new Set(existingConversation.participantIds || [])
    if (!participantSet.has(senderId)) {
      const error = new Error('You are not a member of this conversation')
      error.statusCode = 403
      throw error
    }

    if (existingConversation.type === 'group' && existingConversation.group?.settings?.whoCanSend === 'admins') {
      const adminSet = new Set(existingConversation.group?.adminIds || [])
      if (!adminSet.has(senderId)) {
        const error = new Error('Only group admins can send messages')
        error.statusCode = 403
        throw error
      }
    }
  }

  const conversation = await ensureConversation({ conversationId, senderId, participantIds })

  const recipientIds = (conversation.participantIds || []).filter((participantId) => participantId !== senderId)
  const onlineRecipients = recipientIds.length > 0
    ? await User.find({ _id: { $in: recipientIds }, status: 'online' }).select('_id').lean()
    : []

  const deliveredTo = [
    senderId,
    ...onlineRecipients.map((recipient) => recipient._id.toString()),
  ]

  const message = await Message.create({
    _id: newId('msg'),
    conversationId,
    senderId,
    type: safeType,
    text: safeText,
    mediaUrl: mediaUrl || null,
    fileName: fileName || null,
    fileSize: fileSize || null,
    audioDuration: Number(audioDuration) > 0 ? Number(audioDuration) : null,
    location: normalizedLocation || undefined,
    sharedContact: normalizedSharedContact || undefined,
    encryptedPayload: normalizedEncryptedPayload || undefined,
    replyTo: replyToId ? { messageId: replyToId, text: '', senderName: '' } : undefined,
    reactions: [],
    readBy: [senderId],
    deliveredTo,
    isEdited: false,
    isDeleted: false,
    isPinned: false,
    isStarred: false,
    createdAt: now,
    updatedAt: now,
  })

  conversation.lastMessage = {
    id: message._id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    type: message.type,
    text: normalizedEncryptedPayload ? 'Encrypted message' : message.text,
    mediaUrl: message.mediaUrl,
    fileName: message.fileName,
    fileSize: message.fileSize,
    audioDuration: message.audioDuration,
    location: message.location,
    sharedContact: message.sharedContact,
    encryptedPayload: normalizedEncryptedPayload || undefined,
    reactions: [],
    readBy: message.readBy,
    deliveredTo: message.deliveredTo,
    isEdited: false,
    isDeleted: false,
    isPinned: false,
    isStarred: false,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  }

  const unreadBy = new Map(conversation.unreadBy || [])
  for (const participantId of conversation.participantIds || []) {
    if (participantId === senderId) {
      unreadBy.set(participantId, 0)
    } else {
      unreadBy.set(participantId, Number(unreadBy.get(participantId) || 0) + 1)
    }
  }
  conversation.unreadBy = unreadBy
  await conversation.save()

  return {
    message: withClientTempId(toMessagePayload(message.toObject()), clientTempId),
    conversation: await toConversationPayload(conversation.toObject(), senderId),
    participantIds: conversation.participantIds || [],
  }
}

function normalizeEncryptedPayload(encryptedPayload) {
  if (!encryptedPayload) return null

  const ciphertext = String(encryptedPayload.ciphertext || '').trim()
  const iv = String(encryptedPayload.iv || '').trim()
  const senderKeyId = String(encryptedPayload.senderKeyId || '').trim()
  const encryptedKeysInput = encryptedPayload.encryptedKeys || {}

  if (!ciphertext || !iv || typeof encryptedKeysInput !== 'object' || Array.isArray(encryptedKeysInput)) {
    const error = new Error('Invalid encrypted payload')
    error.statusCode = 400
    throw error
  }

  const encryptedKeys = {}
  for (const [userId, key] of Object.entries(encryptedKeysInput)) {
    const safeUserId = String(userId || '').trim()
    const safeKey = String(key || '').trim()
    if (!safeUserId || !safeKey) continue
    encryptedKeys[safeUserId] = safeKey
  }

  if (Object.keys(encryptedKeys).length === 0) {
    const error = new Error('encryptedPayload.encryptedKeys must include at least one recipient')
    error.statusCode = 400
    throw error
  }

  return {
    ciphertext,
    iv,
    encryptedKeys,
    senderKeyId: senderKeyId || null,
  }
}

async function listMessages({ userId, conversationId, limit = 50, before }) {
  if (!conversationId) {
    const error = new Error('conversationId is required')
    error.statusCode = 400
    throw error
  }

  const conversation = await Conversation.findById(conversationId)
    .select('_id participantIds')
    .lean()

  if (!conversation) {
    const error = new Error('Conversation not found')
    error.statusCode = 404
    throw error
  }

  if (!(conversation.participantIds || []).includes(userId)) {
    const error = new Error('You are not a member of this conversation')
    error.statusCode = 403
    throw error
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100)
  const query = { conversationId }
  if (before) {
    query.createdAt = { $lt: new Date(before) }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean()

  const ordered = messages.reverse().map(toMessagePayload)

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        [`unreadBy.${userId}`]: 0,
      },
    }
  )

  return ordered
}

async function searchMessages({ userId, conversationId, q, limit = 50 }) {
  if (!conversationId) {
    const error = new Error('conversationId is required')
    error.statusCode = 400
    throw error
  }

  const queryText = String(q || '').trim()
  if (!queryText) {
    return []
  }

  const conversation = await Conversation.findById(conversationId)
    .select('_id participantIds')
    .lean()

  if (!conversation) {
    const error = new Error('Conversation not found')
    error.statusCode = 404
    throw error
  }

  if (!(conversation.participantIds || []).includes(userId)) {
    const error = new Error('You are not a member of this conversation')
    error.statusCode = 403
    throw error
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100)
  const textRegex = new RegExp(escapeRegex(queryText), 'i')

  const matches = await Message.find({
    conversationId,
    isDeleted: false,
    text: { $regex: textRegex },
  })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean()

  return matches.map(toMessagePayload)
}

async function markRead({ readerId, messageIds }) {
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return { messageIds: [], conversationIds: [] }
  }

  const docs = await Message.find({ _id: { $in: messageIds } }).lean()
  if (docs.length === 0) {
    return { messageIds: [], conversationIds: [] }
  }

  await Message.updateMany(
    { _id: { $in: messageIds } },
    {
      $addToSet: { readBy: readerId },
    }
  )

  const conversationIds = [...new Set(docs.map((d) => d.conversationId))]
  await Conversation.updateMany(
    { _id: { $in: conversationIds } },
    {
      $set: { [`unreadBy.${readerId}`]: 0 },
    }
  )

  return { messageIds: docs.map((d) => d._id), conversationIds }
}

async function deleteMessage({ actorId, messageId }) {
  if (!messageId) {
    const error = new Error('messageId is required')
    error.statusCode = 400
    throw error
  }

  const messageDoc = await Message.findById(messageId)
  if (!messageDoc) {
    const error = new Error('Message not found')
    error.statusCode = 404
    throw error
  }

  if (messageDoc.senderId !== actorId) {
    const error = new Error('You can only delete your own messages')
    error.statusCode = 403
    throw error
  }

  messageDoc.isDeleted = true
  messageDoc.text = 'Message deleted'
  messageDoc.mediaUrl = null
  messageDoc.fileName = null
  messageDoc.fileSize = null
  messageDoc.audioDuration = null
  messageDoc.location = undefined
  messageDoc.linkPreview = undefined
  messageDoc.updatedAt = new Date()
  await messageDoc.save()

  const conversation = await Conversation.findById(messageDoc.conversationId)
  if (conversation) {
    const latestMessage = await Message.findOne({
      conversationId: messageDoc.conversationId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean()

    conversation.lastMessage = latestMessage ? toMessagePayload(latestMessage) : null
    await conversation.save()
  }

  return {
    message: toMessagePayload(messageDoc.toObject()),
    conversation: conversation ? await toConversationPayload(conversation.toObject(), actorId) : null,
    participantIds: conversation?.participantIds || [],
  }
}

async function markDeliveredForUser({ userId }) {
  const conversations = await Conversation.find({ participantIds: userId }).select('_id').lean()
  const conversationIds = conversations.map((conversation) => conversation._id)

  if (conversationIds.length === 0) {
    return []
  }

  const pendingMessages = await Message.find({
    conversationId: { $in: conversationIds },
    senderId: { $ne: userId },
    deliveredTo: { $ne: userId },
    isDeleted: false,
  })
    .select('_id')
    .lean()

  const pendingMessageIds = pendingMessages.map((message) => message._id)
  if (pendingMessageIds.length === 0) {
    return []
  }

  await Message.updateMany(
    { _id: { $in: pendingMessageIds } },
    { $addToSet: { deliveredTo: userId } }
  )

  const updatedMessages = await Message.find({ _id: { $in: pendingMessageIds } }).lean()
  return updatedMessages.map(toMessagePayload)
}

module.exports = {
  sendMessage,
  listMessages,
  searchMessages,
  markRead,
  deleteMessage,
  markDeliveredForUser,
}
