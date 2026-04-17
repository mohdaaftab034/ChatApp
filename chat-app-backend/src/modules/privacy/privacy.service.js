const User = require('../../models/User.model')

const VISIBILITY_LEVELS = ['nobody', 'contacts', 'everyone']

const DEFAULT_PRIVACY_SETTINGS = {
  lastSeen: 'contacts',
  profilePhoto: 'everyone',
  onlineStatus: 'contacts',
  typingStatus: 'contacts',
  aboutInfo: 'everyone',
  readReceipts: true,
}

/**
 * Get privacy settings for the current user
 */
async function getMyPrivacySettings(userId) {
  const user = await User.findById(userId).select('privacy')
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return {
    lastSeen: user.privacy?.lastSeen || DEFAULT_PRIVACY_SETTINGS.lastSeen,
    profilePhoto: user.privacy?.profilePhoto || DEFAULT_PRIVACY_SETTINGS.profilePhoto,
    onlineStatus: user.privacy?.onlineStatus || DEFAULT_PRIVACY_SETTINGS.onlineStatus,
    typingStatus: user.privacy?.typingStatus || DEFAULT_PRIVACY_SETTINGS.typingStatus,
    aboutInfo: user.privacy?.aboutInfo || DEFAULT_PRIVACY_SETTINGS.aboutInfo,
    readReceipts: user.privacy?.readReceipts ?? DEFAULT_PRIVACY_SETTINGS.readReceipts,
  }
}

/**
 * Update privacy settings for the current user
 */
async function updateMyPrivacySettings(userId, payload) {
  const user = await User.findById(userId)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  if (!user.privacy) {
    user.privacy = {}
  }

  // Update lastSeen visibility
  if (typeof payload.lastSeen === 'string' && VISIBILITY_LEVELS.includes(payload.lastSeen)) {
    user.privacy.lastSeen = payload.lastSeen
  }

  // Update profilePhoto visibility
  if (typeof payload.profilePhoto === 'string' && VISIBILITY_LEVELS.includes(payload.profilePhoto)) {
    user.privacy.profilePhoto = payload.profilePhoto
  }

  // Update onlineStatus visibility
  if (typeof payload.onlineStatus === 'string' && VISIBILITY_LEVELS.includes(payload.onlineStatus)) {
    user.privacy.onlineStatus = payload.onlineStatus
  }

  // Update typingStatus visibility
  if (typeof payload.typingStatus === 'string' && VISIBILITY_LEVELS.includes(payload.typingStatus)) {
    user.privacy.typingStatus = payload.typingStatus
  }

  // Update aboutInfo visibility
  if (typeof payload.aboutInfo === 'string' && VISIBILITY_LEVELS.includes(payload.aboutInfo)) {
    user.privacy.aboutInfo = payload.aboutInfo
  }

  // Update readReceipts
  if (typeof payload.readReceipts === 'boolean') {
    user.privacy.readReceipts = payload.readReceipts
  }

  await user.save()

  return {
    lastSeen: user.privacy.lastSeen,
    profilePhoto: user.privacy.profilePhoto,
    onlineStatus: user.privacy.onlineStatus,
    typingStatus: user.privacy.typingStatus,
    aboutInfo: user.privacy.aboutInfo,
    readReceipts: user.privacy.readReceipts,
  }
}

/**
 * Get specific privacy setting
 */
async function getPrivacySetting(userId, settingName) {
  const validSettings = ['lastSeen', 'profilePhoto', 'onlineStatus', 'typingStatus', 'aboutInfo', 'readReceipts']

  if (!validSettings.includes(settingName)) {
    const error = new Error(`Invalid privacy setting: ${settingName}`)
    error.statusCode = 400
    throw error
  }

  const user = await User.findById(userId).select('privacy')
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  const value = user.privacy?.[settingName] ?? DEFAULT_PRIVACY_SETTINGS[settingName]

  return {
    setting: settingName,
    value,
  }
}

/**
 * Update specific privacy setting
 */
async function updatePrivacySetting(userId, settingName, settingValue) {
  const validSettings = ['lastSeen', 'profilePhoto', 'onlineStatus', 'typingStatus', 'aboutInfo', 'readReceipts']

  if (!validSettings.includes(settingName)) {
    const error = new Error(`Invalid privacy setting: ${settingName}`)
    error.statusCode = 400
    throw error
  }

  const user = await User.findById(userId)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  if (!user.privacy) {
    user.privacy = {}
  }

  // Validate setting-specific values
  if (settingName === 'readReceipts') {
    if (typeof settingValue !== 'boolean') {
      const error = new Error('readReceipts must be a boolean')
      error.statusCode = 400
      throw error
    }
  } else {
    // visibility-based settings
    if (!VISIBILITY_LEVELS.includes(settingValue)) {
      const error = new Error(`${settingName} must be one of: ${VISIBILITY_LEVELS.join(', ')}`)
      error.statusCode = 400
      throw error
    }
  }

  user.privacy[settingName] = settingValue
  await user.save()

  return {
    setting: settingName,
    value: user.privacy[settingName],
  }
}

/**
 * Reset privacy settings to defaults
 */
async function resetPrivacySettings(userId) {
  const user = await User.findById(userId)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  user.privacy = { ...DEFAULT_PRIVACY_SETTINGS }
  await user.save()

  return user.privacy
}

/**
 * Check if a user can see another user's information based on privacy settings
 */
async function canUserSeeInfo(viewerId, targetUserId, infoType) {
  if (viewerId === targetUserId) {
    return true // Users can always see their own info
  }

  const validInfoTypes = ['lastSeen', 'profilePhoto', 'onlineStatus', 'typingStatus', 'aboutInfo']

  if (!validInfoTypes.includes(infoType)) {
    const error = new Error(`Invalid info type: ${infoType}`)
    error.statusCode = 400
    throw error
  }

  const targetUser = await User.findById(targetUserId).select('privacy blockedUserIds')
  if (!targetUser) {
    return false
  }

  // Check if target user has blocked viewer
  if (targetUser.blockedUserIds?.includes(viewerId)) {
    return false
  }

  const privacySetting = targetUser.privacy?.[infoType] ?? DEFAULT_PRIVACY_SETTINGS[infoType]

  if (privacySetting === 'everyone') {
    return true
  }

  if (privacySetting === 'nobody') {
    return false
  }

  // Check if viewer is in target user's contacts (for 'contacts' visibility)
  if (privacySetting === 'contacts') {
    const Contact = require('../../models/Contact.model')
    const isContact = await Contact.findOne({
      userId: targetUserId,
      contactId: viewerId,
    })
    return !!isContact
  }

  return false
}

/**
 * Get privacy settings for multiple users (admin/system use)
 */
async function getPrivacySettingsForUsers(userIds) {
  const users = await User.find(
    { _id: { $in: userIds } },
    { privacy: 1, _id: 1 }
  ).lean()

  return users.map((user) => ({
    userId: user._id.toString(),
    privacy: user.privacy || { ...DEFAULT_PRIVACY_SETTINGS },
  }))
}

module.exports = {
  getMyPrivacySettings,
  updateMyPrivacySettings,
  getPrivacySetting,
  updatePrivacySetting,
  resetPrivacySettings,
  canUserSeeInfo,
  getPrivacySettingsForUsers,
  DEFAULT_PRIVACY_SETTINGS,
}
