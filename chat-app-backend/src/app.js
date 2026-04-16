const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')

const env = require('./config/env')
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter')
const { notFound } = require('./middleware/notFound')
const { errorHandler } = require('./middleware/errorHandler')

const authRoutes = require('./modules/auth/auth.routes')
const userRoutes = require('./modules/user/user.routes')
const conversationRoutes = require('./modules/conversation/conversation.routes')
const messageRoutes = require('./modules/message/message.routes')
const groupRoutes = require('./modules/group/group.routes')
const contactRoutes = require('./modules/contact/contact.routes')
const notificationRoutes = require('./modules/notification/notification.routes')
const mediaRoutes = require('./modules/media/media.routes')
const searchRoutes = require('./modules/search/search.routes')

const app = express()

function isAllowedOrigin(origin) {
  if (!origin) return true
  if (origin === env.CLIENT_URL) return true

  if (env.NODE_ENV === 'development') {
    return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  }

  return false
}

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'OK' })
})

app.use(apiLimiter)
app.use(`${env.API_PREFIX}/auth`, authLimiter, authRoutes)
app.use(`${env.API_PREFIX}/users`, userRoutes)
app.use(`${env.API_PREFIX}/conversations`, conversationRoutes)
app.use(`${env.API_PREFIX}/messages`, messageRoutes)
app.use(`${env.API_PREFIX}/groups`, groupRoutes)
app.use(`${env.API_PREFIX}/contacts`, contactRoutes)
app.use(`${env.API_PREFIX}/notifications`, notificationRoutes)
app.use(`${env.API_PREFIX}/media`, mediaRoutes)
app.use(`${env.API_PREFIX}/search`, searchRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
