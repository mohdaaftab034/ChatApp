# Privacy Settings API Documentation

## Overview

The Privacy Settings API allows users to control who can see various aspects of their profile and presence information. All privacy settings are stored per-user and can be managed through dedicated endpoints.

## Privacy Settings Options

### Visibility Levels
- `nobody`: Information is hidden from everyone except yourself
- `contacts`: Information is visible only to users in your contacts
- `everyone`: Information is visible to all users

### Available Privacy Settings

1. **lastSeen** (visibility level)
   - Controls who can see when you were last online
   - Default: `contacts`

2. **profilePhoto** (visibility level)
   - Controls who can see your profile picture
   - Default: `everyone`

3. **onlineStatus** (visibility level)
   - Controls who can see your current online status (online, away, busy, invisible)
   - Default: `contacts`

4. **typingStatus** (visibility level)
   - Controls who can see when you're typing
   - Default: `contacts`

5. **aboutInfo** (visibility level)
   - Controls who can see your bio, location, department, and social links
   - Default: `everyone`

6. **readReceipts** (boolean)
   - Controls whether others see when you've read their messages
   - Default: `true` (enabled)

## API Endpoints

### 1. Get All Privacy Settings

Retrieve all privacy settings for the current user.

**Endpoint:** `GET /api/privacy/me`

**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "data": {
    "lastSeen": "contacts",
    "profilePhoto": "everyone",
    "onlineStatus": "contacts",
    "typingStatus": "contacts",
    "aboutInfo": "everyone",
    "readReceipts": true
  }
}
```

---

### 2. Update All Privacy Settings

Update one or more privacy settings at once.

**Endpoint:** `PATCH /api/privacy/me`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "lastSeen": "nobody",
  "profilePhoto": "contacts",
  "readReceipts": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Privacy settings updated successfully",
  "data": {
    "lastSeen": "nobody",
    "profilePhoto": "contacts",
    "onlineStatus": "contacts",
    "typingStatus": "contacts",
    "aboutInfo": "everyone",
    "readReceipts": false
  }
}
```

---

### 3. Get Specific Privacy Setting

Retrieve a single privacy setting.

**Endpoint:** `GET /api/privacy/me/:settingName`

**Authentication:** Required (JWT)

**Parameters:**
- `settingName` (string): One of `lastSeen`, `profilePhoto`, `onlineStatus`, `typingStatus`, `aboutInfo`, `readReceipts`

**Example:** `GET /api/privacy/me/lastSeen`

**Response:**
```json
{
  "success": true,
  "data": {
    "setting": "lastSeen",
    "value": "contacts"
  }
}
```

---

### 4. Update Specific Privacy Setting

Update a single privacy setting.

**Endpoint:** `PATCH /api/privacy/me/:settingName`

**Authentication:** Required (JWT)

**Parameters:**
- `settingName` (string): The setting to update

**Request Body:**
```json
{
  "value": "nobody"
}
```

**Example:** `PATCH /api/privacy/me/lastSeen`

**Response:**
```json
{
  "success": true,
  "message": "lastSeen setting updated successfully",
  "data": {
    "setting": "lastSeen",
    "value": "nobody"
  }
}
```

---

### 5. Reset Privacy Settings to Defaults

Reset all privacy settings to their default values.

**Endpoint:** `POST /api/privacy/me/reset`

**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "message": "Privacy settings reset to defaults",
  "data": {
    "lastSeen": "contacts",
    "profilePhoto": "everyone",
    "onlineStatus": "contacts",
    "typingStatus": "contacts",
    "aboutInfo": "everyone",
    "readReceipts": true
  }
}
```

---

### 6. Check Information Visibility

Check if the current user can see specific information about another user.

**Endpoint:** `GET /api/privacy/check/:userId/:infoType`

**Authentication:** Required (JWT)

**Parameters:**
- `userId` (string): The ID of the user to check visibility for
- `infoType` (string): One of `lastSeen`, `profilePhoto`, `onlineStatus`, `typingStatus`, `aboutInfo`

**Example:** `GET /api/privacy/check/507f1f77bcf86cd799439011/lastSeen`

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "infoType": "lastSeen",
    "canView": true
  }
}
```

---

## Privacy Enforcement

The system automatically enforces privacy settings in the following scenarios:

### Profile Viewing (`GET /api/users/:userId`)
- Profile photo is hidden if not authorized by `profilePhoto` setting
- Bio, location, department, and social links are hidden if not authorized by `aboutInfo` setting
- Blocked users always see a limited profile

### Directory Listing (`GET /api/users/directory`)
- `lastSeen` is hidden for users who don't meet the `lastSeen` privacy requirements

### Message System
- If user has `readReceipts: false`, read status is not sent in messages

### Visibility Rules

The visibility system respects the following hierarchy:
1. **Self**: Can always see own information
2. **Blocked**: Users who are blocked see minimal information
3. **Contacts**: Visibility rules check if users are in contacts list
4. **Privacy Settings**: Enforced based on user's chosen visibility level

---

## Default Privacy Settings

```json
{
  "lastSeen": "contacts",
  "profilePhoto": "everyone",
  "onlineStatus": "contacts",
  "typingStatus": "contacts",
  "aboutInfo": "everyone",
  "readReceipts": true
}
```

---

## Error Handling

### Invalid Setting Name
```json
{
  "success": false,
  "error": "Invalid privacy setting: invalidSetting"
}
```
**Status Code:** 400

### Invalid Setting Value
```json
{
  "success": false,
  "error": "lastSeen must be one of: nobody, contacts, everyone"
}
```
**Status Code:** 400

### User Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```
**Status Code:** 404

---

## Usage Examples

### Example 1: Set Profile to Private

Make your profile visible only to contacts:

```bash
curl -X PATCH http://localhost:3000/api/privacy/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profilePhoto": "contacts",
    "aboutInfo": "contacts",
    "lastSeen": "nobody"
  }'
```

### Example 2: Disable Read Receipts

```bash
curl -X PATCH http://localhost:3000/api/privacy/me/readReceipts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "value": false }'
```

### Example 3: Check if You Can See User's Last Seen

```bash
curl -X GET "http://localhost:3000/api/privacy/check/507f1f77bcf86cd799439011/lastSeen" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Implementation Notes

- Privacy settings are optional - if not set, default values are used
- Changes to privacy settings take effect immediately
- Privacy settings do not affect your ability to send or receive messages
- Blocked users' privacy settings do not apply - they see a restricted profile
- The system respects contact relationships for "contacts" level visibility
- Privacy checks are performed server-side to ensure enforcement

---

## Database Schema

```javascript
// User Model - privacy field
privacy: {
  lastSeen: String, // 'nobody' | 'contacts' | 'everyone'
  profilePhoto: String,
  onlineStatus: String,
  typingStatus: String,
  aboutInfo: String,
  readReceipts: Boolean
}
```

---

## Future Enhancements

Potential future improvements to privacy features:
- Granular contact-level permissions (allow/deny specific users)
- Scheduled privacy changes
- Activity log showing who viewed your profile
- Custom privacy presets
- Privacy audit trail
