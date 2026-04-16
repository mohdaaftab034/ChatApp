const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({}, { strict: false, timestamps: true })

module.exports = mongoose.model('Contact', contactSchema)
