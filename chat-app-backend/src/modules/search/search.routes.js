const express = require('express')
const { verifyJwt } = require('../auth/auth.middleware')
const searchController = require('./search.controller')
const { validate } = require('../../middleware/validate')
const { searchSchema } = require('./search.schema')

const router = express.Router()

router.get('/', verifyJwt, validate(searchSchema), searchController.search)

module.exports = router
