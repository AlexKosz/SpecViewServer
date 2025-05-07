const mongoose = require('mongoose');
require('dotenv').config();

const dbName = process.env.DB_NAME;
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';

mongoose
  .connect(`${mongoUrl}/${dbName}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Established a connection to the database'))
  .catch((err) => console.log('Something went wrong', err));

// Function to close the database connection
const closeConnection = async () => {
  try {
    await mongoose.disconnect();
    console.log('Database connection closed');
  } catch (err) {
    console.error('Error while closing the database connection', err);
  }
};

module.exports = { closeConnection };
