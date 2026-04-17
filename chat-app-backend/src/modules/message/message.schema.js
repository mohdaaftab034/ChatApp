const { z } = require('zod')

const listMessagesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    conversationId: z.string().min(1),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    before: z.string().datetime().optional(),
  }),
})

const searchMessagesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    conversationId: z.string().min(1),
    q: z.string().trim().min(1).max(200),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
})

const createMessageSchema = z.object({
  body: z.object({
    conversationId: z.string().min(1),
    type: z.enum(['text', 'image', 'video', 'audio', 'file', 'link', 'location', 'contact', 'system']).optional(),
    text: z.string().trim().optional(),
    mediaUrl: z.string().url().optional(),
    fileName: z.string().trim().optional(),
    fileSize: z.coerce.number().int().positive().optional(),
    audioDuration: z.coerce.number().nonnegative().optional(),
    location: z.object({
      lat: z.coerce.number().gte(-90).lte(90),
      lng: z.coerce.number().gte(-180).lte(180),
      label: z.string().trim().max(120).optional(),
    }).optional(),
    sharedContact: z.object({
      userId: z.string().min(1),
      name: z.string().trim().min(1).max(100),
      username: z.string().trim().max(50).optional(),
      email: z.string().email().optional(),
      phone: z.string().trim().max(30).optional(),
      avatar: z.string().url().nullable().optional(),
    }).optional(),
    encryptedPayload: z.object({
      ciphertext: z.string().min(1),
      iv: z.string().min(1),
      encryptedKeys: z.record(z.string().min(1), z.string().min(1)),
      senderKeyId: z.string().min(1).optional(),
    }).optional(),
    clientTempId: z.string().min(1).optional(),
    replyToId: z.string().min(1).optional(),
  }).refine((body) => Boolean(body.text || body.mediaUrl || body.location || body.sharedContact || body.encryptedPayload), {
    message: 'Message must include text, mediaUrl, location, sharedContact, or encryptedPayload',
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

const markReadSchema = z.object({
  body: z.object({
    messageIds: z.array(z.string().min(1)).min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

const clearMessagesSchema = z.object({
  body: z.object({
    conversationId: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

const deleteMessageSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    messageId: z.string().min(1),
  }),
  query: z.object({}).optional(),
})

module.exports = {
  listMessagesSchema,
  searchMessagesSchema,
  createMessageSchema,
  markReadSchema,
  clearMessagesSchema,
  deleteMessageSchema,
}
