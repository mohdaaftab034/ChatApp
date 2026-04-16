const { z } = require('zod')

const listContactsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    q: z.string().trim().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  }).optional(),
})

module.exports = { listContactsSchema }
