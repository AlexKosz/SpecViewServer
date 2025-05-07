const userRoutes = require('./user.routes');
const fileRoutes = require('./file.routes');

module.exports = (app) => {
  userRoutes(app);
  fileRoutes(app);
};
