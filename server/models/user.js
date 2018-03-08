const UserModel = require('../database').models.user

const create = function(data, cb) {
  const newUser = new UserModel(data)

  newUser.save(cb)
}

const find = function(data, cb) {
  userModel
    .find(data)
    .exec(cb)
}

const findOne = function(data, cb) {
  userModel
    .findOne(data)
    .populate({ path: 'contacts', select: 'username picture email _id socialId' })
    .exec(cb)
}

const findById = function(id, cb) {
  userModel
    .findById(id)
    // .populate({ path: 'contacts', select: 'username picture email _id socialId' })
    .exec(cb)
}

const findOrCreate = function(data, cb) {
  findOne({ 'socialId': data.socialId }, function(err, user) {
    if (err) {
      return cb(err)
    }
    if (user) {
      return cb(null, user)
    }

    const userData = {
      username: data.displayName,
      email: data.email,
      socialId: data.socialId,
      picture: data.photos[0].value || null,
      contacts: []
    }

    create(userData, function(err, newUser) {
      if (err) {
        throw err
      }
      cb(null, newUser)
    })
  })
}

const getProfile = (id, cb) => {
  userModel.findById(id, (err, user) => {
    if (err) {
      throw err
    }
    const profile = {
      username: user.username,
      _id: user._id,
      socialId: user.socialId,
      picture: user.picture,
      email: user.email
    }

    return cb(null, profile)
  })
}

// const isContact = (id, contacts) => contacts.find(x => x == contactId)
const addContact = function(id, contactId, cb) {
  if (id === contactId) {
    return cb({ error: 'You cannot add yourself as contact.' })
  }

  findById(id, (err, user) => {
    if (err) {
      throw err
    }

    if (!user) {
      return cb({ error: 'No user found to add contact' })
    }
   
    
    findById(contactId, (err, contactUser) => {
      if (err) {
        throw err
      }

      if (!contactUser) {
        return cb({ error: 'No user found to add as contact!' })
      }
 
      user.contacts.addToSet(contactUser._id)
      user.save((err, updatedUser) => {
        if (err) {
          throw err
        }

        updatedUser.populate({ path: 'contacts', select: 'username _id email socialId' }, (err, u) => {
          if (err) {
            throw err
          }

          return cb(null, u.contacts)
        })
      })
    })
  })
}

const findContacts_ = function(id, cb) {
  let contacts = []

  findById(id, (err, user) => {
    if (err) {
      throw err
    }
    if (!user) {
      return cb({ error: 'No user found.' })
    }

    if (user.contacts.length > 0) {

      user.contacts.forEach((contactId, i) => {
        getProfile(contactId, (err, contact) => {
          if (err) {
            throw err
          }
          contacts.push(contact)

          if (i + 1 === user.contacts.length) {
            return cb(null, contacts)
          }
        })
      })
    } else {
      return cb(null, [])
    }
  })
}

const findContacts = function(id, cb) {
  userModel.findById(id)
    .populate({ path: 'contacts', select: 'username _id email socialId' })
    .exec((err, user) => {
      if (err) {
        throw err
      }
      return cb(null, user.contacts)
    })
}

const isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    next()
  } else {
    res.redirect('/')
  }
}

module.exports = {
  create,
  find,
  findOne,
  findById,
  findOrCreate,
  getProfile,
  addContact,
  findContacts,
  isAuthenticated
}
