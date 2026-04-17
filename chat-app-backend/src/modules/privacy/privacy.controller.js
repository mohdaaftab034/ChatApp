const privacyService = require('./privacy.service')
const { formatResponse } = require('../../utils/formatResponse')

/**
 * Get current user's privacy settings
 */
async function getMyPrivacySettings(req, res, next) {
  try {
    const data = await privacyService.getMyPrivacySettings(req.user.sub)
    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

/**
 * Update current user's privacy settings
 */
async function updateMyPrivacySettings(req, res, next) {
  try {
    const data = await privacyService.updateMyPrivacySettings(req.user.sub, req.body || {})
    return res.status(200).json(
      formatResponse({
        message: 'Privacy settings updated successfully',
        data,
      })
    )
  } catch (error) {
    return next(error)
  }
}

/**
 * Get a specific privacy setting
 */
async function getPrivacySetting(req, res, next) {
  try {
    const { settingName } = req.params
    const data = await privacyService.getPrivacySetting(req.user.sub, settingName)
    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

/**
 * Update a specific privacy setting
 */
async function updatePrivacySetting(req, res, next) {
  try {
    const { settingName } = req.params
    const { value } = req.body

    if (value === undefined) {
      const error = new Error('value field is required')
      error.statusCode = 400
      return next(error)
    }

    const data = await privacyService.updatePrivacySetting(req.user.sub, settingName, value)
    return res.status(200).json(
      formatResponse({
        message: `${settingName} setting updated successfully`,
        data,
      })
    )
  } catch (error) {
    return next(error)
  }
}

/**
 * Reset privacy settings to defaults
 */
async function resetPrivacySettings(req, res, next) {
  try {
    const data = await privacyService.resetPrivacySettings(req.user.sub)
    return res.status(200).json(
      formatResponse({
        message: 'Privacy settings reset to defaults',
        data,
      })
    )
  } catch (error) {
    return next(error)
  }
}

/**
 * Check if current user can see another user's information
 */
async function checkVisibility(req, res, next) {
  try {
    const { userId, infoType } = req.params
    const canSee = await privacyService.canUserSeeInfo(req.user.sub, userId, infoType)
    return res.status(200).json(
      formatResponse({
        data: {
          userId,
          infoType,
          canView: canSee,
        },
      })
    )
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getMyPrivacySettings,
  updateMyPrivacySettings,
  getPrivacySetting,
  updatePrivacySetting,
  resetPrivacySettings,
  checkVisibility,
}
