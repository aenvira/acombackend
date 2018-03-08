const nodemailer = require('nodemailer')
const config = require('../config')
const crypto = require('crypto')

const sendEmailNotification = options => {
  let transporter = nodemailer.createTransport(config.smtp)
  // let transporter = nodemailer.createTransport('direct:?name=hostname')

  const mailOptions = Object.assign({}, options)

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      return console.error(err)
    }
    return console.info('Message sent: ', info.response)
  })
}

const getToken = req => {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1]
  } else if (req.query && req.query.token) {
    return req.query.token
  } else if (req._query && req._query.token) {
    return req._query.token
  }

  return null
}

const generateResetToken = (user, cb) => {
  crypto.randomBytes(20, (err, buf) => {
    if (err) {
      throw err
    }
    const token = buf.toString('hex')

    cb(user, token)
  })
}

module.exports = {
  getToken,
  sendEmailNotification,
  generateResetToken
}
