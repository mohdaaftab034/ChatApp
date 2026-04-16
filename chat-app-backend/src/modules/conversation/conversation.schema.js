const { z } = require('zod')

const listConversationsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
  }).optional(),
})

const startDirectConversationSchema = z.object({
  body: z.object({
    targetUserId: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

module.exports = { listConversationsSchema, startDirectConversationSchema }
