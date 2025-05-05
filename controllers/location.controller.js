const Location = require('../models/location.model');

class LocationController {
  addLocation(req, res) {
    const location = new Location(req.body);
    console.log(req.body);
    location
      .save()
      .then(() => res.json({ msg: 'Location created!' }))
      .catch((err) => res.json(err));
  }

  getLocation(req, res) {
    Location.findById(req.body.locationId)
      .then((location) => res.json(location))
      .catch((err) => res.json(err));
  }

  // TODO add pagination eventually
  getLocations(req, res) {
    Location.find({})
      .then((locations) => res.json(locations))
      .catch((err) => res.json(err));
  }
}

module.exports = new LocationController();
