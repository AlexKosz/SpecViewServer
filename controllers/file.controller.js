/* eslint-disable no-underscore-dangle */
const jwt = require('jsonwebtoken');
const File = require('../models/file.model');
const User = require('../models/user.model');

class FileController {
  static async upload(req, res) {
    try {
      // 1. Check if token exists
      if (!req?.cookies?.usertoken) {
        return res.status(401).json({ msg: 'User not logged in' });
      }

      // 2. Decode and verify token
      const decodedJWT = jwt.decode(req.cookies.usertoken, { complete: true });
      if (!decodedJWT?.payload?._id) {
        return res.status(401).json({ msg: 'Invalid authentication token' });
      }

      // 3. Find user
      const user = await User.findById(decodedJWT.payload._id);
      if (!user) {
        return res.status(401).json({ msg: 'User not found' });
      }

      const fileToSave = {
        ...req.body,
        testResults: req?.body?.testResults.map((result) => ({
          name: result.name,
          status: result.status,
          assertionResults: result.assertionResults.map((assertion) => ({
            fullName: assertion.fullName,
            status: assertion.status,
          })),
        })),
        userId: user._id,
      };

      delete fileToSave.snapshot;

      const file = new File(fileToSave);
      await file.save();

      return res.json({ msg: 'Saved file successfully', file });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async readById(req, res) {
    try {
      const { id } = req.params; // Retrieve ID from URL parameters

      const file = await File.findOne({ _id: id });

      if (!file) {
        return res.status(404).json({ msg: 'File not found' });
      }

      return res.json(file);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getUserFiles(req, res) {
    try {
      if (!req?.cookies?.usertoken) {
        return res.status(401).json({ msg: 'User not logged in' });
      }

      const decodedJWT = jwt.decode(req.cookies.usertoken, { complete: true });
      const user = await User.findById(decodedJWT.payload._id);

      if (!user) {
        return res.status(401).json({ msg: 'User not logged in' });
      }

      const files = await File.find({ userId: user._id }).sort({ createdAt: -1 });

      return res.json({ files });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      const decodedJWT = jwt.decode(req.cookies.usertoken, { complete: true });
      const user = await User.findById(decodedJWT.payload._id);

      if (!user) {
        return res.status(401).json({ msg: 'User not logged in' });
      }

      const file = await File.findById(id);

      if (!file) {
        return res.status(404).json({ msg: 'File not found' });
      }

      if (file.userId.toString() !== user._id.toString()) {
        return res.status(403).json({ msg: 'Unauthorized to delete this file' });
      }

      await File.findByIdAndDelete(id);

      return res.json({ msg: 'File deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = FileController;
