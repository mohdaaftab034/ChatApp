const mediaService = require('./media.service')
const { formatResponse } = require('../../utils/formatResponse')

async function list(_req, _res, next) {
  try {
    await mediaService.notImplemented()
  } catch (error) {
    next(error)
  }
}

async function uploadImage(req, res, next) {
  try {
    const data = await mediaService.uploadImage({ userId: req.user.sub, file: req.file })
    return res.status(201).json(formatResponse({ data, message: 'Image uploaded' }))
  } catch (error) {
    return next(error)
  }
}

async function uploadDocument(req, res, next) {
  try {
    const data = await mediaService.uploadDocument({ userId: req.user.sub, file: req.file })
    return res.status(201).json(formatResponse({ data, message: 'Document uploaded' }))
  } catch (error) {
    return next(error)
  }
}

async function uploadAudio(req, res, next) {
  try {
    const data = await mediaService.uploadAudio({ userId: req.user.sub, file: req.file })
    return res.status(201).json(formatResponse({ data, message: 'Audio uploaded' }))
  } catch (error) {
    return next(error)
  }
}

module.exports = { list, uploadImage, uploadDocument, uploadAudio }
