const jwt = require('jsonwebtoken')
const config = require('../config')
const User = require('../models/user')
const utils = require('../utils')

const loginSuccessHandler = (req, res) => {
  const profile = {
    username: req.user.username,
    id: req.user._id
  }
  const jwtSecret = config.jwtSecret
  const token = jwt.sign(
    profile,
    jwtSecret,
    { expiresIn: "10h" }
  )

  return res.status(200).json({ token: token, user: req.user })
}

const loginFailedHandler = (err, req, res, next) => {
  if(err.status === 400) {
    return res.status(400).json({ error: { message: 'Missing credentials', status: 400 } })
  }

  return res.status(404).json({ error: err })
} 

const registerHandler = (req, res, next) => {
	const credentials = {'username': req.body.username, 'password': req.body.password }

	if(!credentials.username || !credentials.password) {
    return res.status(400).json({ error: { message: 'Missing credentials', status: 400 } })
	} else {

		// Check if the username already exists for non-social account
		User.findOne({'username': new RegExp('^' + req.body.username + '$', 'i'), 'socialId': null}, 
      (err, user) => {
			  if(err) throw err

        if(user) {
          return res.status(403).json({ error: { message: 'User already exists', status: 403 } })
        } else {

          User.create(credentials, (err, newUser) => {
            if(err) throw err

            // Watch out we are bypassing passport for auth here
            const profile = {
              username: newUser.username,
              id: newUser._id
            }
            const token = jwt.sign(
              profile,
              config.jwtSecret,
              { expiresIn: "10h" }
            )

            return res.status(201).json({ token: token, user: newUser })
          })
			  }
		  }
    )
	}
}

const forgotPasswordHandler = (req, res) => {
  if(!req.body.username ) {
    return res.status(400).json({ error: { message: 'Missing username or email!', status: 400 } })
  }

  User.findOne({'username': new RegExp('^' + req.body.username + '$', 'i'), 'socialId': null}, 
    (err, user) => {
      if (err) throw err

      if (!user) {
        return res.status(401).send({ error: { message: 'No account with this username/email found', status: 401  } })
      }
   
      utils.generateResetToken(user, (u, token) => {
        u.resetPasswordToken = token
        u.resetPasswordExpires = Date.now() + config.RESET_TOKEN_EXP_SEC || 360000 // 1 hour

        u.save(err => {
          if (err) throw err
          
          utils.sendEmailNotification({
            to: u.email,
            from: 'passwordreset@demo.com',
            subject: 'Acom Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'https://' + config.APP_ROOT_URL + '/resetPassword/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          })
          res.status(200).send({ message: 'Notification sent.' })
      })
    })
  })
}

const resetPasswordHandler = (req, res) => {
  const verifyUser = {
    resetPasswordToken: req.body.token,
    resetPasswordExpires: { $gt: Date.now() }
  }
  User.findOne(verifyUser, (err, user) => {
    if (err) throw err

    if (!user) {
      return res.status(401).send({ error: { message: 'Password reset token is invalid or has expired'} })
    }

    user.password = req.body.password
    user.resetPasswordToken = null
    user.resetPasswordExpires = null

    user.save(err => {
      if (err) {
        return res.status().send({ error: { message: 'Password update failed' } })
      }
      
      utils.sendEmailNotification({
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
      })

      return res.status(200).send({ message: 'Password changed.' })
    })
  })
}

module.exports = {
  loginSuccessHandler,
  loginFailedHandler,
  registerHandler,
  forgotPasswordHandler,
  resetPasswordHandler
}
