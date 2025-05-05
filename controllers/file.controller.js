/* eslint-disable no-underscore-dangle */
const jwt = require('jsonwebtoken');
const File = require('../models/file.model');
const User = require('../models/user.model');

class FileController {
  static async upload(req, res) {
    try {
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
      };

      delete fileToSave.snapshot;

      const decodedJWT = jwt.decode(req.cookies.usertoken, { complete: true });
      const user = await User.findById(decodedJWT.payload._id);

      if (!user) {
        return res.status(401).json({ msg: 'User not logged in' });
      }

      const file = new File(fileToSave);
      await file.save();

      return res.json({ msg: 'Saved file successfully', file });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async readById(req, res) {
    try {
      const { id } = req.body;

      const file = await File.findOne({ _id: id });

      if (!file) {
        return res.status(404).json({ msg: 'File not found' });
      }

      return res.json(file);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = FileController;
