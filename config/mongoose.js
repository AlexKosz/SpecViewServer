const mongoose = require('mongoose');
require('dotenv').config();

const db_name = process.env.DB_NAME;
console.log(db_name);

mongoose
  .connect(`mongodb://localhost/${db_name}`, {
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
