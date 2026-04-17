const userService = require('./user.service')
const { formatResponse } = require('../../utils/formatResponse')

async function me(req, res, next) {
  try {
    const data = await userService.getMyProfile(req.user.sub)
    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

async function getById(req, res, next) {
  try {
    const data = await userService.getProfileById(req.user.sub, req.params.userId)
    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

async function directory(req, res, next) {
  try {
    const data = await userService.listDirectoryUsers(req.user.sub, {
      q: req.query.q,
      limit: req.query.limit,
    })
    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

async function updateMe(req, res, next) {
  try {
    const data = await userService.updateMyProfile(req.user.sub, req.body || {}, req.file)
    return res.status(200).json(formatResponse({ message: 'Profile updated', data }))
  } catch (error) {
    return next(error)
  }
}

async function getPublicKey(req, res, next) {
  try {
    const data = await userService.getUserPublicKey(req.params.userId)
    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

async function updatePublicKey(req, res, next) {
  try {
    const data = await userService.updateMyPublicKey(req.user.sub, req.body || {})
    return res.status(200).json(formatResponse({ message: 'Public key updated', data }))
  } catch (error) {
    return next(error)
  }
}

async function blockUser(req, res, next) {
  try {
    const data = await userService.blockUser(req.user.sub, req.params.userId)
    return res.status(200).json(formatResponse({ message: 'Contact blocked', data }))
  } catch (error) {
    return next(error)
  }
}

async function unblockUser(req, res, next) {
  try {
    const data = await userService.unblockUser(req.user.sub, req.params.userId)
    return res.status(200).json(formatResponse({ message: 'Contact unblocked', data }))
  } catch (error) {
    return next(error)
  }
}

module.exports = { me, directory, getById, updateMe, getPublicKey, updatePublicKey, blockUser, unblockUser }
