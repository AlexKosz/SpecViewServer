// tests/fileModel.test.js

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const File = require('../file.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('File model schema validation', () => {
  it('should successfully save a valid File document', async () => {
    const file = new File({
      userId: new mongoose.Types.ObjectId(),
      name: 'jest-output.json',
      numFailedTestSuites: 1,
      numFailedTests: 2,
      numPassedTestSuites: 3,
      numPassedTests: 5,
      startTime: Date.now(),
      testResults: [
        {
          name: 'example.test.js',
          status: 'passed',
          assertionResults: [
            {
              fullName: 'adds numbers correctly',
              duration: 15,
              status: 'passed',
              failureMessages: [],
            },
          ],
        },
      ],
    });

    const saved = await file.save();
    expect(saved._id).toBeDefined();
    expect(saved.name).toBe('jest-output.json');
  });

  it('should fail if required fields are missing', async () => {
    const file = new File({});
    let err;

    try {
      await file.validate();
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.numFailedTestSuites).toBeDefined();
    expect(err.errors.numFailedTests).toBeDefined();
    expect(err.errors.numPassedTestSuites).toBeDefined();
    expect(err.errors.numPassedTests).toBeDefined();
    expect(err.errors.startTime).toBeDefined();
    expect(err.errors.testResults).toBeDefined();
  });

  it('should fail if testResults array is empty', async () => {
    const file = new File({
      userId: new mongoose.Types.ObjectId(),
      name: 'invalid.json',
      numFailedTestSuites: 0,
      numFailedTests: 0,
      numPassedTestSuites: 1,
      numPassedTests: 2,
      startTime: Date.now(),
      testResults: [],
    });

    let err;
    try {
      await file.validate();
    } catch (e) {
      err = e;
    }

    expect(err.errors.testResults).toBeDefined();
  });

  it('should fail if assertionResults is empty in a testResult', async () => {
    const file = new File({
      userId: new mongoose.Types.ObjectId(),
      name: 'no-assertions.json',
      numFailedTestSuites: 0,
      numFailedTests: 0,
      numPassedTestSuites: 1,
      numPassedTests: 1,
      startTime: Date.now(),
      testResults: [
        {
          name: 'no-assertions.test.js',
          status: 'passed',
          assertionResults: [],
        },
      ],
    });

    let err;
    try {
      await file.validate();
    } catch (e) {
      err = e;
    }

    expect(err.errors['testResults.0.assertionResults']).toBeDefined();
  });

  it('should fail if an assertionResult is missing fullName or status', async () => {
    const file = new File({
      userId: new mongoose.Types.ObjectId(),
      name: 'missing-fields.json',
      numFailedTestSuites: 0,
      numFailedTests: 0,
      numPassedTestSuites: 1,
      numPassedTests: 1,
      startTime: Date.now(),
      testResults: [
        {
          name: 'test.js',
          status: 'passed',
          assertionResults: [
            {
              duration: 10,
              failureMessages: [],
            },
          ],
        },
      ],
    });

    let err;
    try {
      await file.validate();
    } catch (e) {
      err = e;
    }

    expect(err.errors['testResults.0.assertionResults.0.fullName']).toBeDefined();
    expect(err.errors['testResults.0.assertionResults.0.status']).toBeDefined();
  });
});
