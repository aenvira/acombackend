const redis = require('redis').createClient
const adapter = require('socket.io-redis')
const jwt = require('jsonwebtoken')
const config = require('../config')
const ioEvents = require('./events.js')

const init = function init(app) {
  const server = require('http').Server(app)
  const io = require('socket.io')(server)

  // Leave that for now to use defaults
  //io.set('transports', ['websocket'])

  const port = config.redis.port
  const host = config.redis.host
  const pass = config.redis.password
  const pubClient = redis(port, host, { auth_pass: pass })
  const subClient = redis(port, host, { auth_pass: pass, return_buffers: true })

  pubClient.on('connect', () => console.log('Connected to Redis'))
  io.adapter(adapter({ pubClient, subClient }))


  io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token){
      jwt.verify(socket.handshake.query.token, config.jwtSecret, (err, decoded) => {
        if(err) return next(new Error('Authentication error'))

        socket.decoded = decoded
        next()
      })
    }
    next(new Error('Authentication error'));
  })
  io.use((socket, next) => {
    require('../session')(socket.request, {}, next)
  })

  ioEvents(io)

  return server
}

module.exports = init
