/**
 * Privacy utility helpers for filtering and checking user information access
 */

const Contact = require('../../models/Contact.model')

const DEFAULT_PRIVACY_SETTINGS = {
  lastSeen: 'contacts',
  profilePhoto: 'everyone',
  onlineStatus: 'contacts',
  typingStatus: 'contacts',
  aboutInfo: 'everyone',
  readReceipts: true,
}

/**
 * Check if a viewer can see specific information about a target user
 * @param {string} viewerId - ID of user trying to view information
 * @param {Object} targetUser - Target user document with privacy settings
 * @param {string} infoType - Type of information (lastSeen, profilePhoto, etc)
 * @returns {Promise<boolean>}
 */
async function canViewInfo(viewerId, targetUser, infoType) {
  // Can always view own info
  if (viewerId === targetUser._id.toString() || viewerId === targetUser._id) {
    return true
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
    const isContact = await Contact.findOne({
      userId: targetUser._id,
      contactId: viewerId,
    })
    return !!isContact
  }

  return false
}

/**
 * Filter user profile data based on privacy settings
 * @param {Object} userDoc - User document with privacy settings
 * @param {string} viewerId - ID of user viewing the profile
 * @param {Object} profileData - Profile object to filter
 * @returns {Promise<Object>} Filtered profile data
 */
async function filterProfileByPrivacy(userDoc, viewerId, profileData) {
  // Can always view own profile unfiltered
  if (viewerId === userDoc._id.toString() || viewerId === userDoc._id) {
    return profileData
  }

  const privacy = userDoc.privacy || DEFAULT_PRIVACY_SETTINGS
  const filtered = { ...profileData }

  // Check if viewer is a contact
  const isContact = await Contact.findOne({
    userId: userDoc._id,
    contactId: viewerId,
  })

  const canView = (privacyLevel) => {
    if (privacyLevel === 'everyone') return true
    if (privacyLevel === 'nobody') return false
    if (privacyLevel === 'contacts') return !!isContact
    return true
  }

  // Hide profile photo if not authorized
  if (!canView(privacy.profilePhoto)) {
    filtered.avatar = null
  }

  // Hide about info if not authorized
  if (!canView(privacy.aboutInfo)) {
    filtered.bio = ''
    filtered.headline = ''
    filtered.location = ''
    filtered.department = ''
    filtered.social = { website: '', linkedin: '', x: '' }
  }

  // Hide status if not authorized
  if (!canView(privacy.onlineStatus)) {
    filtered.status = 'offline' // Default to offline if can't view
  }

  return filtered
}

/**
 * Get visible fields for a user based on privacy settings
 * @param {Object} userDoc - User document with privacy settings
 * @param {string} viewerId - ID of user viewing
 * @returns {Promise<Object>} Object with boolean flags for each info type
 */
async function getVisibleFields(userDoc, viewerId) {
  const visible = {
    profilePhoto: await canViewInfo(viewerId, userDoc, 'profilePhoto'),
    onlineStatus: await canViewInfo(viewerId, userDoc, 'onlineStatus'),
    typingStatus: await canViewInfo(viewerId, userDoc, 'typingStatus'),
    aboutInfo: await canViewInfo(viewerId, userDoc, 'aboutInfo'),
    lastSeen: await canViewInfo(viewerId, userDoc, 'lastSeen'),
    readReceipts: userDoc.privacy?.readReceipts ?? DEFAULT_PRIVACY_SETTINGS.readReceipts,
  }

  return visible
}

/**
 * Batch check privacy settings for multiple users
 * @param {string} viewerId - ID of user viewing
 * @param {Array} userDocs - Array of user documents
 * @param {string} infoType - Type of information to check
 * @returns {Promise<Object>} Map of userId -> canView
 */
async function canViewInfoBatch(viewerId, userDocs, infoType) {
  const results = {}

  for (const userDoc of userDocs) {
    results[userDoc._id.toString()] = await canViewInfo(viewerId, userDoc, infoType)
  }

  return results
}

/**
 * Sanitize user list based on privacy settings
 * @param {string} viewerId - ID of user viewing the list
 * @param {Array} users - Array of user objects to sanitize
 * @returns {Promise<Array>} Sanitized user list
 */
async function sanitizeUserList(viewerId, users) {
  // Get all contacts for the viewer
  const contacts = await Contact.find({ userId: viewerId }).select('contactId').lean()
  const contactIds = new Set(contacts.map((c) => c.contactId.toString()))

  return users.map((user) => {
    const privacy = user.privacy || DEFAULT_PRIVACY_SETTINGS
    const isContact = contactIds.has(user._id.toString() || user.id)
    const isOwnProfile = user._id.toString() === viewerId || user.id === viewerId

    const canView = (privacyLevel) => {
      if (isOwnProfile) return true
      if (privacyLevel === 'everyone') return true
      if (privacyLevel === 'nobody') return false
      if (privacyLevel === 'contacts') return isContact
      return true
    }

    const sanitized = { ...user }

    if (!canView(privacy.profilePhoto)) {
      sanitized.avatar = null
    }

    if (!canView(privacy.lastSeen)) {
      sanitized.lastSeen = null
    }

    if (!canView(privacy.onlineStatus)) {
      sanitized.status = 'offline'
    }

    return sanitized
  })
}

module.exports = {
  canViewInfo,
  filterProfileByPrivacy,
  getVisibleFields,
  canViewInfoBatch,
  sanitizeUserList,
  DEFAULT_PRIVACY_SETTINGS,
}
