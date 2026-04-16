const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({}, { strict: false, timestamps: true })

module.exports = mongoose.model('Group', groupSchema)
