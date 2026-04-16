const { attachMessageHandlers } = require('./handlers/message.handler')
const { attachTypingHandlers } = require('./handlers/typing.handler')
const { attachReadHandlers } = require('./handlers/read.handler')
const { attachPresenceHandlers } = require('./handlers/presence.handler')
const { attachGroupHandlers } = require('./handlers/group.handler')
const roomNames = require('./rooms')

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    if (socket.data.userId) {
      socket.join(roomNames.user(socket.data.userId))
    }

    attachMessageHandlers(io, socket)
    attachTypingHandlers(io, socket)
    attachReadHandlers(io, socket)
    Promise.resolve(attachPresenceHandlers(io, socket)).catch(() => {
      socket.emit('socket_error', {
        event: 'presence_init',
        message: 'Presence initialization failed',
      })
    })
    attachGroupHandlers(io, socket)
  })
}

module.exports = registerSocketHandlers
