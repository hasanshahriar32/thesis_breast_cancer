const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');

const swaggerDocument = yaml.load(path.join(__dirname, '../../swagger.yml'));

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
