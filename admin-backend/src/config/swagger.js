const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Federated Learning Admin API',
      version: '1.0.0',
      description: `
## Administrative Backend for Federated Learning Network

This API provides administrative functions for managing a blockchain-based federated learning network for histopathology image classification.

### Key Features:
- **Hospital Management**: Register, update, and manage participating hospitals
- **Model Aggregation**: Coordinate FedAvg aggregation of model updates
- **Network Control**: Manage training rounds, set parameters, pause/unpause
- **Monitoring**: Track network status, model history, and hospital contributions

### Architecture:
- **Blockchain**: Ethereum Sepolia Testnet
- **Smart Contract**: FederatedModelRegistry
- **IPFS**: Pinata for model weight storage
- **Model**: EfficientNet-B0 + Coordinate Attention (~5.9M params)
      `,
      contact: {
        name: 'FL Admin',
        email: 'admin@federated-learning.org'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'Hospitals', description: 'Hospital registration and management' },
      { name: 'Aggregation', description: 'Model aggregation (FedAvg) operations' },
      { name: 'Network', description: 'Network configuration and status' },
      { name: 'Models', description: 'Global model management' },
      { name: 'IPFS', description: 'IPFS operations for model storage' }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        Hospital: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Ethereum address' },
            name: { type: 'string', description: 'Hospital name' },
            region: { type: 'string', description: 'Geographic region' },
            isActive: { type: 'boolean', description: 'Active status' },
            totalContributions: { type: 'integer', description: 'Number of model updates' },
            totalSamplesContributed: { type: 'integer', description: 'Total training samples' },
            registrationTime: { type: 'string', format: 'date-time' }
          }
        },
        GlobalModel: {
          type: 'object',
          properties: {
            version: { type: 'integer', description: 'Model version/round' },
            modelWeightsCID: { type: 'string', description: 'IPFS CID of model weights' },
            modelHash: { type: 'string', description: 'SHA-256 hash of model' },
            timestamp: { type: 'string', format: 'date-time' },
            accuracy: { type: 'number', description: 'Model accuracy (0-100)' },
            aucScore: { type: 'number', description: 'AUC-ROC score (0-1)' },
            sensitivity: { type: 'number', description: 'Sensitivity/Recall' },
            specificity: { type: 'number', description: 'Specificity' },
            contributorCount: { type: 'integer', description: 'Number of contributing hospitals' }
          }
        },
        ModelUpdate: {
          type: 'object',
          properties: {
            hospital: { type: 'string', description: 'Hospital Ethereum address' },
            modelWeightsCID: { type: 'string', description: 'IPFS CID of update' },
            dataSampleCount: { type: 'integer', description: 'Training samples used' },
            accuracy: { type: 'number', description: 'Local accuracy' },
            loss: { type: 'number', description: 'Training loss' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        NetworkStatus: {
          type: 'object',
          properties: {
            contractAddress: { type: 'string' },
            currentRound: { type: 'integer' },
            totalModels: { type: 'integer' },
            registeredHospitals: { type: 'integer' },
            pendingUpdates: { type: 'integer' },
            requiredSubmissions: { type: 'integer' },
            isPaused: { type: 'boolean' },
            oracle: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);
