const http = require('http')
const app = require('./src/app')
const env = require('./src/config/env')
const connectDB = require('./src/config/db')
const initRedis = require('./src/config/redis')
const initSocket = require('./src/config/socket')
const logger = require('./src/utils/logger')

async function bootstrap() {
  await connectDB()
  await initRedis()

  const server = http.createServer(app)
  initSocket(server)
 
  server.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`)
  })
} 

bootstrap().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`)
  process.exit(1)
})
