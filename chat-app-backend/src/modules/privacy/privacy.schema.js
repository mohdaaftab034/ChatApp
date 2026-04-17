const { z } = require('zod')

const visibilityLevel = z.enum(['nobody', 'contacts', 'everyone'])

const privacySettingSchema = z.object({
  body: z.object({
    lastSeen: visibilityLevel.optional(),
    profilePhoto: visibilityLevel.optional(),
    onlineStatus: visibilityLevel.optional(),
    typingStatus: visibilityLevel.optional(),
    aboutInfo: visibilityLevel.optional(),
    readReceipts: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

const updateSingleSettingSchema = z.object({
  body: z.object({
    value: z.union([visibilityLevel, z.boolean()]),
  }),
  params: z.object({
    settingName: z.string(),
  }),
  query: z.object({}).optional(),
})

const checkVisibilitySchema = z.object({
  params: z.object({
    userId: z.string(),
    infoType: z.enum(['lastSeen', 'profilePhoto', 'onlineStatus', 'typingStatus', 'aboutInfo']),
  }),
  query: z.object({}).optional(),
})

module.exports = {
  privacySettingSchema,
  updateSingleSettingSchema,
  checkVisibilitySchema,
}
