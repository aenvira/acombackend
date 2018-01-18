const config = require('../config')
const Mongoose = require('mongoose')
//const logger = require('../logger')

const { username, password, host, port, name } = config.db
const dbURI = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${name}`

Mongoose.connect(dbURI, { useMongoClient: true })

Mongoose.connection.on('error', function(err) {
  console.log(err)
  if(err) throw err
})

Mongoose.Promise = global.Promise

const models = {
  user: require('./schemas/user.js'),
  channel: require('./schemas/channel.js'),
  message: require('./schemas/message.js')
}

module.exports = {
  Mongoose,
  models
}
