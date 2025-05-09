const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');
const UserController = require('../user.controller');
const { secret } = require('../../config/jwt');

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../models/user.model');

describe('UserController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {},
      cookies: {},
    };
    mockRes = {
      cookie: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        save: jest.fn().mockResolvedValue(true),
      };
      User.mockReturnValue(mockUser);
      jwt.sign.mockReturnValue('mocktoken');
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      await UserController.register(mockReq, mockRes);

      expect(User).toHaveBeenCalledWith(mockReq.body);
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith({ _id: '123' }, secret);
      expect(mockRes.cookie).toHaveBeenCalledWith('usertoken', 'mocktoken', {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/',
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Created user successfully',
        user: {
          _id: '123',
          name: 'Test User',
          email: 'test@example.com',
        },
      });
    });

    it('should handle duplicate email error', async () => {
      const mockError = {
        code: 11000,
      };
      const mockUser = {
        save: jest.fn().mockRejectedValue(mockError),
      };
      User.mockReturnValue(mockUser);
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      await UserController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email already in use' });
    });

    it('should handle validation errors', async () => {
      const mockError = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email is required' },
          password: { message: 'Password must be at least 6 characters' },
        },
      };
      const mockUser = {
        save: jest.fn().mockRejectedValue(mockError),
      };
      User.mockReturnValue(mockUser);
      mockReq.body = {
        name: 'Test User',
        email: 'invalid',
        password: 'short',
      };

      await UserController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: expect.arrayContaining([
          'Email is required',
          'Password must be at least 6 characters',
        ]),
      });
    });

    it('should handle generic errors', async () => {
      const mockError = new Error('Something went wrong');
      const mockUser = {
        save: jest.fn().mockRejectedValue(mockError),
      };
      User.mockReturnValue(mockUser);
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      await UserController.register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Something went wrong',
      });
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        toObject: () => ({
          _id: '123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mocktoken');

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await UserController.login(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith({ _id: '123' }, secret);
      expect(mockRes.cookie).toHaveBeenCalledWith('usertoken', 'mocktoken', {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/',
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        _id: '123',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should return 400 for invalid email', async () => {
      User.findOne.mockResolvedValue(null);
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await UserController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Invalid email or password' });
    });

    it('should return 400 for invalid password', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        toObject: () => ({
          _id: '123',
          email: 'test@example.com',
        }),
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await UserController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Invalid email or password' });
    });

    it('should handle bcrypt errors gracefully', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        toObject: () => ({
          _id: '123',
          email: 'test@example.com',
        }),
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockRejectedValue(new Error('bcrypt error'));

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await UserController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Something went wrong during password check',
      });
    });

    it('should handle DB errors gracefully', async () => {
      User.findOne.mockRejectedValue(new Error('DB error'));

      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await UserController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Something went wrong during login',
      });
    });
  });

  describe('getLoggedInUser', () => {
    it('should return the logged in user', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
      };
      const mockDecoded = {
        payload: { _id: '123' },
      };
      jwt.decode.mockReturnValue(mockDecoded);
      User.findById.mockResolvedValue(mockUser);
      mockReq.cookies.usertoken = 'validtoken';

      await UserController.getLoggedInUser(mockReq, mockRes);

      expect(jwt.decode).toHaveBeenCalledWith('validtoken', { complete: true });
      expect(User.findById).toHaveBeenCalledWith('123');
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('should handle errors when finding user', async () => {
      const error = new Error('DB error');
      const mockDecoded = {
        payload: { _id: '123' },
      };
      jwt.decode.mockReturnValue(mockDecoded);
      User.findById.mockRejectedValue(error);
      mockReq.cookies.usertoken = 'validtoken';

      await UserController.getLoggedInUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'DB error' });
    });
  });

  describe('logout', () => {
    it('should clear the usertoken cookie and return success message', () => {
      UserController.logout(mockReq, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith('usertoken', '', {
        httpOnly: true,
        maxAge: 0,
        secure: true,
        sameSite: 'None',
        path: '/',
      });
      expect(mockRes.json).toHaveBeenCalledWith({ msg: 'Logged out successfully!' });
    });
  });
});
