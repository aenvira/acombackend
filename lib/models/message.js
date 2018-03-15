const MessageModel = require('../database').models.message
const jwt = require('jsonwebtoken')
// const User = require('../models/user')
// const Channel = require('../models/channel')

const create = function(data, cb) {
  const newMessage = new MessageModel(data)

  newMessage.save(cb)
}

const find = function(data, cb) {
  messageModel.find(data, cb)
}

const findOne = function(data, cb) {
  messageModel.findOne(data, cb)
}

const findById = function(id, cb) {
  messageModel.findById(id, cb)
}

const findByIdAndUpdate = function(id, data, cb) {
  messageModel.findByIdAndUpdate(id, data, { new: true }, cb)
}

const findByChannel = function(channelId, cb) {
  messageModel.find({ 'channelId': channelId }).sort({ posted: 1 }).exec(cb)
}

const addMessage = function(channelId, socket, message, cb) {
  const decoded = jwt.decode(socket.request._query.token)
  const userId = decoded.id
  const username = decoded.username

  const newMessage = {
    channelId: channelId,
    author: {
      userId: userId,
      username: username
    },
    text: message.text
  }

  create(newMessage, cb)
}

module.exports = {
  create,
  find,
  findOne,
  findById,
  findByIdAndUpdate,
  findByChannel,
  addMessage
}
