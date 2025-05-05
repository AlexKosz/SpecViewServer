const Users = require('../controllers/user.controller');
const { authen } = require('../config/jwt');

module.exports = (app) => {
  app.post('/register', Users.register);
  app.post('/login', Users.login);
  app.get('/users/loggedin', authen, Users.getLoggedInUser);
  app.get('/users/logout', Users.logout);
};
