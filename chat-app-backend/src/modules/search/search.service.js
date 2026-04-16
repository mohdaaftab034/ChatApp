async function notImplemented() {
  const error = new Error('Search module not implemented yet')
  error.statusCode = 501
  throw error
}

module.exports = { notImplemented }
