const express	 	= require('express');
const router 		= express.Router();
const passport 	= require('passport');
const jwt = require('jsonwebtoken')
const User = require('../models/user');
const Channel = require('../models/channel');
const config = require('../config')
const utils = require('../utils')
const auth = require('./auth')

// Login
// router.post('/login', passport.authenticate('local', {
// 	successRedirect: '/rooms',
// 	failureRedirect: '/',
// 	failureFlash: true
// }));
//

router.get('/isOnline', (req, res, next) => {
  return res.status(200).json({ ok: true })
})

router.get('/profile', (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(404).json({ error: { message: 'Unauthorized!', status: 404 } })
  }

  jwt.verify(utils.getToken(req), config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: { message: 'Authorization failed!', status: 403 } })
    }
    User.getProfile(decoded.id, (err, profile) => {
      if (err) {
        throw err
      }
      return res.status(200).json({ profile: profile })
    })
  })
})

// authenticate
router.post(
  '/login',
  passport.authenticate('local', { failWithError: true }),
  auth.loginSuccessHandler,
  auth.loginFailedHandler
)

// register
router.post('/users', auth.registerHandler)

// forgot password
router.post('/forgotPassword', auth.forgotPasswordHandler)

// reset password
router.post('/resetPassword', auth.resetPasswordHandler)


router.post('/contacts', (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: { message: 'Unauthorized!', status: 401 } })
  }

  jwt.verify(utils.getToken(req), config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: { message: 'Authorization failed!', status: 403 } })
    }

    User.addContact(decoded.id, req.body.contactId, (err, contacts) => {
      if (err) {
        return res.status(404).json(err)
      }
      return res.status(200).json({ contacts: contacts })
    })
  })
})

router.get('/contacts', (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: { message: 'Unauthorized!', status: 401 } })
  }

  jwt.verify(utils.getToken(req), config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: { message: 'Authorization failed!', status: 403 } })
    }
    
    User.findContacts(decoded.id, (err, contacts) => {
      if (err) {
        return res.status(404).json(err)
      }
      return res.status(200).json({ contacts: contacts })
    })
  })
})

router.get('/users', (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: { message: 'Unauthorized!', status: 401 } })
  }

  jwt.verify(utils.getToken(req), config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: { message: 'Authorization failed!', status: 403 } })
    }

    User.find({}, (err, users) => {
      if (err) {
        return res.status(404).json({ error: err })
      }
      return res.status(200).json({ users: users })
    })
  })

})

module.exports = router
