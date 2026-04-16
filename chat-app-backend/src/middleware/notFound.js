const { formatResponse } = require('../utils/formatResponse')

function notFound(req, res) {
  return res.status(404).json(
    formatResponse({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
  )
}

module.exports = { notFound }
