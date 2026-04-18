const nodemailer = require('nodemailer')
const env = require('../config/env')
const logger = require('./logger')

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: Number(env.SMTP_PORT) === 465,
  requireTLS: Number(env.SMTP_PORT) !== 465,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  tls: {
    minVersion: 'TLSv1.2',
  },
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
    throw error
  }
}

module.exports = { sendEmail }
