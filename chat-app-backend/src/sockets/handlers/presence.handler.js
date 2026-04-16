const roomNames = require('../rooms')
const User = require('../../models/User.model')
const Conversation = require('../../models/Conversation.model')
const messageService = require('../../modules/message/message.service')

function getConnectedUserIds(io) {
  const userIds = new Set()

  for (const socket of io.of('/').sockets.values()) {
    if (socket.data?.userId) {
      userIds.add(String(socket.data.userId))
    }
  }

  return userIds
}

function countUserConnections(io, userId) {
  let count = 0
  const normalizedUserId = String(userId)

  for (const socket of io.of('/').sockets.values()) {
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
    const remainingConnections = countUserConnections(io, userId)
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

    io.emit('user_offline', {
      userId: String(userId),
      lastSeen: lastSeen.toISOString(),
    })
  })
}

module.exports = { attachPresenceHandlers }
