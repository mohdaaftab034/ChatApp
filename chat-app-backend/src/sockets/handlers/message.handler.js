const roomNames = require('../rooms')
const messageService = require('../../modules/message/message.service')
const conversationService = require('../../modules/conversation/conversation.service')

function emitSocketError(socket, event, error) {
  socket.emit('socket_error', {
    event,
    message: error.message || 'Socket event failed',
  })
}

function attachMessageHandlers(io, socket) {
  socket.on('join_conversation', async (conversationId) => {
    if (!conversationId) return
    socket.join(roomNames.conversation(conversationId))
  })

  socket.on('leave_conversation', async (conversationId) => {
    if (!conversationId) return
    socket.leave(roomNames.conversation(conversationId))
  })

  socket.on('send_message', async (payload, ack) => {
    try {
      const senderId = socket.data.userId
      const { message, participantIds } = await messageService.sendMessage({
        senderId,
        conversationId: payload?.conversationId,
        type: payload?.type,
        text: payload?.text,
        mediaUrl: payload?.mediaUrl,
        fileName: payload?.fileName,
        fileSize: payload?.fileSize,
        audioDuration: payload?.audioDuration,
        location: payload?.location,
        sharedContact: payload?.sharedContact,
        encryptedPayload: payload?.encryptedPayload,
        clientTempId: payload?.clientTempId,
        replyToId: payload?.replyToId,
        participantIds: payload?.participantIds,
      })

      const recipients = [...new Set(participantIds || [])]

      for (const participantId of recipients) {
        io.to(roomNames.user(participantId)).emit('receive_message', message)

        const conversationForUser = await conversationService.getConversationByIdForUser({
          conversationId: message.conversationId,
          userId: participantId,
        })

        if (conversationForUser) {
          io.to(roomNames.user(participantId)).emit('conversation_updated', conversationForUser)
        }
      }

      if (typeof ack === 'function') {
        ack({ ok: true, message })
      }
    } catch (error) {
      emitSocketError(socket, 'send_message', error)
      if (typeof ack === 'function') {
        ack({ ok: false, error: error.message || 'Failed to send message' })
      }
    }
  })
}

module.exports = { attachMessageHandlers }
