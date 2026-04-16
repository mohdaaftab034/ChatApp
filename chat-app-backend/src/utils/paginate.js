function buildCursorPagination({ items, limit = 20 }) {
  const hasMore = items.length > limit
  const data = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? data[data.length - 1]?._id : null

  return { data, pageInfo: { hasMore, nextCursor } }
}

module.exports = { buildCursorPagination }
