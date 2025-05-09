const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    numFailedTestSuites: {
      type: Number,
      required: true,
    },
    numFailedTests: {
      type: Number,
      required: true,
    },
    numPassedTestSuites: {
      type: Number,
      required: true,
    },
    numPassedTests: {
      type: Number,
      required: true,
    },
    numPendingTestSuites: Number,
    numPendingTests: Number,
    numRuntimeErrorTestSuites: Number,
    numTodoTests: Number,
    numTotalTestSuites: Number,
    numTotalTests: Number,
    startTime: {
      type: Number,
      required: true,
    },
    success: Boolean,
    testResults: {
      type: [
        {
          name: {
            type: String,
            required: true,
          },
          status: {
            type: String,
            required: true,
          },
          assertionResults: {
            type: [
              {
                fullName: {
                  type: String,
                  required: true,
                },
                duration: Number,
                status: {
                  type: String,
                  required: true,
                },
                failureMessages: {
                  type: [String],
                  default: [],
                },
              },
            ],
            required: true,
            validate: [(val) => val.length > 0, 'At least one assertion result is required.'],
          },
        },
      ],
      required: true,
      validate: [(val) => val.length > 0, 'At least one test result is required.'],
    },
    wasInterrupted: Boolean,
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('File', FileSchema);
