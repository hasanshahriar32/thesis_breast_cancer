# Blockchain-Based Federated Learning Smart Contract

This project contains a Solidity smart contract for coordinating privacy-preserving federated learning for multi-modal breast cancer diagnosis.

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
│   └── submitUpdate.js               # Submit model update example
├── test/
│   └── FederatedModelRegistry.test.js # Comprehensive tests
├── hardhat.config.js                 # Hardhat configuration
├── package.json                      # Node.js dependencies
└── README.md                         # This file
```

## 🔧 Smart Contract Features

### Core Functions

1. **Participant Management**
   - `registerParticipant(address)` - Register a hospital/institution
   - `removeParticipant(address)` - Remove a participant
   - `getParticipants()` - Get all registered participants

2. **Model Updates**
   - `submitUpdate(cid, hash, sampleCount, extractorCID)` - Submit local training results
   - `publishNewGlobalModel(cid, hash, accuracy)` - Oracle publishes aggregated model

3. **Query Functions**
   - `getLatestGlobalModel()` - Get the most recent model
   - `getUpdatesForRound(round)` - Get all submissions for a round
   - `getCurrentRoundSubmissions()` - Check current round status

4. **Admin Functions**
   - `setOracleAddress(address)` - Set aggregation oracle
   - `setRequiredSubmissions(count)` - Set minimum submissions
   - `pause()` / `unpause()` - Emergency controls

## 📝 Usage Examples

### Deploy Contract

```bash
npm run deploy:sepolia
```

Save the contract address from the output!

### Register Participants (Owner Only)

Edit `scripts/interact.js` with your contract address and run:

```javascript
// In interact.js, add:
await contract.registerParticipant("0xParticipantAddress");
```

### Submit Model Update (As Participant)

```bash
node scripts/submitUpdate.js
```

Make sure to:
1. Update `CONTRACT_ADDRESS` in the script
2. Upload your model to IPFS first
3. Use the real IPFS CID in the script

### Set Oracle Address (Owner Only)

```javascript
await contract.setOracleAddress("0xOracleAddress");
```

## 🔐 Security Features

- **Access Control**: Only registered participants can submit updates
- **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
- **Pausable**: Emergency stop mechanism
- **Hash Verification**: All models include SHA-256 hashes
- **No PII Storage**: Only metadata and IPFS CIDs stored on-chain

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
- Edge cases

## 📊 What Data is Stored?

### On Blockchain:
- ✅ IPFS CIDs (model weights pointers)
- ✅ SHA-256 hashes (for verification)
- ✅ Sample counts (aggregated statistics)
- ✅ Model accuracy metrics
- ✅ Participant addresses (MetaMask wallets)

### NOT Stored:
- ❌ Raw patient images
- ❌ Patient names or IDs
- ❌ Feature vectors
- ❌ Any personally identifiable information

### On IPFS (Encrypted):
- Fusion model weight updates
- Feature extractor weights (xray, histo, ultra)

## 🌐 Network Information

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: https://rpc.sepolia.org
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com

## 📖 Workflow

1. **Owner** deploys contract and registers participants
2. **Owner** sets oracle address
3. **Owner** initializes genesis model
4. **Participants** train models locally on private data
5. **Participants** upload encrypted weights to IPFS
6. **Participants** submit IPFS CIDs to smart contract
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
