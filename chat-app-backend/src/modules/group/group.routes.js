const express = require('express')
const { verifyJwt } = require('../auth/auth.middleware')
const groupController = require('./group.controller')
const { validate } = require('../../middleware/validate')
const { upload } = require('../../middleware/upload')
const { listGroupsSchema, createGroupSchema, updateGroupSchema, addGroupMembersSchema } = require('./group.schema')

const router = express.Router()

router.get('/', verifyJwt, validate(listGroupsSchema), groupController.list)
router.post('/', verifyJwt, validate(createGroupSchema), groupController.create)
router.patch('/:groupId', verifyJwt, upload.single('avatar'), validate(updateGroupSchema), groupController.update)
router.post('/:groupId/members', verifyJwt, validate(addGroupMembersSchema), groupController.addMembers)

module.exports = router
