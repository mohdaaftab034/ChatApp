const express = require('express')
const { verifyJwt } = require('../auth/auth.middleware')
const { upload } = require('../../middleware/upload')
const mediaController = require('./media.controller')

const router = express.Router()

router.get('/', verifyJwt, mediaController.list)
router.post('/images', verifyJwt, upload.single('image'), mediaController.uploadImage)
router.post('/documents', verifyJwt, upload.single('document'), mediaController.uploadDocument)
router.post('/audio', verifyJwt, upload.single('audio'), mediaController.uploadAudio)

module.exports = router
