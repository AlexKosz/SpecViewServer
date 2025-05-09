/* eslint-disable no-promise-executor-return */
const { PassThrough } = require('stream');
const zlib = require('zlib');
const handleCompression = require('../handleCompressions');

jest.mock('zlib');

describe('handleCompression middleware', () => {
  let req;
  let res;
  let next;
  let gunzip;

  beforeEach(() => {
    req = new PassThrough();
    req.headers = {}; // ✅ Fix: ensure headers is defined

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
    gunzip = new PassThrough(); // Mock gunzip stream
    zlib.createGunzip.mockReturnValue(gunzip);
  });

  it('should parse valid gzip-compressed JSON', async () => {
    req.headers['content-encoding'] = 'gzip';

    handleCompression(req, res, next);

    const json = JSON.stringify({ message: 'hello' });
    gunzip.write(Buffer.from(json));
    gunzip.end();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(req.body).toEqual({ message: 'hello' });
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 for invalid gzip JSON', async () => {
    req.headers['content-encoding'] = 'gzip';

    handleCompression(req, res, next);

    gunzip.write(Buffer.from('not json'));
    gunzip.end();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid gzip JSON body' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if decompression fails', async () => {
    req.headers['content-encoding'] = 'gzip';

    handleCompression(req, res, next);

    gunzip.emit('error', new Error('fail'));

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Gzip decompression failed' });
    expect(next).not.toHaveBeenCalled();
  });
});
