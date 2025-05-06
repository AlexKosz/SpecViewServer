const Files = require('../controllers/file.controller');
const { authen } = require('../config/jwt');

module.exports = (app) => {
  app.post('/files/upload', authen, Files.upload);
  app.post('/files/readById', Files.readById);
  app.get('/files/getUserFiles', authen, Files.getUserFiles);
};
