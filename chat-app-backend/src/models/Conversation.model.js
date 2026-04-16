const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema(
	{
		_id: { type: String },
		type: { type: String, enum: ['direct', 'group'], default: 'direct' },
		participantIds: { type: [String], default: [] },
		unreadBy: { type: Map, of: Number, default: {} },
		isPinned: { type: Boolean, default: false },
		isMuted: { type: Boolean, default: false },
		isArchived: { type: Boolean, default: false },
		group: {
			name: { type: String, default: '' },
			avatar: { type: String, default: null },
			description: { type: String, default: '' },
			adminIds: { type: [String], default: [] },
			inviteLink: { type: String, default: '' },
			settings: {
				whoCanSend: { type: String, enum: ['all', 'admins'], default: 'all' },
				whoCanAdd: { type: String, enum: ['all', 'admins'], default: 'all' },
			},
		},
		lastMessage: { type: Object, default: null },
	},
	{ timestamps: true }
)

conversationSchema.index({ participantIds: 1, updatedAt: -1 })

module.exports = mongoose.model('Conversation', conversationSchema)
