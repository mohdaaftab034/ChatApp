async function notImplemented() {
  const error = new Error('Notification module not implemented yet')
  error.statusCode = 501
  throw error
}

module.exports = { notImplemented }
