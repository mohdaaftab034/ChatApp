const { z } = require('zod')

const searchSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    q: z.string().trim().min(1).max(200),
    conversationId: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
})

module.exports = { searchSchema }
