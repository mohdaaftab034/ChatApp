const { verifyAccessToken } = require('../utils/jwt')

function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      const error = new Error('Unauthorized')
      error.statusCode = 401
      throw error
    }

    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch (_error) {
    const error = new Error('Unauthorized')
    error.statusCode = 401
    next(error)
  }
}

module.exports = { authenticate }
