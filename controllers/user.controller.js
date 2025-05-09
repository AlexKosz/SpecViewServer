/* eslint-disable no-underscore-dangle */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { secret } = require('../config/jwt');

class UserController {
  static async register(req, res) {
    try {
      const userToCreate = { ...req.body };
      const user = new User(userToCreate);
      await user.save();

      const token = jwt.sign({ _id: user._id }, secret);

      res
        .cookie('usertoken', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          path: '/',
        })
        .json({
          msg: 'Created user successfully',
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
        });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ errors });
      }

      return res.status(500).json({ error: 'Something went wrong' });
    }

    return res.status(500).json({ error: 'Something went wrong' });
  }

  static async login(req, res) {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid email or password' });
      }

      const passwordIsValid = await bcrypt.compare(req.body.password, user.password);
      if (!passwordIsValid) {
        return res.status(400).json({ msg: 'Invalid email or password' });
      }

      const token = jwt.sign({ _id: user._id }, secret);
      const { password, ...userWithoutPassword } = user.toObject();

      return res
        .cookie('usertoken', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          path: '/',
        })
        .json(userWithoutPassword);
    } catch (err) {
      const msg = err.message.includes('bcrypt')
        ? 'Something went wrong during password check'
        : 'Something went wrong during login';
      return res.status(500).json({ msg });
    }
  }

  static async getLoggedInUser(req, res) {
    try {
      const token = req.cookies.usertoken;
      const decoded = jwt.decode(token, { complete: true });
      const user = await User.findById(decoded.payload._id);
      return res.json(user);
    } catch (err) {
      return res.status(400).json({ error: err.message }); // Make sure the status is sent here
    }
  }

  static logout(req, res) {
    res
      .cookie('usertoken', '', {
        httpOnly: true,
        maxAge: 0, // Deletes the cookie
        secure: true, // Ensure it's over HTTPS
        sameSite: 'None', // Allows cross-origin requests
        path: '/',
      })
      .json({ msg: 'Logged out successfully!' });
  }
}

module.exports = UserController;
