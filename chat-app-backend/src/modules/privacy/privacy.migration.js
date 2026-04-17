/**
 * Migration script to initialize privacy settings for existing users
 * Run this script once to add default privacy settings to all users who don't have them
 */

const mongoose = require('mongoose')
const User = require('../../models/User.model')
const env = require('../../config/env')

const DEFAULT_PRIVACY_SETTINGS = {
  lastSeen: 'contacts',
  profilePhoto: 'everyone',
  onlineStatus: 'contacts',
  typingStatus: 'contacts',
  aboutInfo: 'everyone',
  readReceipts: true,
}

async function initializePrivacySettings() {
  try {
    // Connect to database
    await mongoose.connect(env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log('Connected to MongoDB')

    // Find users without privacy settings
    const usersWithoutPrivacy = await User.find({
      $or: [
        { privacy: { $exists: false } },
        { privacy: null },
      ],
    })

    console.log(`Found ${usersWithoutPrivacy.length} users without privacy settings`)

    if (usersWithoutPrivacy.length === 0) {
      console.log('All users already have privacy settings')
      process.exit(0)
    }

    // Update users to add privacy settings
    const result = await User.updateMany(
      {
        $or: [
          { privacy: { $exists: false } },
          { privacy: null },
        ],
      },
      { $set: { privacy: DEFAULT_PRIVACY_SETTINGS } }
    )

    console.log(`Updated ${result.modifiedCount} users with default privacy settings`)

    // Verify the update
    const updatedUsers = await User.countDocuments({ 'privacy.lastSeen': 'contacts' })
    console.log(`Verification: ${updatedUsers} users now have privacy settings`)

    process.exit(0)
  } catch (error) {
    console.error('Error during migration:', error)
    process.exit(1)
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  initializePrivacySettings()
}

module.exports = { initializePrivacySettings }
