const roomNames = {
  conversation: (conversationId) => `conversation:${conversationId}`,
  user: (userId) => `user:${userId}`,
  group: (groupId) => `group:${groupId}`,
}

module.exports = roomNames
