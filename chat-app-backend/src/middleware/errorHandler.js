const logger = require('../utils/logger')
const { formatResponse } = require('../utils/formatResponse')

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500
  logger.error(error.message)

  return res.status(statusCode).json(
    formatResponse({
      success: false,
      message: error.message || 'Internal server error',
    })
  )
}

module.exports = { errorHandler }
