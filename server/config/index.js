const config = function() {
  if (process.env.NODE_ENV === 'production') {
    const redisURI = require('url').parse(process.env.REDIS_URL)
    const redisPassword = redisURI.auth.split(':')[1]

    return {
      APP_ROOT_URL: 'http://localhost:3000',
      RESET_TOKEN_EXP_SEC: 360000,
      db: {
        username: process.env.dbUsername,
        password: process.env.dbPassoword,
        host: process.env.dbHost,
        port: process.env.dbPort,
        name: process.env.dbName
      },
      sessionSecret: process.env.sessionSecret,
      jwtSecret: process.env.jwtSecret,
      redis: {
        host: redisURI.hostname,
        port: redisURI.port,
        password: redisPassword
      }
    }
  }

  return require('./config.json')
}

module.exports = config()
