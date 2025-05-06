const jwt = require('jsonwebtoken');

const secret = process.env.SECRET || 'ABC';

module.exports.secret = secret;

module.exports.authen = (req, res, next) => {
  if (!req.cookies.usertoken) {
    return res.status(401).json({ verified: false, message: 'No token provided' });
  }

  // Return the jwt.verify callback
  return jwt.verify(req.cookies.usertoken, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ verified: false, message: 'Invalid token' });
    }

    req.user = decoded;
    return next();
  });
};
