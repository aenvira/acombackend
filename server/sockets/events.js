const Channel = require('../models/channel')
const Message = require('../models/message')
const config = require('../config')
const utils = require('../utils')
const jwt = require('jsonwebtoken')

const ioEvents = function(io) {
  //namespaces
  const channelsNamespace = io.of('/channels')
  const chatNamespace = io.of('/chat')

  //channels events
  channelsNamespace
    .on('connection', socket => {
      const decoded = jwt.verify(utils.getToken(socket.request), config.jwtSecret)

      Channel.findWithParticipants({ participants: { $in: [decoded.id]} }, 
        (err, channels) => {
          if(err) throw err

          socket.emit('initialChannelsList', { channels: channels })
      })

      socket.on('createChannel', data => {
        console.log('create channel', data)

        const decoded = jwt.verify(utils.getToken(socket.request), config.jwtSecret)
        if(!decoded) return socket.emit('updateChannelsList', { error: { message: 'Unauthorized!' } })
        
        console.log('create channel engaged')
        Channel.findOne({ name: new RegExp('^' + data.name + '$', 'i') },
          (err, channel) => {
            if(err) throw err      
            channel
                ? socket.emit('updateChannelsList', { error: { message: 'Channel already exists.' } })
                : Channel.create({ name: data.name, participants: [decoded.id].concat(data.participants) },
                    (err, newChannel) => {
                      if(err) throw err     
                      newChannel.populate({
                          path: 'participants',
                          select: 'username _id picture email socialId'
                        }, 
                        (err, populatedChannel) => {
                          if(err) throw err
                          socket.emit('updateChannelsList', { channel: populatedChannel })
                          socket.broadcast.emit('updateChannelsList', { channel: newChannel })
                        }   
                      )
                    }
                )
          }
        )
    })


    socket.on('createPrivateChannel', data => {
      console.log('create private channel', data)
        const decoded = jwt.verify(utils.getToken(socket.request), config.jwtSecret)
        if(!decoded) return socket.emit('updateChannelsList', { error: { message: 'Unauthorized!' } })

        const { inviter, invitee } = data

        Channel.find({ isPrivate: true, participants: { $all: [inviter, invitee] }}, 
          (err, channel) => {
            if(err) throw err

            channel.length > 0
              ? socket.emit('updateChannelsList', { error: { message: 'Private channel already exists.'  } })
              : Channel.create({ name: 'Private', isPrivate: true, participants: [ inviter, invitee ]},
                  (err, newChannel) => {
                    if(err) throw err
                  
                    newChannel.populate({ 
                      path: 'participants', 
                      select: 'username _id picture email socialId' 
                    }, 
                    (err, populatedChannel) => { 
                      if(err) throw err
                      socket.emit('updateChannelsList', { channel: populatedChannel }) 
                    })
                  //TODO check if this appears to the other person channels list
                  }
                )
          }
        )
      })
    })

  // chat events
  chatNamespace
    //.use(authorizeSocketConnection)
    .on('connection', socket => {
      //console.log('NEW CLIENT CONNECTED')
      socket.on('join', channelId => {

        //console.log('received channel', channelId)
        Channel.findById(channelId, (err, channel) => {
          if(err) throw err

          if(!channel) {
            socket.emit('updateUsersList', { error: 'Channel does not exists' })
          } else {
            //TODO handle authentication
            if(!socket.request._query.token) { return }

            
            Channel.addUser(channel, socket, (err, newChannel) => {
              socket.join(newChannel.id)

              Message.findByChannel(newChannel.id, (err, messages) => {
                if(err) throw err

                socket.emit('loadInitialMessages', { messages: messages })     
              })

              // Channel.getUsers(newChannel, socket, (err, users, countUsersInChannel) => {
              //   if(err) throw err
              //   socket.emit('updateUsersList', users, true)
              //
              //   if(countUsersInChannel === 1) {
              //     socket.broadcast.to(newChannel.id).emit('updateUsersList', users[users.length - 1])
              //   }
              // })

            })
          }
        })
      })

      socket.on('leave', channelId => {
        socket.leave(channelId)
      })

      socket.on('disconnect', () => {
        if(socket.request.session.passport == null) {
          return
        }

        Channel.removeUser(socket, (err, channel, userId, countUserInRoom) => {
          if(err) throw err
          socket.leave(channel.id)

          if(countUserInRoom === 1) {
            socket.broadcast.to(channel.id).emit('removeUser', { userId: userId })
          }
        })
      })

      socket.on('newMessage', (channelId, msg, cb) => {

        Message.addMessage(channelId, socket, msg, (err, newMessage) => {
          if(err) cb({ error: err })

          chatNamespace
            .in(channelId)
            .emit('addMessage', { message: newMessage })

          channelsNamespace
            .emit('newMessageInChannel', { channelId: channelId, message: newMessage })

          cb({ sent: true, message: newMessage })
        })

      })
    })
}

module.exports = ioEvents
