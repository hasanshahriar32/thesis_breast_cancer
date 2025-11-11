# Hospital 4 - Dynamic Federated Learning Backend

This is a Node.js backend system for Hospital 4 that dynamically generates patient data, extracts features using ML models, and integrates with blockchain and IPFS for federated learning.

## 🏥 Overview

This backend replaces the static JSON simulation with a dynamic system that can:
- Process real patient medical images (X-Ray, Histopathology, Ultrasound)
- Extract features using TensorFlow.js and pre-trained EfficientNetB0 models
- Securely encrypt and store data using IPFS
- Submit model weights to blockchain for federated learning
- Manage patient data with privacy compliance

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   cd hospital-backend
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the Backend**:
   ```bash
   npm start
   ```

4. **Development Mode**:
   ```bash
   npm run dev
   ```

## 📊 API Endpoints

### Hospital Information
- `GET /api/hospital/info` - Get hospital details
- `GET /api/hospital/stats` - Get patient statistics
- `PUT /api/hospital/config` - Update hospital configuration

### Patient Management
- `POST /api/patients/upload` - Upload patient data and images
- `GET /api/patients/list` - List all patients
- `GET /api/patients/:id` - Get specific patient data
- `POST /api/patients/:id/extract-features` - Extract features for patient
- `DELETE /api/patients/:id` - Delete patient data

### Machine Learning Models
- `POST /api/models/train-local` - Train local model
- `GET /api/models/local-status` - Get local model status
- `POST /api/models/upload-weights` - Upload model weights to IPFS
- `POST /api/models/integrate-federated` - Integrate federated weights
- `GET /api/models/metrics` - Get model performance metrics

### IPFS Integration
- `POST /api/ipfs/upload` - Upload data to IPFS
- `GET /api/ipfs/download/:hash` - Download from IPFS
- `POST /api/ipfs/upload-model` - Upload model weights
- `GET /api/ipfs/node-info` - Get IPFS node information
- `GET /api/ipfs/pinned` - List pinned content

### Blockchain Integration
- `POST /api/blockchain/register-hospital` - Register hospital on blockchain
- `POST /api/blockchain/submit-model` - Submit model weights to blockchain
- `GET /api/blockchain/latest-model` - Get latest federated model
- `GET /api/blockchain/network-status` - Get blockchain network status
- `POST /api/blockchain/estimate-gas` - Estimate gas for operations

### Feature Extraction
- `POST /api/features/extract` - Extract features from patient images
- `GET /api/features/status` - Get feature extraction status
- `GET /api/features/categories` - Get interpretable feature categories

## 🔧 Configuration

### Environment Variables

```env
# Hospital Configuration
HOSPITAL_ID=4
HOSPITAL_NAME="General Hospital 4"
HOSPITAL_REGION="North America"
HOSPITAL_ADDRESS="456 Medical Center Drive, Boston, MA 02115"
HOSPITAL_EMAIL="federated@hospital4.org"

# Server Configuration
PORT=3000
NODE_ENV=development

# Database (MongoDB)
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=hospital_federated_learning

# Blockchain Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
PRIVATE_KEY=your-ethereum-private-key
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# IPFS Configuration
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# Security & Encryption
ENCRYPTION_KEY=your-256-bit-encryption-key-in-hex
ENCRYPT_FILES=true
ENCRYPT_PATIENT_DATA=true
JWT_SECRET=your-jwt-secret

# ML Models
XRAY_MODEL_PATH=../../../extractor_xray.h5
HISTO_MODEL_PATH=../../../extractor_histo.h5
ULTRA_MODEL_PATH=../../../extractor_ultra.h5
```

## 🏗️ Architecture

```
hospital-backend/
├── src/
│   ├── routes/           # API route handlers
│   │   ├── patients.js   # Patient data management
│   │   ├── models.js     # ML model operations
│   │   ├── blockchain.js # Blockchain integration
│   │   ├── ipfs.js      # IPFS operations
│   │   ├── hospital.js  # Hospital information
│   │   └── features.js  # Feature extraction
│   ├── services/         # Business logic services
│   │   ├── featureExtractor.js  # ML feature extraction
│   │   ├── encryption.js        # Encryption utilities
│   │   ├── patient.js          # Patient data service
│   │   └── ipfs.js             # IPFS service
│   ├── utils/            # Utility functions
│   │   └── logger.js     # Logging configuration
│   └── server.js         # Express server setup
├── logs/                 # Application logs
├── uploads/              # Temporary file uploads
├── models/               # Local ML models
├── package.json
├── .env.example
└── README.md
```

## 🔒 Security Features

- **Data Encryption**: AES-256-GCM encryption for sensitive data
- **Secure File Deletion**: Overwrite files before deletion
- **IPFS Encryption**: Model weights encrypted before IPFS storage
- **JWT Authentication**: Secure API access (when enabled)
- **Input Validation**: Comprehensive request validation
- **Audit Logging**: Complete operation logging

## 🧠 Machine Learning Pipeline

1. **Image Upload**: Patients upload medical images (X-Ray, Histopathology, Ultrasound)
2. **Preprocessing**: Images resized, normalized for model input
3. **Feature Extraction**: EfficientNetB0-based extractors generate 1,280-dimensional features per modality
4. **Feature Fusion**: Combine features from all modalities (3,840 total dimensions)
5. **Local Training**: Train fusion model on hospital's patient data
6. **Weight Encryption**: Encrypt model weights for secure sharing
7. **IPFS Upload**: Store encrypted weights on IPFS
8. **Blockchain Submission**: Submit IPFS hashes to smart contract
9. **Federated Learning**: Download and integrate weights from other hospitals

## 📊 Monitoring & Logging

- **Winston Logging**: Structured logging with multiple levels
- **Health Checks**: `/health` endpoint for monitoring
- **Performance Metrics**: Memory usage, CPU usage, uptime tracking
- **Error Tracking**: Comprehensive error logging and reporting
- **Audit Trail**: Complete operation history

## 🔧 Development

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Test the API
```bash
# Health check
curl http://localhost:3000/health

# Hospital info
curl http://localhost:3000/api/hospital/info

# Upload patient data (example)
curl -X POST http://localhost:3000/api/patients/upload \
  -F "patient_metadata={\"age\":45,\"gender\":\"female\",\"diagnosis\":\"screening\"}" \
  -F "xray=@sample_xray.jpg" \
  -F "histopathology=@sample_histo.jpg"
```

## 🌐 Integration with Existing System

This backend integrates with your existing federated learning system:

- **Smart Contract**: Uses the enhanced `FederatedModelRegistry.sol`
- **ML Models**: Compatible with existing `extractor_*.h5` models
- **IPFS Network**: Connects to the same IPFS network for data sharing
- **Blockchain**: Submits to the same Ethereum network (Sepolia testnet)

## 🚀 Deployment

1. **Production Environment**:
   ```bash
   NODE_ENV=production npm start
   ```

2. **Docker Deployment**:
   ```bash
   # Build Docker image
   docker build -t hospital-backend .
   
   # Run container
   docker run -p 3000:3000 --env-file .env hospital-backend
   ```

3. **Process Management**:
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/server.js --name hospital-backend
   ```

## 📋 Next Steps

1. Configure your environment variables in `.env`
2. Set up MongoDB for patient data storage
3. Configure IPFS node for decentralized storage
4. Deploy smart contract and update `CONTRACT_ADDRESS`
5. Upload your pre-trained models to the `models/` directory
6. Test API endpoints with sample data
7. Integrate with your existing federated learning network

## 🆘 Support

For issues or questions:
- Check the logs in `logs/` directory
- Review API documentation above
- Ensure all environment variables are set correctly
- Verify IPFS and MongoDB connections