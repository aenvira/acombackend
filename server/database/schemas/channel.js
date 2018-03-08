const Mongoose = require('mongoose')

const ChannelSchema = new Mongoose.Schema({
  name: { type: String, required: true },
  isPrivate: { type: Boolean },
  participants: [ { type: Mongoose.Schema.Types.ObjectId, ref: 'User' } ],
  connections: { type: [ { userId: String, socketId: String } ] }
})

const channelModel = Mongoose.model('Channel', ChannelSchema)

module.exports = channelModel
