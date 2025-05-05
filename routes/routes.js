const userRoutes = require('./user.routes');
const locationRoutes = require('./location.routes');
const fileRoutes = require('./file.routes');

module.exports = (app) => {
  userRoutes(app);
  locationRoutes(app);
  fileRoutes(app);
};
