const jwt = require('jsonwebtoken')
const channelModel = require('../database').models.channel
const User = require('../models/user')

const create = function(data, cb) {
  const newChannel = new channelModel(data)

  newChannel.save(cb)
}

const find = function(data, cb) {
  channelModel.find(data, cb)
}

const findWithParticipants = function(data, cb) {
  channelModel.find(data)
    .populate({ path: 'participants', select: 'username _id email socialId picture' })
    .exec((err, channels) => {
      if (err) {
        return cb(err)
      }

      return cb(null, channels)
    })
}

const findOne = function(data, cb) {
  channelModel.findOne(data, cb)
}

const findById = function(id, cb) {
  channelModel.findById(id, cb)
}

const findByIdAndUpdate = function(id, data, cb) {
  channelModel.findByIdAndUpdate(id, data, { new: true }, cb)
}

const addUser = function(channel, socket, cb) {
  // const userId = socket.request.session.passport.user

  const decoded = jwt.decode(socket.request._query.token)
  const userId = decoded.id

  const conn = { userId: userId, socketId: socket.id }

  channel.connections.push(conn)
  channel.save(cb)
}

const findParticipants = function(channel, cb) {
  let participants = []

  channel.participants.forEach((participantId, i) => {
    User.getProfile(participantId, (err, user) => {
      if (err) {
        throw err
      }

      participants.push(user)

      if (i + 1 === channel.participants.length) {
        return cb(null, participants)
      }
    })
  })
}

const getUsers = function(channel, socket, cb) {
  let users = []
  let vis = {}
  let count = 0

  const userId = socket.request.session.passport.user

  channel.connections.forEach(function(conn) {
    if (conn.userId === userId) {
      count++
    }

    if (!vis[conn.userId]) {
      users.push(conn.userId)
    }
    vis[conn.userId] = true
  })

  users.forEach(function(userId, i) {
    User.getProfile(userId, function(err, user) {
      if (err) {
        return cb(err)
      }
      users[i] = user
      if (i + 1 === users.length) {
        return cb(null, users, count)
      }
    })
  })
}

const removeUser = function(socket, cb) {
  //const userId = socket.request.session.passport.user

  const decoded = jwt.decode(socket.request._query.token)
  const userId = decoded.id

  Channel.find({}, function(err, channels) {
    if (err) {
      return cb(err)
    }

    channels.every(function(channel) {
      let pass = true
      let count = 0
      let target = 0

      channel.connections.forEach(function(conn, i) {
        if (conn.userId === userId) {
          count++
        }
        if (conn.socketId === socket.id) {
          pass = false
          target = i
        }
      })

      if (!pass) {
        channel.connections.id(channel.connections[target]._id).remove()
        channel.save(function(err) {
          cb(err, channel, userId, count)
        })
      }

      return pass
    })
  })
}

module.exports = {
  create,
  find,
  findWithParticipants,
  findOne,
  findById,
  findByIdAndUpdate,
  addUser,
  getUsers,
  findParticipants,
  removeUser
}
