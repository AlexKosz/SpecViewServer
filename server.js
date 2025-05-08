const express = require('express');
const cors = require('cors');
const cookies = require('cookie-parser');
const helmet = require('helmet');
const bodyParser = require('body-parser'); // Import body-parser

require('dotenv').config();
// use dotenv to load environment variables from a .env file into process.env
const port = process.env.PORT || 8000;

const allowedOrigins = process?.env?.ALLOWED_ORIGINS?.split(',');

const app = express();

// Use Helmet for added security
app.use(helmet());

// Allow CORS from the specified UI URL
// and allow credentials to be sent with requests
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
  }),
);

// Middleware to parse JSON requests and URL-encoded data, and cookies
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); // Handle form data
app.use(cookies()); // Parse cookies

// Database configuration
require('./config/mongoose');
const { closeConnection } = require('./config/mongoose');

// Routes
require('./routes/routes')(app);

// Global error handler
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

// Start server
app.listen(port, () => {
  console.log('Listening at Port', port);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await closeConnection(); // Close the database connection
  process.exit();
});
