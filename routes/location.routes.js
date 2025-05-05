const Locations = require('../controllers/location.controller');
const { authen } = require('../config/jwt');

module.exports = (app) => {
  app.post('/locations/read', authen, Locations.getLocations);
  app.post('/location/create', authen, Locations.addLocation);
  app.post('/location/read', authen, Locations.getLocation);
};
