function normalizeOrigin(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return null

  try {
    return new URL(trimmed).origin
  } catch (_error) {
    return null
  }
}

function buildAllowedOrigins({ clientUrl, clientUrls }) {
  const values = [clientUrl]

  if (clientUrls) {
    values.push(...String(clientUrls).split(','))
  }

  return new Set(values.map(normalizeOrigin).filter(Boolean))
}

function isAllowedOrigin(origin, { allowedOrigins, nodeEnv }) {
  if (!origin) return true

  const normalized = normalizeOrigin(origin)
  if (!normalized) return false
  if (allowedOrigins.has(normalized)) return true

  if (nodeEnv === 'development') {
    return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalized)
  }

  return false
}

module.exports = {
  buildAllowedOrigins,
  isAllowedOrigin,
}