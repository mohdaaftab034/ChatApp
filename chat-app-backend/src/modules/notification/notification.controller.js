const notificationService = require('./notification.service')

async function list(_req, _res, next) {
  try {
    await notificationService.notImplemented()
  } catch (error) {
    next(error)
  }
}

module.exports = { list }
