const Mongoose = require('mongoose')

const MessageSchema = new Mongoose.Schema({
  channelId: { type: String, required: true },
  author: { userId: String, username: String },
  posted: { type: Date, default: Date.now },
  text: String
})

const messageModel = Mongoose.model('Message', MessageSchema)

module.exports = messageModel
