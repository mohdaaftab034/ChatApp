const roomNames = require('../rooms')
const User = require('../../models/User.model')
const Conversation = require('../../models/Conversation.model')
const messageService = require('../../modules/message/message.service')
const Contact = require('../../models/Contact.model')

function getConnectedUserIds(io) {
  const userIds = new Set()

  for (const socket of io.of('/').sockets.values()) {
    if (socket.data?.userId) {
      userIds.add(String(socket.data.userId))
    }
  }

  return userIds
}

function countUserConnections(io, userId, { excludeSocketId } = {}) {
  let count = 0
  const normalizedUserId = String(userId)

  for (const socket of io.of('/').sockets.values()) {
    if (excludeSocketId && socket.id === excludeSocketId) {
      continue
    }

    if (String(socket.data?.userId) === normalizedUserId) {
      count += 1
    }
  }

  return count
}

async function attachPresenceHandlers(io, socket) {
  const userId = socket.data.userId
  if (!userId) return

  const ownConnections = countUserConnections(io, userId)
  if (ownConnections === 1) {
    await User.updateOne({ _id: userId }, { $set: { status: 'online', lastSeen: null } })

    const deliveredMessages = await messageService.markDeliveredForUser({ userId: String(userId) })
    for (const message of deliveredMessages) {
      io.to(roomNames.conversation(message.conversationId)).emit('message_updated', message)
    }
  }

  const conversations = await Conversation.find({ participantIds: userId }).select('_id').lean()
  for (const conversation of conversations) {
    socket.join(roomNames.conversation(conversation._id))
  }

  socket.emit('presence_sync', Array.from(getConnectedUserIds(io)))

  if (ownConnections === 1) {
    io.emit('user_online', String(userId))
  }

  socket.on('disconnect', async () => {
    const remainingConnections = countUserConnections(io, userId, { excludeSocketId: socket.id })
    if (remainingConnections > 0) {
      return
    }

    const lastSeen = new Date()
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          status: 'offline',
          lastSeen,
        },
      }
    )

    const offlineUser = await User.findById(userId).select('privacy').lean()
    const lastSeenPrivacy = offlineUser?.privacy?.lastSeen || 'contacts'
    const payloadBase = { userId: String(userId) }
    const payloadWithLastSeen = {
      ...payloadBase,
      lastSeen: lastSeen.toISOString(),
    }

    if (lastSeenPrivacy === 'everyone') {
      io.emit('user_offline', payloadWithLastSeen)
      return
    }

    if (lastSeenPrivacy === 'nobody') {
      io.emit('user_offline', payloadBase)
      return
    }

    const contacts = await Contact.find({ userId: String(userId) }).select('contactId').lean()
    const contactIds = new Set(contacts.map((entry) => String(entry.contactId)))

    for (const clientSocket of io.of('/').sockets.values()) {
      const viewerId = String(clientSocket.data?.userId || '')
      if (!viewerId) continue

      const isAllowedViewer = viewerId === String(userId) || contactIds.has(viewerId)
      clientSocket.emit('user_offline', isAllowedViewer ? payloadWithLastSeen : payloadBase)
    }
  })
}

module.exports = { attachPresenceHandlers }
