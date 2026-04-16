const Redis = require('ioredis')
const env = require('./env')
const logger = require('../utils/logger')

let redis

async function initRedis() {
  redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 })
  redis.on('error', (error) => logger.warn(`Redis error: ${error.message}`))

  try {
    await redis.connect()
    logger.info('Redis connected')
  } catch (error) {
    logger.warn(`Redis unavailable, continuing without cache: ${error.message}`)
  }

  return redis
}

function getRedis() {
  return redis
}

module.exports = initRedis
module.exports.getRedis = getRedis
