/**
 * Federated Learning Admin Backend - Main Server
 * 
 * Administrative backend for managing the federated learning network:
 * - Hospital registration and management
 * - Model aggregation (FedAvg)
 * - Training round coordination
 * - Network monitoring
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');

// Import routes
const hospitalRoutes = require('./routes/hospitals');
const aggregationRoutes = require('./routes/aggregation');
const networkRoutes = require('./routes/network');
const modelsRoutes = require('./routes/models');
const ipfsRoutes = require('./routes/ipfs');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FL Admin API'
}));

// API Routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/aggregation', aggregationRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/ipfs', ipfsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Federated Learning Admin Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Federated Learning Admin Backend',
    version: '1.0.0',
    description: 'Administrative API for managing federated learning network',
    endpoints: {
      documentation: '/api-docs',
      health: '/health',
      hospitals: '/api/hospitals',
      aggregation: '/api/aggregation',
      network: '/api/network',
      models: '/api/models',
      ipfs: '/api/ipfs'
    },
    contract: process.env.CONTRACT_ADDRESS,
    network: 'sepolia'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: ['/api/hospitals', '/api/aggregation', '/api/network', '/api/models', '/api/ipfs']
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Federated Learning Admin Backend started`);
  logger.info(`   Port: ${PORT}`);
  logger.info(`   Contract: ${process.env.CONTRACT_ADDRESS}`);
  logger.info(`   Docs: http://localhost:${PORT}/api-docs`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
});

module.exports = app;
