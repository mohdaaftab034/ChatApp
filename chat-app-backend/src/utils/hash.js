const bcrypt = require('bcryptjs')

async function hashPassword(value) {
  return bcrypt.hash(value, 10)
}

async function comparePassword(value, hashed) {
  return bcrypt.compare(value, hashed)
}

module.exports = { hashPassword, comparePassword }
