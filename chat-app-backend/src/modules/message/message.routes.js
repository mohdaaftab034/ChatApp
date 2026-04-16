const express = require('express')
const { verifyJwt } = require('../auth/auth.middleware')
const messageController = require('./message.controller')
const { validate } = require('../../middleware/validate')
const { listMessagesSchema, searchMessagesSchema, createMessageSchema, markReadSchema, deleteMessageSchema } = require('./message.schema')

const router = express.Router()

router.get('/', verifyJwt, validate(listMessagesSchema), messageController.list)
router.get('/search', verifyJwt, validate(searchMessagesSchema), messageController.search)
router.post('/', verifyJwt, validate(createMessageSchema), messageController.create)
router.patch('/read', verifyJwt, validate(markReadSchema), messageController.markRead)
router.delete('/:messageId', verifyJwt, validate(deleteMessageSchema), messageController.remove)

module.exports = router
