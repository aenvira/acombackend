const config = require('../config')
const passport = require('passport')
//const logger = require('../logger')

const LocalStrategy = require('passport-local').Strategy

const User = require('../models/user')

const init = function() {
  passport.serializeUser(function(user, done) {
    done(null, user.id)
  })

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user)
    })
  })

  passport.use(new LocalStrategy({ usernameField: 'username', passwordField: 'password' },
    (username, password, done) => {
      User.findOne({ username: new RegExp(username, 'i'), socialId: null },
        (err, user) => {
          if (err) {
            return done(err)
          }

          if (!user) {
            return done({ message: 'Incorrect username or password', status: 404 })
          }

          user.validatePassword(password, (err, isMatch) => {
            if (err) {
              return done(err)
            }

            if (!isMatch) {
              return done({ message: 'Incorrect username or password', status: 404 })
            }

            return done(null, user)
          })
        }
      )
    }
  ))

  return passport
}

module.exports = init()
