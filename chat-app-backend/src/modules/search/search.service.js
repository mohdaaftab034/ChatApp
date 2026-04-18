const Conversation = require('../../models/Conversation.model')
const Message = require('../../models/Message.model')

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toSearchResult(messageDoc) {
  return {
    messageId: String(messageDoc._id),
    conversationId: String(messageDoc.conversationId),
    senderId: String(messageDoc.senderId),
    type: messageDoc.type,
    text: messageDoc.text || '',
    createdAt: messageDoc.createdAt,
  }
}

async function searchMessages({ userId, q, conversationId, limit = 30 }) {
  const queryText = String(q || '').trim()
  if (!queryText) return []

  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100)
  const regex = new RegExp(escapeRegex(queryText), 'i')

  let allowedConversationIds = []

  if (conversationId) {
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

    allowedConversationIds = [String(conversation._id)]
  } else {
    const conversations = await Conversation.find({ participantIds: userId })
      .select('_id')
      .lean()
    allowedConversationIds = conversations.map((conversation) => String(conversation._id))
  }

  if (allowedConversationIds.length === 0) {
    return []
  }

  const messageMatches = await Message.find({
    conversationId: { $in: allowedConversationIds },
    isDeleted: false,
    text: { $regex: regex },
  })
    .select('_id conversationId senderId type text createdAt')
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean()

  return messageMatches.map(toSearchResult)
}

module.exports = { searchMessages }
