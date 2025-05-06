const Files = require('../controllers/file.controller');
const { authen } = require('../config/jwt');

module.exports = (app) => {
  app.post('/files/upload', authen, Files.upload);
  app.get('/files/getUserFiles', authen, Files.getUserFiles);
  app.get('/files/:id', Files.readById);
  app.delete('/files/:id', authen, Files.delete);
};
