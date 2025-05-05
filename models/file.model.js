const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    numFailedTestSuites: Number,
    numFailedTests: Number,
    numPassedTestSuites: Number,
    numPassedTests: Number,
    numPendingTestSuites: Number,
    numPendingTests: Number,
    numRuntimeErrorTestSuites: Number,
    numTodoTests: Number,
    numTotalTestSuites: Number,
    numTotalTests: Number,
    startTime: Number,
    success: Boolean,
    testResults: [
      {
        assertionResults: [
          {
            fullName: String,
            duration: Number,
            status: String,
            failureMessages: [String],
          },
        ],
        name: String,
        status: String,
      },
    ],
    wasInterrupted: Boolean,
    name: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model('File', FileSchema);
