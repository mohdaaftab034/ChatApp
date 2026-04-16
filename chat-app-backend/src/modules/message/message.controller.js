const messageService = require('./message.service')
const { formatResponse } = require('../../utils/formatResponse')
const { getIO } = require('../../config/socket')
const roomNames = require('../../sockets/rooms')

async function list(req, res, next) {
  try {
    const data = await messageService.listMessages({
      userId: req.user.sub,
      conversationId: req.validated.query.conversationId,
      limit: req.validated.query.limit,
      before: req.validated.query.before,
    })

    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

async function search(req, res, next) {
  try {
    const data = await messageService.searchMessages({
      userId: req.user.sub,
      conversationId: req.validated.query.conversationId,
      q: req.validated.query.q,
      limit: req.validated.query.limit,
    })

    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

async function create(req, res, next) {
  try {
    const data = await messageService.sendMessage({
      senderId: req.user.sub,
      conversationId: req.validated.body.conversationId,
      type: req.validated.body.type,
      text: req.validated.body.text,
      mediaUrl: req.validated.body.mediaUrl,
      fileName: req.validated.body.fileName,
      fileSize: req.validated.body.fileSize,
      audioDuration: req.validated.body.audioDuration,
      location: req.validated.body.location,
      sharedContact: req.validated.body.sharedContact,
      encryptedPayload: req.validated.body.encryptedPayload,
      clientTempId: req.validated.body.clientTempId,
      replyToId: req.validated.body.replyToId,
    })

    return res.status(201).json(formatResponse({ data, message: 'Message sent' }))
  } catch (error) {
    return next(error)
  }
}

async function markRead(req, res, next) {
  try {
    const data = await messageService.markRead({
      readerId: req.user.sub,
      messageIds: req.validated.body.messageIds,
    })

    return res.status(200).json(formatResponse({ data, message: 'Messages marked as read' }))
  } catch (error) {
    return next(error)
  }
}

async function remove(req, res, next) {
  try {
    const data = await messageService.deleteMessage({
      actorId: req.user.sub,
      messageId: req.validated.params.messageId,
    })

    const io = getIO()
    if (io && data.participantIds) {
      for (const participantId of data.participantIds) {
        io.to(roomNames.user(participantId)).emit('message_deleted', {
          messageId: data.message.id,
          conversationId: data.message.conversationId,
        })

        if (data.conversation) {
          io.to(roomNames.user(participantId)).emit('conversation_updated', data.conversation)
        }
      }
    }

    return res.status(200).json(formatResponse({ data, message: 'Message deleted' }))
  } catch (error) {
    return next(error)
  }
}

module.exports = { list, search, create, markRead, remove }
