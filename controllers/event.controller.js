const Event = require('../models/event.model');

class EventController {
  addEvent(req, res) {
    const event = new Event(req.body);
    console.log(req.body);
    event
      .save()
      .then(() => res.json({ msg: 'Event created!' }))
      .catch((err) => res.json(err));
  }

  getEvent(req, res) {
    Event.findById(req.body.locationId)
      .then((event) => res.json(event))
      .catch((err) => res.json(err));
  }

  // TODO add pagination eventually
  getEvents(req, res) {
    Event.find({})
      .then((events) => res.json(event))
      .catch((err) => res.json(err));
  }
}

module.exports = new EventController();
