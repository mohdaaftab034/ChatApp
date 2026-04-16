const sanitizeHtml = require('sanitize-html')

function sanitizeText(input = '') {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim()
}

module.exports = { sanitizeText }
