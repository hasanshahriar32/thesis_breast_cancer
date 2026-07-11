# Blockchain-Based Federated Learning Smart Contract

This project contains a Solidity smart contract for coordinating privacy-preserving federated learning for **histopathology-based breast cancer classification**.

## 🧬 Model Architecture

- **Backbone**: EfficientNet-B0 (pretrained on ImageNet)
- **Attention**: Coordinate Attention mechanism
- **Task**: Binary Classification (Benign vs Malignant)
- **Framework**: PyTorch 2.0+
- **Input Size**: 160×160 RGB histopathology images
- **Parameters**: ~5.9 million

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd blockchain-federated-learning
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your details:

```bash
cp .env.example .env
```

Edit `.env`:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_metamask_private_key_here
```

**⚠️ WARNING: Never commit your `.env` file or share your private key!**

### 3. Compile Contract

```bash
npm run compile
```

### 4. Run Tests

```bash
npm test
```

### 5. Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

## 📁 Project Structure

```
blockchain-federated-learning/
├── contracts/
│   └── FederatedModelRegistry.sol    # Main smart contract
├── scripts/
│   ├── deploy.js                     # Deployment script
│   ├── interact.js                   # Contract interaction examples
│   ├── submitUpdate.js               # Submit model update example
│   └── hospitalInteraction.js        # Multi-hospital demo
├── test/
│   └── FederatedModelRegistry.enhanced.test.js # Comprehensive tests
├── test-data/
│   └── hospital{1,2,3}-*/            # Sample hospital data
├── hardhat.config.js                 # Hardhat configuration
├── package.json                      # Node.js dependencies
└── README.md                         # This file
```

## 🔧 Smart Contract Features

### Model Specifications
- **Architecture**: EfficientNet-B0 + Coordinate Attention
- **Classification**: Binary (Benign: 0, Malignant: 1)
- **Metrics Tracked**: Accuracy, AUC-ROC, Sensitivity, Specificity

### Core Functions

1. **Participant Management**
   - `registerParticipant(address, name, region)` - Register a hospital
   - `removeParticipant(address)` - Remove a participant
   - `getParticipants()` - Get all registered participants
   - `getHospitalInfo(address)` - Get hospital metadata

2. **Model Updates**
   - `submitUpdate(modelCID, hash, samples, accuracy, auc, sensitivity, specificity, duration)` - Submit local training results
   - `publishNewGlobalModel(modelCID, hash, accuracy, auc, sensitivity, specificity)` - Oracle publishes aggregated model
   - `storeWeightMetadata(...)` - Store model architecture details

3. **Query Functions**
   - `getLatestGlobalModel()` - Get the most recent model
   - `getUpdatesForRound(round)` - Get all submissions for a round
   - `getCurrentRoundSubmissions()` - Check current round status
   - `getNetworkStatistics()` - Get aggregated network stats

4. **Admin Functions**
   - `setOracleAddress(address)` - Set aggregation oracle
   - `setRequiredSubmissions(count)` - Set minimum submissions
   - `setMinSamplesPerUpdate(count)` - Set minimum samples required
   - `pause()` / `unpause()` - Emergency controls

## 📝 Usage Examples

### Deploy Contract

```bash
npm run deploy:sepolia
```

Save the contract address from the output!

### Register Participants (Owner Only)

```javascript
await contract.registerParticipant(
    "0xParticipantAddress",
    "Boston Medical Center",
    "North America"
);
```

### Submit Model Update (As Participant)

```javascript
await contract.submitUpdate(
    "QmModelWeightsCID123",           // IPFS CID of encrypted model
    modelHash,                         // SHA-256 hash
    1500,                             // Number of histopathology samples
    9378,                             // 93.78% accuracy
    9650,                             // 0.9650 AUC
    9400,                             // 94% sensitivity
    9300,                             // 93% specificity
    3600                              // 1 hour training duration
);
```

### Publish Global Model (Oracle Only)

```javascript
await contract.publishNewGlobalModel(
    "QmAggregatedModelCID456",
    aggregatedHash,
    9450,                             // 94.50% accuracy
    9700,                             // 0.9700 AUC
    9500,                             // 95% sensitivity
    9400                              // 94% specificity
);
```

## 🔐 Security Features

- **Access Control**: Only registered participants can submit updates
- **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
- **Pausable**: Emergency stop mechanism
- **Hash Verification**: All models include SHA-256 hashes
- **No PII Storage**: Only metadata and IPFS CIDs stored on-chain
- **Metric Validation**: All metrics validated to be ≤100%

## 🧪 Testing

Run comprehensive test suite:

```bash
npm test
```

Tests cover:
- Participant registration/removal
- Model update submission
- Global model publishing
- Access control
- Metric validation
- Edge cases

## 📊 What Data is Stored?

### On Blockchain:
- ✅ IPFS CIDs (model weights pointers)
- ✅ SHA-256 hashes (for verification)
- ✅ Sample counts (aggregated statistics)
- ✅ Model metrics (accuracy, AUC, sensitivity, specificity)
- ✅ Participant addresses (MetaMask wallets)
- ✅ Hospital metadata (name, region)

### NOT Stored:
- ❌ Raw histopathology images
- ❌ Patient names or IDs
- ❌ Feature vectors
- ❌ Any personally identifiable information

### On IPFS (Encrypted):
- EfficientNet-B0 + CoordinateAttention model weights (.pth files)

## 🌐 Network Information

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: https://rpc.sepolia.org
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com

## 📖 Workflow

1. **Owner** deploys contract and registers participants
2. **Owner** sets oracle address
3. **Owner** initializes genesis model (pre-trained EfficientNet-B0)
4. **Participants** train models locally on private histopathology data
5. **Participants** upload encrypted weights to IPFS
6. **Participants** submit IPFS CIDs + metrics to smart contract
7. **Oracle** aggregates updates when threshold is met
8. **Oracle** publishes new global model to contract
9. **Participants** download new model and repeat

## 🛠️ Troubleshooting

### "Insufficient funds" error
- Get test ETH from https://sepoliafaucet.com

### "Not a registered participant"
- Ask contract owner to register your address

### "Invalid private key"
- Remove `0x` prefix from private key in `.env`

### Contract not found
- Verify you're connected to the correct network
- Check contract address is correct

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This is a research project for privacy-preserving federated learning in healthcare.

## ⚠️ Disclaimer

This is experimental software for research purposes. Always test thoroughly before any production use.
