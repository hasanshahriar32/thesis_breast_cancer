# Hospital Backend - Federated Learning Node

Backend service for hospital participation in the federated learning network for histopathology-based breast cancer classification.

## Overview

This Node.js backend enables hospitals to:
- Process histopathology images for cancer classification
- Extract features using EfficientNet-B0 + Coordinate Attention model
- Submit model updates to the blockchain-based federated learning network
- Securely store encrypted patient data

## Model Architecture

| Property | Value |
|----------|-------|
| **Architecture** | EfficientNet-B0 + Coordinate Attention |
| **Task** | Binary Classification (Benign vs Malignant) |
| **Input Size** | 160×160 RGB |
| **Feature Dimensions** | 1280 |
| **Framework** | PyTorch 2.0+ |

## Quick Start

### 1. Install Dependencies

```bash
cd hospital-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
# Hospital Configuration
HOSPITAL_ID=1
HOSPITAL_NAME="Your Hospital Name"
HOSPITAL_REGION="Your Region"

# Server
PORT=3000

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=hospital_federated_learning

# Blockchain (Sepolia Testnet)
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR-KEY
PRIVATE_KEY=your-wallet-private-key
CONTRACT_ADDRESS=0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1

# Model Path
MODEL_PATH=/path/to/best_histopathology_model.pth

# Security
ENCRYPT_FILES=true
```

### 3. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Patient Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients/upload` | POST | Upload histopathology image |
| `/api/patients/list` | GET | List all patients |
| `/api/patients/:id` | GET | Get patient details |
| `/api/patients/:id/classify` | POST | Classify patient's image |
| `/api/patients/batch/classify` | POST | Batch classification |

### Model & Features

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/models/info` | GET | Get model information |
| `/api/models/extract-features/:id` | POST | Extract features for patient |
| `/api/models/training-data` | GET | Get training data statistics |
| `/api/models/prepare-update` | POST | Prepare model for FL submission |
| `/api/models/upload-weights` | POST | Upload weights to IPFS |
| `/api/models/batch-extract` | POST | Batch feature extraction |

### Blockchain Integration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/blockchain/register-hospital` | POST | Register on blockchain |
| `/api/blockchain/submit-model` | POST | Submit model update |
| `/api/blockchain/latest-model` | GET | Get latest global model |
| `/api/blockchain/hospital-info` | GET | Get hospital info |
| `/api/blockchain/network-status` | GET | Network & contract status |
| `/api/blockchain/initialize-genesis` | POST | Initialize genesis model |

### IPFS Storage

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ipfs/upload` | POST | Upload file to IPFS |
| `/api/ipfs/download/:cid` | GET | Download from IPFS |
| `/api/ipfs/node-info` | GET | IPFS node status |

## Federated Learning Workflow

### 1. Register Hospital

```bash
curl -X POST http://localhost:3000/api/blockchain/register-hospital \
  -H "Content-Type: application/json" \
  -d '{"hospital_name": "Boston General", "hospital_region": "North America"}'
```

### 2. Upload Patient Data

```bash
curl -X POST http://localhost:3000/api/patients/upload \
  -F "histopathology=@/path/to/image.png" \
  -F 'patient_metadata={"age": 45, "gender": "F", "diagnosis": "benign"}'
```

### 3. Extract Features

```bash
curl -X POST http://localhost:3000/api/models/extract-features/{patientId}
```

### 4. Prepare & Submit Model Update

```bash
# Check training data
curl http://localhost:3000/api/models/training-data

# Prepare update
curl -X POST http://localhost:3000/api/models/prepare-update

# Upload weights to IPFS
curl -X POST http://localhost:3000/api/models/upload-weights

# Submit to blockchain
curl -X POST http://localhost:3000/api/blockchain/submit-model \
  -H "Content-Type: application/json" \
  -d '{
    "model_weights_cid": "QmYourIPFSCID...",
    "model_hash": "0x...",
    "local_samples": 500,
    "accuracy": 9450,
    "auc_score": 9600,
    "sensitivity": 9500,
    "specificity": 9200,
    "training_time": 3600
  }'
```

## Project Structure

```
hospital-backend/
├── src/
│   ├── server.js              # Express app entry point
│   ├── config/
│   │   └── swagger.js         # API documentation config
│   ├── routes/
│   │   ├── blockchain.js      # Blockchain integration
│   │   ├── features.js        # Feature extraction
│   │   ├── hospital.js        # Hospital info
│   │   ├── ipfs.js            # IPFS storage
│   │   ├── models.js          # ML model operations
│   │   └── patients.js        # Patient management
│   ├── services/
│   │   ├── blobStorage.js     # Vercel Blob storage
│   │   ├── encryption.js      # AES encryption
│   │   ├── featureExtractor.js # PyTorch inference
│   │   ├── ipfs.js            # IPFS client
│   │   └── patient.js         # Patient database
│   └── utils/
│       └── logger.js          # Winston logging
├── docs/
├── uploads/                    # Local encrypted uploads
├── package.json
└── swagger.yml                 # API documentation
```

## Smart Contract

**Contract Address (Sepolia)**: `0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1`

The FederatedModelRegistry contract coordinates:
- Hospital registration and management
- Model update submissions
- Global model publication
- Training round coordination

## Security Features

- **Encryption**: Patient images encrypted with AES-256 before storage
- **Blockchain**: Immutable record of model contributions
- **Privacy**: Raw images never leave the hospital - only model weights
- **Authentication**: Hospital wallet-based authentication

## Development

```bash
# Run tests
npm test

# Lint
npm run lint

# API documentation
npm start
# Visit http://localhost:3000/api-docs
```

## License

Part of thesis research project.
