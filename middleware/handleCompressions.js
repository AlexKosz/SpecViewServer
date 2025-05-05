const express = require('express');
const zlib = require('zlib');

const handleCompression = (req, res, next) => {
  const encoding = req.headers['content-encoding'];

  if (encoding === 'gzip') {
    const gunzip = zlib.createGunzip();
    req.pipe(gunzip);

    const buffer = [];
    gunzip.on('data', (chunk) => buffer.push(chunk));
    gunzip.on('end', () => {
      try {
        req.body = JSON.parse(Buffer.concat(buffer).toString());
        next();
      } catch (err) {
        res.status(400).json({ error: 'Invalid gzip JSON body' });
      }
    });
    gunzip.on('error', (err) => {
      console.error('Decompression error:', err);
      res.status(400).json({ error: 'Gzip decompression failed' });
    });
  } else {
    // Default express.json() for uncompressed JSON
    express.json()(req, res, next);
  }
};

// Export middleware function
module.exports = handleCompression;
