const groupService = require('./group.service')
const { formatResponse } = require('../../utils/formatResponse')

async function list(req, res, next) {
  try {
    const data = await groupService.listByUser({
      userId: req.user.sub,
      limit: req.validated.query?.limit,
    })

    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

async function create(req, res, next) {
  try {
    const data = await groupService.createGroup({
      creatorId: req.user.sub,
      name: req.validated.body.name,
      memberIds: req.validated.body.memberIds,
      description: req.validated.body.description,
    })

    return res.status(201).json(formatResponse({ data, message: 'Group created' }))
  } catch (error) {
    return next(error)
  }
}

async function update(req, res, next) {
  try {
    const data = await groupService.updateGroup({
      updaterId: req.user.sub,
      groupId: req.params.groupId,
      payload: req.validated.body,
      file: req.file,
    })

    return res.status(200).json(formatResponse({ data, message: 'Group updated' }))
  } catch (error) {
    return next(error)
  }
}

async function addMembers(req, res, next) {
  try {
    const data = await groupService.addMembers({
      actorId: req.user.sub,
      groupId: req.params.groupId,
      memberIds: req.validated.body.memberIds,
    })

    return res.status(200).json(formatResponse({ data, message: 'Members added' }))
  } catch (error) {
    return next(error)
  }
}

module.exports = { list, create, update, addMembers }
