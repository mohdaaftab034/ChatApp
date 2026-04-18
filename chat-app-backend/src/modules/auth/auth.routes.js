const express = require('express')
const authController = require('./auth.controller')
const { validate } = require('../../middleware/validate')
const {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
} = require('./auth.schema')
const { verifyJwt } = require('./auth.middleware')

const router = express.Router()

router.post('/signup', validate(signupSchema), authController.signup)
router.post('/login', validate(loginSchema), authController.login)
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp)
router.post('/resend-otp', validate(resendOtpSchema), authController.resendOtp)
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword)
router.post('/refresh', validate(refreshSchema), authController.refresh)
router.get('/me', verifyJwt, authController.me)

module.exports = router
