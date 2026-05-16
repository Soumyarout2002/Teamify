'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const setup = (app) => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: { title: 'Teamify API', version: '1.0.0', description: 'Project Management API' },
      servers: [{ url: '/api', description: 'API server' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    apis: ['./src/routes/*.js']
  };
  const spec = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
};

module.exports = setup;
