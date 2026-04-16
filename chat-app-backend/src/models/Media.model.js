const mongoose = require('mongoose')

const mediaSchema = new mongoose.Schema({}, { strict: false, timestamps: true })

module.exports = mongoose.model('Media', mediaSchema)
