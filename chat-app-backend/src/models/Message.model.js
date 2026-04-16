const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
	{
		_id: { type: String },
		conversationId: { type: String, required: true, index: true },
		senderId: { type: String, required: true, index: true },
		type: {
			type: String,
			enum: ['text', 'image', 'video', 'audio', 'file', 'link', 'location', 'contact', 'system'],
			default: 'text',
		},
		text: { type: String, default: '' },
		mediaUrl: { type: String, default: null },
		fileName: { type: String, default: null },
		fileSize: { type: Number, default: null },
		audioDuration: { type: Number, default: null },
		location: {
			lat: { type: Number, default: null },
			lng: { type: Number, default: null },
			label: { type: String, default: '' },
		},
		sharedContact: {
			userId: { type: String, default: null },
			name: { type: String, default: '' },
			username: { type: String, default: '' },
			email: { type: String, default: '' },
			phone: { type: String, default: '' },
			avatar: { type: String, default: null },
		},
		linkPreview: {
			url: { type: String, default: '' },
			title: { type: String, default: '' },
			image: { type: String, default: '' },
		},
		replyTo: {
			messageId: { type: String, default: null },
			text: { type: String, default: '' },
			senderName: { type: String, default: '' },
		},
		encryptedPayload: {
			ciphertext: { type: String, default: null },
			iv: { type: String, default: null },
			encryptedKeys: { type: Map, of: String, default: {} },
			senderKeyId: { type: String, default: null },
		},
		reactions: { type: [Object], default: [] },
		readBy: { type: [String], default: [] },
		deliveredTo: { type: [String], default: [] },
		isEdited: { type: Boolean, default: false },
		isDeleted: { type: Boolean, default: false },
		isPinned: { type: Boolean, default: false },
		isStarred: { type: Boolean, default: false },
	},
	{ timestamps: true }
)

messageSchema.index({ conversationId: 1, createdAt: -1 })

module.exports = mongoose.model('Message', messageSchema)
