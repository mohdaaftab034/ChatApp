const express = require('express')
const { verifyJwt } = require('../auth/auth.middleware')
const notificationController = require('./notification.controller')

const router = express.Router()

router.get('/', verifyJwt, notificationController.list)

module.exports = router
