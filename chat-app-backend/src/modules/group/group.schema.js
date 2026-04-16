const { z } = require('zod')

const listGroupsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
  }).optional(),
})

const createGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    memberIds: z.array(z.string().min(1)).min(1).max(100),
    description: z.string().trim().max(240).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
})

const updateGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(240).optional(),
    whoCanSend: z.enum(['all', 'admins']).optional(),
    whoCanAdd: z.enum(['all', 'admins']).optional(),
  }),
  params: z.object({
    groupId: z.string().min(1),
  }),
  query: z.object({}).optional(),
})

const addGroupMembersSchema = z.object({
  body: z.object({
    memberIds: z.array(z.string().min(1)).min(1).max(100),
  }),
  params: z.object({
    groupId: z.string().min(1),
  }),
  query: z.object({}).optional(),
})

module.exports = { listGroupsSchema, createGroupSchema, updateGroupSchema, addGroupMembersSchema }
