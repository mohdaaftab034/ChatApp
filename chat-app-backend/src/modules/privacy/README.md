# Privacy Module

This module provides comprehensive privacy settings management for chat application users. It controls who can see various aspects of user profiles and presence information.

## Features

- **Granular Privacy Controls**: Control visibility of specific information (profile photo, last seen, online status, etc.)
- **Flexible Visibility Levels**: Three levels - nobody, contacts, everyone
- **Automatic Enforcement**: Privacy settings are automatically enforced across the application
- **Batch Operations**: Check privacy for multiple users efficiently
- **Integration Utilities**: Helper functions for other modules to respect privacy settings

## File Structure

```
privacy/
├── privacy.controller.js      # Request handlers
├── privacy.service.js         # Business logic
├── privacy.routes.js          # API endpoints
├── privacy.schema.js          # Input validation schemas
├── privacy.migration.js       # Database migration script
├── README.md                  # This file
└── PRIVACY_API.md            # Detailed API documentation
```

## Privacy Settings

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `lastSeen` | visibility | contacts | Who can see when you were last online |
| `profilePhoto` | visibility | everyone | Who can see your profile picture |
| `onlineStatus` | visibility | contacts | Who can see your online status |
| `typingStatus` | visibility | contacts | Who can see when you're typing |
| `aboutInfo` | visibility | everyone | Who can see your bio, location, social links |
| `readReceipts` | boolean | true | Whether others see when you've read messages |

### Visibility Levels

- **`nobody`**: Hidden from everyone except yourself
- **`contacts`**: Visible only to users in your contacts list
- **`everyone`**: Visible to all users

## Module Integration

### 1. Privacy Service

The main business logic layer:

```javascript
const privacyService = require('./privacy.service')

// Get all privacy settings
const settings = await privacyService.getMyPrivacySettings(userId)

// Update privacy settings
const updated = await privacyService.updateMyPrivacySettings(userId, {
  lastSeen: 'nobody',
  readReceipts: false,
})

// Check if user can view another user's info
const canSee = await privacyService.canUserSeeInfo(viewerId, targetUserId, 'lastSeen')

// Get specific setting
const setting = await privacyService.getPrivacySetting(userId, 'profilePhoto')

// Update specific setting
const updated = await privacyService.updatePrivacySetting(userId, 'lastSeen', 'contacts')

// Reset to defaults
const reset = await privacyService.resetPrivacySettings(userId)
```

### 2. Privacy Utilities

Helper functions for other modules:

```javascript
const privacyUtil = require('../../utils/privacy')

// Check if user can view info
const canView = await privacyUtil.canViewInfo(viewerId, targetUserDoc, 'lastSeen')

// Filter profile data based on privacy
const filtered = await privacyUtil.filterProfileByPrivacy(userDoc, viewerId, profileData)

// Get visible fields for a user
const visible = await privacyUtil.getVisibleFields(userDoc, viewerId)

// Batch check for multiple users
const results = await privacyUtil.canViewInfoBatch(viewerId, userDocs, 'onlineStatus')

// Sanitize user list respecting privacy
const sanitized = await privacyUtil.sanitizeUserList(viewerId, userList)
```

## API Endpoints

### Public Endpoints

```
GET    /api/privacy/me                    - Get all privacy settings
PATCH  /api/privacy/me                    - Update all privacy settings
GET    /api/privacy/me/:settingName       - Get specific setting
PATCH  /api/privacy/me/:settingName       - Update specific setting
POST   /api/privacy/me/reset              - Reset to defaults
GET    /api/privacy/check/:userId/:infoType - Check if you can view info
```

For detailed endpoint documentation, see [PRIVACY_API.md](./PRIVACY_API.md)

## Usage Examples

### Example 1: Update Privacy in Other Modules

When displaying a user profile in the User module:

```javascript
// In user.service.js
const privacyUtil = require('../../utils/privacy')

async function getProfileById(viewerId, userId) {
  const user = await User.findById(userId)
  const profile = toProfile(user)
  
  // Apply privacy settings
  const filtered = await privacyUtil.filterProfileByPrivacy(user, viewerId, profile)
  return filtered
}
```

### Example 2: Check Privacy Before Showing Information

When listing users in conversations:

```javascript
// In conversation.service.js
const privacyUtil = require('../../utils/privacy')

async function getConversationMembers(userId, conversationId) {
  const conversation = await Conversation.findById(conversationId)
  const members = await User.find({ _id: { $in: conversation.members } })
  
  // Sanitize member list respecting privacy
  const sanitized = await privacyUtil.sanitizeUserList(userId, members)
  return sanitized
}
```

### Example 3: Check Privacy Permission

Before showing online status:

```javascript
// In any controller
const privacyService = require('../privacy/privacy.service')

async function checkCanViewStatus(viewerId, targetUserId) {
  const canView = await privacyService.canUserSeeInfo(viewerId, targetUserId, 'onlineStatus')
  
  if (!canView) {
    // Return offline or don't include status
    return { status: 'offline' }
  }
  
  // Return actual status
  const user = await User.findById(targetUserId)
  return { status: user.status }
}
```

### Example 4: Socket Events Respecting Privacy

When sending typing indicators via socket:

```javascript
// In socket handler
const privacyService = require('../privacy/privacy.service')

socket.on('typing', async (data) => {
  const { conversationId, userId } = data
  
  // Check if users can see typing status
  const conversation = await Conversation.findById(conversationId)
  
  for (const memberId of conversation.members) {
    if (memberId === userId) continue
    
    const canSeeTyping = await privacyService.canUserSeeInfo(memberId, userId, 'typingStatus')
    
    if (canSeeTyping) {
      io.to(memberId).emit('user-typing', { userId, conversationId })
    }
  }
})
```

## Database Migration

To initialize privacy settings for existing users:

```bash
# Run migration script
node src/modules/privacy/privacy.migration.js
```

This will:
1. Find all users without privacy settings
2. Add default privacy settings to them
3. Verify the migration was successful

## Model Updates

The User model was updated to include:

```javascript
privacy: {
  lastSeen: { type: String, enum: ['nobody', 'contacts', 'everyone'], default: 'contacts' },
  profilePhoto: { type: String, enum: ['nobody', 'contacts', 'everyone'], default: 'everyone' },
  onlineStatus: { type: String, enum: ['nobody', 'contacts', 'everyone'], default: 'contacts' },
  typingStatus: { type: String, enum: ['nobody', 'contacts', 'everyone'], default: 'contacts' },
  aboutInfo: { type: String, enum: ['nobody', 'contacts', 'everyone'], default: 'everyone' },
  readReceipts: { type: Boolean, default: true },
}
```

## Error Handling

The module includes comprehensive error handling:

```javascript
// Invalid privacy setting
{
  "success": false,
  "error": "Invalid privacy setting: invalidSetting",
  "statusCode": 400
}

// Invalid privacy value
{
  "success": false,
  "error": "lastSeen must be one of: nobody, contacts, everyone",
  "statusCode": 400
}

// User not found
{
  "success": false,
  "error": "User not found",
  "statusCode": 404
}
```

## Default Privacy Settings

```javascript
{
  lastSeen: 'contacts',
  profilePhoto: 'everyone',
  onlineStatus: 'contacts',
  typingStatus: 'contacts',
  aboutInfo: 'everyone',
  readReceipts: true
}
```

## Input Validation

All endpoints use Zod schemas for input validation:

```javascript
// Valid privacy setting updates
{
  "lastSeen": "nobody",
  "profilePhoto": "contacts",
  "readReceipts": false
}

// Valid single setting update
{
  "value": "contacts"
}
```

## Best Practices

### 1. Always Check Privacy Before Sharing Information

```javascript
// ❌ Bad - sharing all user data
const users = await User.find()
res.json(users)

// ✅ Good - respecting privacy
const users = await User.find()
const sanitized = await privacyUtil.sanitizeUserList(viewerId, users)
res.json(sanitized)
```

### 2. Use Utility Functions for Filtering

```javascript
// ❌ Bad - checking privacy manually
if (user.privacy?.lastSeen === 'everyone' || /* complex logic */) {
  profile.lastSeen = user.lastSeen
}

// ✅ Good - using utilities
const filtered = await privacyUtil.filterProfileByPrivacy(user, viewerId, profile)
```

### 3. Cache Privacy Settings for Bulk Operations

```javascript
// For operations with many users, batch check privacy
const canView = await privacyUtil.canViewInfoBatch(viewerId, users, 'onlineStatus')

users.forEach((user) => {
  if (!canView[user._id.toString()]) {
    user.status = 'offline'
  }
})
```

## Testing

### Unit Tests

```javascript
describe('Privacy Service', () => {
  it('should get privacy settings', async () => {
    const settings = await privacyService.getMyPrivacySettings(userId)
    expect(settings.lastSeen).toBe('contacts')
  })

  it('should update privacy settings', async () => {
    const updated = await privacyService.updateMyPrivacySettings(userId, {
      lastSeen: 'nobody',
    })
    expect(updated.lastSeen).toBe('nobody')
  })

  it('should check visibility correctly', async () => {
    const canView = await privacyService.canUserSeeInfo(viewerId, targetId, 'lastSeen')
    expect(typeof canView).toBe('boolean')
  })
})
```

## Future Enhancements

- [ ] Custom privacy levels per contact
- [ ] Scheduled privacy changes
- [ ] Activity log for profile views
- [ ] Privacy audit trail
- [ ] Bulk privacy templates
- [ ] Privacy warnings for sensitive settings

## Troubleshooting

### Privacy settings not being respected

1. Check that Contact model is properly populated
2. Verify User model has privacy field
3. Run migration script: `node src/modules/privacy/privacy.migration.js`
4. Check console logs for privacy check errors

### Performance issues with privacy checks

1. Use `canViewInfoBatch` for checking multiple users
2. Cache contact relationships in session
3. Consider adding database indexes on `Contact.userId` and `Contact.contactId`

## Contributing

When adding features that display user information:

1. Always use privacy utility functions
2. Never expose blocked user information
3. Test with different privacy settings
4. Document privacy considerations
5. Add privacy checks to new endpoints

## License

Same as main project
