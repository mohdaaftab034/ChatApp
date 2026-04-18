const searchService = require('./search.service')
const { formatResponse } = require('../../utils/formatResponse')

async function search(req, res, next) {
  try {
    const data = await searchService.searchMessages({
      userId: req.user.sub,
      q: req.validated.query.q,
      conversationId: req.validated.query.conversationId,
      limit: req.validated.query.limit,
    })

    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

module.exports = { search }
