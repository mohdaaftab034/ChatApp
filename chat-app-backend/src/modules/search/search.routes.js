const express = require('express')
const { verifyJwt } = require('../auth/auth.middleware')
const searchController = require('./search.controller')

const router = express.Router()

router.get('/', verifyJwt, searchController.search)

module.exports = router
