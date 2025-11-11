const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

const logger = require('./utils/logger');
const hospitalRoutes = require('./routes/hospital');
const patientRoutes = require('./routes/patients');
const modelsRoutes = require('./routes/models');
const blockchainRoutes = require('./routes/blockchain');
const ipfsRoutes = require('./routes/ipfs');
const featuresRoutes = require('./routes/features');
const setupSwagger = require('./config/swagger');
const patientService = require('./services/patient');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Setup Swagger documentation
setupSwagger(app);

// API Routes
app.use('/api/hospital', hospitalRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/features', featuresRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hospital_id: process.env.HOSPITAL_ID,
    version: require('../package.json').version
  });
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Hospital Federated Learning Backend',
    version: require('../package.json').version,
    hospital: {
      id: process.env.HOSPITAL_ID,
      name: process.env.HOSPITAL_NAME,
      region: process.env.HOSPITAL_REGION
    },
    endpoints: {
      health: '/health',
      hospital: '/api/hospital/*',
      patients: '/api/patients/*',
      models: '/api/models/*',
      blockchain: '/api/blockchain/*',
      ipfs: '/api/ipfs/*',
      features: '/api/features/*'
    },
    documentation: '/api/docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404,
      path: req.originalUrl
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server and initialize database connection
async function startServer() {
  try {
    // Connect to MongoDB at startup
    logger.info('Initializing database connection...');
    await patientService.connect();
    logger.info('✓ Database connected successfully');
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🏥 Hospital Federated Learning Backend started on port ${PORT}`);
      logger.info(`🌐 Hospital ID: ${process.env.HOSPITAL_ID}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;