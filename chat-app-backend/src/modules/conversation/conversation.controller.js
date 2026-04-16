const conversationService = require('./conversation.service')
const { formatResponse } = require('../../utils/formatResponse')

async function list(req, res, next) {
  try {
    const data = await conversationService.listByUser(req.user.sub, req.validated.query?.limit)
    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

async function startDirect(req, res, next) {
  try {
    const data = await conversationService.startDirectConversation({
      userId: req.user.sub,
      targetUserId: req.validated.body.targetUserId,
    })

    return res.status(200).json(formatResponse({ data, message: 'Conversation ready' }))
  } catch (error) {
    return next(error)
  }
}

module.exports = { list, startDirect }
