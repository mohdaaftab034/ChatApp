const nodemailer = require('nodemailer')
const env = require('../config/env')
const logger = require('./logger')

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html })
  } catch (error) {
    logger.warn(`Email send failed: ${error.message}`)
  }
}

module.exports = { sendEmail }
