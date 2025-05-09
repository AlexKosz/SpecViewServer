const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const User = require('../user.model');

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

afterEach(async () => {
  await User.deleteMany(); // Clear users between tests
});

describe('User Model', () => {
  it('should create a user with valid fields and hash the password', async () => {
    const user = new User({
      fullName: 'Alice Example',
      email: 'alice@example.com',
      password: 'strongPass1',
    });
    user.confirmPassword = 'strongPass1';

    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.fullName).toBe('Alice Example');
    expect(savedUser.email).toBe('alice@example.com');
    expect(savedUser.password).not.toBe('strongPass1'); // Password should be hashed

    const isMatch = await bcrypt.compare('strongPass1', savedUser.password);
    expect(isMatch).toBe(true);
  });

  it('should require fullName, email, and password', async () => {
    const user = new User({});
    user.confirmPassword = '';

    let error;
    try {
      await user.validate();
    } catch (err) {
      error = err;
    }

    expect(error.errors.fullName).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  it('should reject invalid email format', async () => {
    const user = new User({
      fullName: 'Bob',
      email: 'invalid-email',
      password: 'strongPass1',
    });
    user.confirmPassword = 'strongPass1';

    let error;
    try {
      await user.validate();
    } catch (err) {
      error = err;
    }

    expect(error.errors.email).toBeDefined();
    expect(error.errors.email.message).toMatch(/valid email/);
  });

  it('should enforce password length >= 8', async () => {
    const user = new User({
      fullName: 'Carol',
      email: 'carol@example.com',
      password: 'short',
    });
    user.confirmPassword = 'short';

    let error;
    try {
      await user.validate();
    } catch (err) {
      error = err;
    }

    expect(error.errors.password).toBeDefined();
    expect(error.errors.password.message).toMatch(/8 characters/);
  });

  it('should require password and confirmPassword to match', async () => {
    const user = new User({
      fullName: 'Dave',
      email: 'dave@example.com',
      password: 'somePassword',
    });
    user.confirmPassword = 'differentPassword';

    let error;
    try {
      await user.validate();
    } catch (err) {
      error = err;
    }

    expect(error.errors.confirmPassword).toBeDefined();
    expect(error.errors.confirmPassword.message).toBe('Password must match confirm password');
  });

  it('should not allow duplicate emails', async () => {
    const user1 = new User({
      fullName: 'Eve',
      email: 'eve@example.com',
      password: 'somePassword1',
    });
    user1.confirmPassword = 'somePassword1';
    await user1.save();

    const user2 = new User({
      fullName: 'Eve Clone',
      email: 'eve@example.com',
      password: 'somePassword2',
    });
    user2.confirmPassword = 'somePassword2';

    await expect(user2.save()).rejects.toThrow(/duplicate key/);
  });
});
