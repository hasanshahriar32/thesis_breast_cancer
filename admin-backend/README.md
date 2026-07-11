# Federated Learning Admin Backend

Administrative backend for managing the blockchain-based federated learning network for histopathology image classification.

## Features

### 🏥 Hospital Management
- Register new hospitals as participants
- Update hospital information
- Activate/deactivate hospitals
- View all registered hospitals and their statistics

### 🔄 Model Aggregation (FedProx)
- Check aggregation readiness
- View pending model updates from hospitals
- Run FedProx server-side aggregation on pending updates
- Publish aggregated models to blockchain
- One-click run-and-publish workflow

### 🌐 Network Management
- View network status and configuration
- Set oracle address
- Configure required submissions and minimum samples
- Pause/unpause the contract
- Initialize/update genesis model

### 📦 Model History
- View all global model versions
- Get model by version
- Store and retrieve model metadata
- View training history with metrics

### 📡 IPFS Operations
- Upload files and JSON to IPFS (Pinata)
- Download files from IPFS
- List pinned files
- Calculate file hashes

## Quick Start

```bash
# Install dependencies
cd admin-backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start server
npm run dev
```

## API Documentation

Interactive API documentation available at:
```
http://localhost:4000/api-docs
```

## API Endpoints

### Hospitals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hospitals` | List all hospitals |
| GET | `/api/hospitals/:address` | Get hospital by address |
| POST | `/api/hospitals/register` | Register new hospital |
| PUT | `/api/hospitals/:address` | Update hospital info |
| PATCH | `/api/hospitals/:address/status` | Set active/inactive |

### Aggregation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/aggregation/status` | Check if ready for aggregation |
| GET | `/api/aggregation/pending` | Get pending updates |
| POST | `/api/aggregation/run` | Run FedProx aggregation |
| POST | `/api/aggregation/publish` | Publish to blockchain |
| POST | `/api/aggregation/run-and-publish` | Full workflow |

### Network
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/network/status` | Get network status |
| POST | `/api/network/oracle` | Set oracle address |
| PATCH | `/api/network/config` | Update configuration |
| POST | `/api/network/pause` | Pause contract |
| POST | `/api/network/unpause` | Unpause contract |
| POST | `/api/network/genesis` | Initialize genesis model |

### Models
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models` | List all global models |
| GET | `/api/models/latest` | Get latest model |
| GET | `/api/models/:version` | Get model by version |
| GET | `/api/models/:version/metadata` | Get model metadata |
| POST | `/api/models/:version/metadata` | Store model metadata |

### IPFS
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ipfs/status` | Test IPFS connection |
| POST | `/api/ipfs/upload` | Upload file |
| POST | `/api/ipfs/upload-json` | Upload JSON |
| GET | `/api/ipfs/:cid` | Get content |
| GET | `/api/ipfs/:cid/download` | Download file |
| DELETE | `/api/ipfs/:cid` | Unpin file |

## Configuration

### Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development

# Blockchain
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=0x...

# IPFS (Pinata)
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs

# Model
MODEL_PATH=../model/best_histopathology_model.pth
GENESIS_CID=Qm...
```

## Workflow Example

### 1. Register Hospitals
```bash
curl -X POST http://localhost:4000/api/hospitals/register \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234...",
    "name": "Boston General Hospital",
    "region": "North America"
  }'
```

### 2. Check Aggregation Status
```bash
curl http://localhost:4000/api/aggregation/status
```

### 3. Run Aggregation (when ready)
```bash
curl -X POST http://localhost:4000/api/aggregation/run-and-publish
```

### 4. View Model History
```bash
curl http://localhost:4000/api/models
```

## Architecture

```
admin-backend/
├── src/
│   ├── server.js           # Express server
│   ├── config/
│   │   ├── swagger.js      # API documentation
│   │   └── contractABI.json
│   ├── routes/
│   │   ├── hospitals.js    # Hospital management
│   │   ├── aggregation.js  # FedProx aggregation operations
│   │   ├── network.js      # Network control
│   │   ├── models.js       # Model queries
│   │   └── ipfs.js         # IPFS operations
│   ├── services/
│   │   ├── blockchainService.js  # Smart contract interactions
│   │   ├── ipfsService.js        # Pinata IPFS
│   │   └── aggregationService.js # FedProx server-side aggregation
│   ├── python/
│   │   ├── fedprox_aggregation.py  # PyTorch FedProx aggregation script
│   │   └── fedavg.py              # Legacy FedAvg script (backwards compat)
│   └── utils/
│       └── logger.js
├── temp/                   # Temporary files for aggregation
├── logs/                   # Application logs
├── package.json
├── .env
└── README.md
```

## FedProx Aggregation Algorithm

The system implements FedProx (Li et al., "Federated Optimization in Heterogeneous
Networks," MLSys 2020), an improvement over FedAvg that handles non-IID data
heterogeneity across hospitals.

### Client-Side (Hospital Training)
Each hospital trains with a proximal regularization term:
```
min_w F_k(w) + (μ/2) * ||w - w^t||²
```
where `w^t` is the global model and `μ` controls regularization strength.
This constrains local updates to stay close to the global model, preventing
client drift caused by heterogeneous data distributions.

### Server-Side (Admin Aggregation)
The server performs weighted averaging (identical to FedAvg):
```
w_global = Σ (n_k / N) * w_k
```
where `n_k` is samples from hospital k and `N` is total samples.

### Workflow
1. **Collect** pending model updates from all hospitals
2. **Download** model weights from IPFS
3. **Aggregate** using weighted average based on sample counts
4. **Upload** aggregated model to IPFS
5. **Publish** new global model to blockchain

### Key Advantage over FedAvg
FedProx mitigates client drift in non-IID settings. When hospitals in Boston,
London, and Tokyo have varying disease prevalence, scanner types, and patient
demographics, the proximal term ensures local models don't diverge excessively
before aggregation.

## Security Notes

- Keep `.env` file secure and never commit to git
- Use API keys for production deployments
- Oracle address controls model publication
- Only contract owner can register hospitals

## License

MIT
