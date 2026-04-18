const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    challengeId: { type: String, default: null, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ['reset_password', 'verify_email', 'auth_signup', 'auth_login'], required: true },
    metadata: { type: Object, default: {} },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('OTP', otpSchema)
