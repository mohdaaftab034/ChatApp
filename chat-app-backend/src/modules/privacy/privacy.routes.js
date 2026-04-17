const express = require('express')
const privacyController = require('./privacy.controller')
const { verifyJwt } = require('../auth/auth.middleware')
const { validate } = require('../../middleware/validate')
const {
  privacySettingSchema,
  updateSingleSettingSchema,
  checkVisibilitySchema,
} = require('./privacy.schema')

const router = express.Router()

// Get all privacy settings for current user
router.get('/me', verifyJwt, privacyController.getMyPrivacySettings)

// Get a specific privacy setting
router.get(
  '/me/:settingName',
  verifyJwt,
  validate(updateSingleSettingSchema),
  privacyController.getPrivacySetting
)

// Check if current user can see another user's information
router.get(
  '/check/:userId/:infoType',
  verifyJwt,
  validate(checkVisibilitySchema),
  privacyController.checkVisibility
)

// Update all privacy settings
router.patch(
  '/me',
  verifyJwt,
  validate(privacySettingSchema),
  privacyController.updateMyPrivacySettings
)

// Update a specific privacy setting
router.patch(
  '/me/:settingName',
  verifyJwt,
  validate(updateSingleSettingSchema),
  privacyController.updatePrivacySetting
)

// Reset privacy settings to defaults
router.post('/me/reset', verifyJwt, privacyController.resetPrivacySettings)

module.exports = router
