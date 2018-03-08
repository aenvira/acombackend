const Mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')

const SALT_WORK_FACTOR = 10
const DEFAULT_USER_PICTURE = '/img/user.jpg'

const UserSchema = new Mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, default: null },
  password: { type: String, default: null },
  socialId: { type: String, default: null },
  picture: { type: String, default: DEFAULT_USER_PICTURE },
  contacts: [ { type: Mongoose.Schema.Types.ObjectId, ref: 'User' } ],
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
})

UserSchema.pre('save', function(next) {
  let user = this

  if (!user.picture) {
    user.picture = DEFAULT_USER_PICTURE
  }

  if (!user.isModified('password')) {
    return next()
  }

  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) {
      return next(err)
    }

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) {
        return next(err)
      }

      user.password = hash
      next()
    })
  })
})

UserSchema.methods.validatePassword = function(password, cb) {

  bcrypt.compare(password, this.password, function(err, isMatch) {
    if (err) {
      return cb(err)
    }
    cb(null, isMatch)
  })
}

const userModel = Mongoose.model('User', UserSchema)

module.exports = userModel
