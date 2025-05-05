const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
    },
    phoneNumber: {
      type: Number,
      required: [true, 'Phone number is required'],
    },

    street1: {
      type: String,
      required: [true, 'street1 is required'],
    },
    street2: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: [true, 'city is required'],
    },
    state: {
      type: String,
      required: [true, 'state is required'],
    },
    //string to allow dashes
    zip: {
      type: String,
      required: [true, 'state is required'],
      // TODO
      // validate: {
      //     validator: val => /^([\w-\.]+@([\w-]+\.)+[\w-]+)?$/.test(val),
      //     message: "Please enter a valid email"
      // }
    },
    // Only support United States for now
    // country: {
    //     type: String,
    //     required: [true, "state is required"],
    // },

    parkingInfo: {
      type: String,
      required: false,
    },
    accessible: {
      type: Boolean,
      required: false,
    },
    open: {
      type: Number,
      required: false,
    },
    close: {
      type: Number,
      required: false,
    },
    timeZone: {
      type: String,
      required: false,
    },
    alcohol: {
      type: Boolean,
      required: false,
    },
    smoking: {
      type: Boolean,
      required: false,
    },
    maximumOccupancy: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Location', LocationSchema);
