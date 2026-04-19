const { Server } = require('socket.io')
const env = require('./env')
const registerSocketHandlers = require('../sockets')
const { verifyAccessToken } = require('../utils/jwt')
const { buildAllowedOrigins, isAllowedOrigin } = require('../utils/origin')

let io

const allowedOrigins = buildAllowedOrigins({
  clientUrl: env.CLIENT_URL,
  clientUrls: env.CLIENT_URLS,
})

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin, { allowedOrigins, nodeEnv: env.NODE_ENV })) {
          return callback(null, true)
        }

        return callback(new Error(`Socket CORS blocked for origin: ${origin}`))
      },
      credentials: true,
    },
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) {
        const error = new Error('Unauthorized socket connection')
        error.data = { code: 'SOCKET_UNAUTHORIZED' }
        return next(error)
      }

      const payload = verifyAccessToken(token)
      socket.data.userId = payload.sub
      socket.data.userRole = payload.role
      return next()
    } catch (_error) {
      const error = new Error('Unauthorized socket connection')
      error.data = { code: 'SOCKET_UNAUTHORIZED' }
      return next(error)
    }
  })

  registerSocketHandlers(io)
  return io
}

function getIO() {
  return io
}

module.exports = initSocket
module.exports.getIO = getIO
