const roomNames = require('../rooms')
const messageService = require('../../modules/message/message.service')

function attachReadHandlers(io, socket) {
  socket.on('mark_read', async (messageIds) => {
    try {
      const result = await messageService.markRead({
        readerId: socket.data.userId,
        messageIds,
      })

      for (const conversationId of result.conversationIds) {
        io.to(roomNames.conversation(conversationId)).emit('messages_read', {
          messageIds: result.messageIds,
          readerId: socket.data.userId,
          conversationId,
        })
      }
    } catch (_error) {
      socket.emit('socket_error', {
        event: 'mark_read',
        message: 'Failed to mark messages as read',
      })
    }
  })
}

module.exports = { attachReadHandlers }
