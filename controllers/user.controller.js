/* eslint-disable no-underscore-dangle */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { secret } = require('../config/jwt');

class UserController {
  static register(req, res) {
    const userToCreate = { ...req.body };

    const user = new User(userToCreate);
    user
      .save()
      .then(() => {
        res
          .cookie('usertoken', jwt.sign({ _id: user.id }, secret), {
            httpOnly: true,
          })
          .json({ msg: 'Created user successfully', user });
      })
      .catch((err) => {
        // Duplicate email error
        if (err.code === 11000 && err.keyPattern?.email) {
          return res.status(400).json({ error: 'Email already in use' });
        }

        // Validation errors
        if (err.name === 'ValidationError') {
          const errors = Object.values(err.errors).map((e) => e.message);
          return res.status(400).json({ errors });
        }

        // Generic fallback
        console.error(err);
        return res.status(500).json({ error: 'Something went wrong' });
      });
  }

  static login(req, res) {
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (user === null) {
          res.json({ msg: 'Invalid email or password' });
        } else {
          bcrypt
            .compare(req.body.password, user.password)
            .then((passwordIsValid) => {
              if (passwordIsValid) {
                res
                  .cookie('usertoken', jwt.sign({ _id: user.id }, secret), {
                    httpOnly: true,
                  })
                  .json(user);
              } else {
                res.json({ msg: 'Invalid email or password' });
              }
            })
            .catch((err) => res.json({ msg: 'invalid attempt' }, err));
        }
      })
      .catch((err) => res.json(err));
  }

  static getLoggedInUser(req, res) {
    const decoded = jwt.decode(req.cookies.usertoken, { complete: true });
    User.findById(decoded.payload._id)
      .then((user) => res.json(user))
      .catch((err) => res.json(err));
  }

  static logout(req, res) {
    res
      .cookie('usertoken', jwt.sign({ _id: '' }, secret), {
        httpOnly: true,
        maxAge: 0,
      })
      .json({ msg: 'Logged out sucdessfully!' });
  }
}

module.exports = UserController;
