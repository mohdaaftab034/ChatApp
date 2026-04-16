const express = require('express')
const userController = require('./user.controller')
const { verifyJwt } = require('../auth/auth.middleware')
const { upload } = require('../../middleware/upload')

const router = express.Router()

router.get('/me', verifyJwt, userController.me)
router.get('/directory', verifyJwt, userController.directory)
router.get('/:userId/public-key', verifyJwt, userController.getPublicKey)
router.get('/:userId', verifyJwt, userController.getById)
router.patch('/me', verifyJwt, upload.single('avatar'), userController.updateMe)
router.patch('/me/public-key', verifyJwt, userController.updatePublicKey)

module.exports = router
