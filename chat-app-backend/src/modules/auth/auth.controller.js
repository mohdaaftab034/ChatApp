const authService = require('./auth.service')
const { formatResponse } = require('../../utils/formatResponse')

async function signup(req, res, next) {
  try {
    const data = await authService.signup(req.validated.body)
    return res.status(201).json(formatResponse({ message: 'Signup successful', data }))
  } catch (error) {
    return next(error)
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.validated.body)
    return res.status(200).json(formatResponse({ message: 'Login successful', data }))
  } catch (error) {
    return next(error)
  }
}

async function forgotPassword(req, res, next) {
  try {
    const data = await authService.forgotPassword(req.validated.body)
    return res.status(200).json(formatResponse({ message: data.message }))
  } catch (error) {
    return next(error)
  }
}

async function resetPassword(req, res, next) {
  try {
    const data = await authService.resetPassword(req.validated.body)
    return res.status(200).json(formatResponse({ message: data.message }))
  } catch (error) {
    return next(error)
  }
}

async function refresh(req, res, next) {
  try {
    const data = await authService.refreshToken(req.validated.body)
    return res.status(200).json(formatResponse({ message: 'Token refreshed', data }))
  } catch (error) {
    return next(error)
  }
}

async function me(req, res, next) {
  try {
    const data = await authService.me({ userId: req.user.sub })
    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  refresh,
  me,
}
