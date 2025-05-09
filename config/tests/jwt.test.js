const jwt = require('jsonwebtoken');

const secret = process.env.SECRET || 'ABC';

const { authen } = require('../jwt'); // Update with your file path

// Mock the jsonwebtoken module
jest.mock('jsonwebtoken');

describe('Authentication Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock request, response, and next function
    mockRequest = {
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe('secret', () => {
    it('should use default secret if environment variable not set', () => {
      delete process.env.SECRET;
      // Need to re-require the module to get the updated secret
      const freshModule = jest.requireActual('../jwt.js');
      expect(freshModule.secret).toBe('ABC');
    });
  });

  describe('authen middleware', () => {
    it('should return 401 if no token is provided', () => {
      authen(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        verified: false,
        message: 'No token provided',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      mockRequest.cookies.usertoken = 'invalid_token';
      jwt.verify.mockImplementation((token, secretKey, callback) => {
        callback(new Error('Invalid token'), null);
      });

      authen(mockRequest, mockResponse, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith('invalid_token', secret, expect.any(Function));
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        verified: false,
        message: 'Invalid token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next and set req.user if token is valid', () => {
      const decodedToken = { id: 123, username: 'testuser' };
      mockRequest.cookies.usertoken = 'valid_token';
      jwt.verify.mockImplementation((token, secretKey, callback) => {
        callback(null, decodedToken);
      });

      authen(mockRequest, mockResponse, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith('valid_token', secret, expect.any(Function));
      expect(mockRequest.user).toEqual(decodedToken);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle different error types from jwt.verify', () => {
      mockRequest.cookies.usertoken = 'expired_token';
      jwt.verify.mockImplementation((token, secretKey, callback) => {
        callback({ name: 'TokenExpiredError', message: 'Token expired' }, null);
      });

      authen(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        verified: false,
        message: 'Invalid token',
      });
    });
  });
});
