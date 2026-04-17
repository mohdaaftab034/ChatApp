const User = require('../models/User.model')

async function getBlockState(userId, targetUserId) {
  if (!userId || !targetUserId || userId === targetUserId) {
    return {
      viewerBlockedTarget: false,
      targetBlockedViewer: false,
      isBlocked: false,
    }
  }

  const users = await User.find({ _id: { $in: [userId, targetUserId] } })
    .select('_id blockedUserIds')
    .lean()

  const viewer = users.find((user) => user._id.toString() === userId)
  const target = users.find((user) => user._id.toString() === targetUserId)

  const viewerBlockedTarget = Boolean((viewer?.blockedUserIds || []).includes(targetUserId))
  const targetBlockedViewer = Boolean((target?.blockedUserIds || []).includes(userId))

  return {
    viewerBlockedTarget,
    targetBlockedViewer,
    isBlocked: viewerBlockedTarget || targetBlockedViewer,
  }
}

module.exports = { getBlockState }
