const express = require('express')
const { verifyJwt } = require('../auth/auth.middleware')
const conversationController = require('./conversation.controller')
const { validate } = require('../../middleware/validate')
const { listConversationsSchema, startDirectConversationSchema } = require('./conversation.schema')

const router = express.Router()

router.get('/', verifyJwt, validate(listConversationsSchema), conversationController.list)
router.post('/direct', verifyJwt, validate(startDirectConversationSchema), conversationController.startDirect)

module.exports = router