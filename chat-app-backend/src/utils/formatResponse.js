function formatResponse({ success = true, data = null, message = '' }) {
  return { success, data, message }
}

module.exports = { formatResponse }
