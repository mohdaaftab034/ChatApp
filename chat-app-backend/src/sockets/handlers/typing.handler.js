const roomNames = require('../rooms')

function attachTypingHandlers(_io, socket) {
  socket.on('typing_start', (conversationId) => {
    if (!conversationId) return
    socket.to(roomNames.conversation(conversationId)).emit('typing_start', {
      userId: socket.data.userId,
      conversationId,
    })
  })

  socket.on('typing_stop', (conversationId) => {
    if (!conversationId) return
    socket.to(roomNames.conversation(conversationId)).emit('typing_stop', {
      userId: socket.data.userId,
      conversationId,
    })
  })
}

module.exports = { attachTypingHandlers }
