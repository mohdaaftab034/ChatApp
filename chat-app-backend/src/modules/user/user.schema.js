const { z } = require('zod')

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    bio: z.string().max(160).optional(),
    username: z.string().min(3).max(20).optional(),
    status: z.enum(['online', 'away', 'busy', 'invisible']).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

module.exports = { updateProfileSchema }
