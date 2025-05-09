const httpMocks = require('node-mocks-http');
const jwt = require('jsonwebtoken');
const File = require('../../models/file.model');
const User = require('../../models/user.model');
const FileController = require('../file.controller');

// Mock the models
jest.mock('../../models/file.model');
jest.mock('../../models/user.model');
jest.mock('jsonwebtoken');

describe('FileController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should upload a file successfully', async () => {
      const reqBody = {
        testResults: [
          {
            name: 'test1',
            status: 'passed',
            assertionResults: [
              {
                fullName: 'test1 should work',
                status: 'passed',
              },
            ],
          },
        ],
        snapshot: 'should be deleted',
      };

      const req = httpMocks.createRequest({
        cookies: { usertoken: 'valid.token' },
        body: JSON.parse(JSON.stringify(reqBody)),
      });
      const res = httpMocks.createResponse();

      const mockUser = { _id: 'user123' };
      const mockFile = {
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ _id: 'file123' }),
      };

      jwt.decode.mockReturnValue({ payload: { _id: 'user123' } });
      User.findById.mockResolvedValue(mockUser);
      File.mockImplementation(() => mockFile);

      await FileController.upload(req, res);

      expect(jwt.decode).toHaveBeenCalledWith('valid.token', { complete: true });
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(File).toHaveBeenCalledWith(
        expect.not.objectContaining({
          snapshot: expect.anything(),
        }),
      );
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData())).toMatchObject({
        msg: expect.any(String),
        file: expect.any(Object),
      });
    });

    it('should return 401 if user not logged in', async () => {
      const req = httpMocks.createRequest({
        cookies: {}, // No token at all
        body: {}, // Add empty body to prevent potential undefined errors
      });
      const res = httpMocks.createResponse();

      // No need to mock jwt.decode since we're testing the no-token case
      // No need to mock User.findById since the controller should return before that

      await FileController.upload(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ msg: 'User not logged in' });
    });

    it('should handle errors', async () => {
      const req = httpMocks.createRequest({
        cookies: { usertoken: 'valid.token' },
        body: { testResults: [] },
      });
      const res = httpMocks.createResponse();

      jwt.decode.mockReturnValue({ payload: { _id: 'user123' } });
      User.findById.mockRejectedValue(new Error('Database error'));

      await FileController.upload(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Database error' });
    });
  });

  describe('readById', () => {
    it('should return a file by id', async () => {
      const req = httpMocks.createRequest({
        params: { id: 'file123' },
      });
      const res = httpMocks.createResponse();

      const mockFile = { _id: 'file123', name: 'test file' };
      File.findOne.mockResolvedValue(mockFile);

      await FileController.readById(req, res);

      expect(File.findOne).toHaveBeenCalledWith({ _id: 'file123' });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockFile);
    });

    it('should return 404 if file not found', async () => {
      const req = httpMocks.createRequest({
        params: { id: 'nonexistent' },
      });
      const res = httpMocks.createResponse();

      File.findOne.mockResolvedValue(null);

      await FileController.readById(req, res);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({ msg: 'File not found' });
    });

    it('should handle errors', async () => {
      const req = httpMocks.createRequest({
        params: { id: 'file123' },
      });
      const res = httpMocks.createResponse();

      File.findOne.mockRejectedValue(new Error('Database error'));

      await FileController.readById(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Database error' });
    });
  });

  describe('getUserFiles', () => {
    it('should return all files for a user', async () => {
      const req = httpMocks.createRequest({
        cookies: { usertoken: 'valid.token' },
      });
      const res = httpMocks.createResponse();

      const mockUser = { _id: 'user123' };
      const mockFiles = [
        { _id: 'file1', name: 'test1' },
        { _id: 'file2', name: 'test2' },
      ];

      jwt.decode.mockReturnValue({ payload: { _id: 'user123' } });
      User.findById.mockResolvedValue(mockUser);
      File.find.mockImplementation(() => ({
        sort: jest.fn().mockResolvedValue(mockFiles),
      }));

      await FileController.getUserFiles(req, res);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ files: mockFiles });
    });

    it('should return 401 if user not logged in', async () => {
      const req = httpMocks.createRequest({
        cookies: { usertoken: 'invalid.token' },
      });
      const res = httpMocks.createResponse();

      jwt.decode.mockReturnValue({ payload: { _id: 'user123' } });
      User.findById.mockResolvedValue(null);

      await FileController.getUserFiles(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ msg: 'User not logged in' });
    });

    it('should handle errors', async () => {
      const req = httpMocks.createRequest({
        cookies: { usertoken: 'valid.token' },
      });
      const res = httpMocks.createResponse();

      jwt.decode.mockReturnValue({ payload: { _id: 'user123' } });
      User.findById.mockRejectedValue(new Error('Database error'));

      await FileController.getUserFiles(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Database error' });
    });
  });

  describe('delete', () => {
    it('should delete a file successfully', async () => {
      const req = httpMocks.createRequest({
        cookies: { usertoken: 'valid.token' },
        params: { id: 'file123' },
      });
      const res = httpMocks.createResponse();

      const mockUser = { _id: 'user123' };
      const mockFile = {
        _id: 'file123',
        userId: 'user123',
        toString: jest.fn().mockReturnValue('user123'),
      };

      jwt.decode.mockReturnValue({ payload: { _id: 'user123' } });
      User.findById.mockResolvedValue(mockUser);
      File.findById.mockResolvedValue(mockFile);
      File.findByIdAndDelete.mockResolvedValue(true);

      await FileController.delete(req, res);

      expect(jwt.decode).toHaveBeenCalledWith('valid.token', { complete: true });
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(File.findById).toHaveBeenCalledWith('file123');
      expect(File.findByIdAndDelete).toHaveBeenCalledWith('file123');
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ msg: 'File deleted successfully' });
    });

    it('should return 401 if user not logged in', async () => {
      const req = httpMocks.createRequest({
        cookies: { usertoken: 'invalid.token' },
        params: { id: 'file123' },
      });
      const res = httpMocks.createResponse();

      jwt.decode.mockReturnValue({ payload: { _id: 'user123' } });
      User.findById.mockResolvedValue(null);

      await FileController.delete(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ msg: 'User not logged in' });
    });

    it('should return 404 if file not found', async () => {
      const req = httpMocks.createRequest({
        cookies: { usertoken: 'valid.token' },
        params: { id: 'nonexistent' },
      });
      const res = httpMocks.createResponse();

      const mockUser = { _id: 'user123' };

      jwt.decode.mockReturnValue({ payload: { _id: 'user123' } });
      User.findById.mockResolvedValue(mockUser);
      File.findById.mockResolvedValue(null);

      await FileController.delete(req, res);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({ msg: 'File not found' });
    });

    it('should return 403 if user is not the owner', async () => {
      const req = httpMocks.createRequest({
        cookies: { usertoken: 'valid.token' },
        params: { id: 'file123' },
      });
      const res = httpMocks.createResponse();

      const mockUser = { _id: 'user456' }; // Different user
      const mockFile = {
        _id: 'file123',
        userId: 'user123',
        toString: jest.fn().mockReturnValue('user123'),
      };

      jwt.decode.mockReturnValue({ payload: { _id: 'user456' } });
      User.findById.mockResolvedValue(mockUser);
      File.findById.mockResolvedValue(mockFile);

      await FileController.delete(req, res);

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({ msg: 'Unauthorized to delete this file' });
    });

    it('should handle errors', async () => {
      const req = httpMocks.createRequest({
        cookies: { usertoken: 'valid.token' },
        params: { id: 'file123' },
      });
      const res = httpMocks.createResponse();

      jwt.decode.mockReturnValue({ payload: { _id: 'user123' } });
      User.findById.mockRejectedValue(new Error('Database error'));

      await FileController.delete(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Database error' });
    });
  });
});
