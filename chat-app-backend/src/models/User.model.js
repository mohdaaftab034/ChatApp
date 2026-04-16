const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: null },
    headline: { type: String, default: 'Chat app member' },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'busy', 'invisible'],
      default: 'offline',
    },
    lastSeen: { type: Date, default: null },
    bio: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    department: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    social: {
      website: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      x: { type: String, default: '' },
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    e2ee: {
      activeKeyId: { type: String, default: null },
      publicKey: { type: String, default: null },
      keyHistory: {
        type: [
          {
            keyId: { type: String, required: true },
            publicKey: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
          },
        ],
        default: [],
      },
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
