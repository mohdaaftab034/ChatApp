const express = require('express')
const { verifyJwt } = require('../auth/auth.middleware')
const contactController = require('./contact.controller')
const { validate } = require('../../middleware/validate')
const { listContactsSchema } = require('./contact.schema')

const router = express.Router()

router.get('/', verifyJwt, validate(listContactsSchema), contactController.list)

module.exports = router
