const jwt = require('jsonwebtoken');

const secret = process.env.SECRET || 'ABC';

module.exports.secret = secret;

module.exports.authen = (req, res, next) => {
  jwt.verify(req.cookies.usertoken, secret, (err) => {
    if (err) {
      res.status(401).json({ verified: false });
    } else {
      next();
    }
  });
};
