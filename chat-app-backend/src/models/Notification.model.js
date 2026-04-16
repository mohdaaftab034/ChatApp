const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({}, { strict: false, timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema)
