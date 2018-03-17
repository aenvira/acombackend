const config = require('../config')
const Mongoose = require('mongoose')
// const logger = require('../logger')

const { username, password, host, port, name } = config.db

///const db = mongodb://<dbuser>:<dbpassword>@ds040837.mlab.com:40837/amacom
const dbURI = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${name}`

Mongoose.Promise = global.Promise
Mongoose.connect(dbURI, { useMongoClient: true })
  .then(
    () => console.log('Mongoose Ready'),
    err => console.log('Mongoose connect failed: ', err)
  )

Mongoose.connection.on('error', function(err) {
  if (err) {
    throw err
  }
})

const models = {
  user: require('./schemas/user.js'),
  channel: require('./schemas/channel.js'),
  message: require('./schemas/message.js')
}

module.exports = {
  Mongoose,
  models
}
