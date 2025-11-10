# 🚀 Quick Setup Guide

## Step-by-Step Instructions to Deploy Your Smart Contract

### 1. Prerequisites

✅ **Install MetaMask**
- Go to https://metamask.io and install the browser extension
- Create a new wallet or import an existing one
- **IMPORTANT**: Save your seed phrase securely!

✅ **Get Your Private Key**
1. Open MetaMask
2. Click on the three dots (⋮) next to your account
3. Click "Account Details"
4. Click "Export Private Key"
5. Enter your password
6. Copy the private key (it starts without `0x`)

✅ **Get Test ETH for Sepolia**
1. Copy your MetaMask wallet address
2. Go to https://sepoliafaucet.com
3. Paste your address and request test ETH
4. Wait a few minutes for the ETH to arrive

---

### 2. Configure Your Project

**Create `.env` file:**

```bash
cd blockchain-federated-learning
cp .env.example .env
nano .env  # or use your favorite editor
```

**Fill in your details in `.env`:**

```env
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here_without_0x
```

⚠️ **NEVER share or commit your private key!**

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Compile the Contract

```bash
npm run compile
```

You should see: `✔ Compiled 5 Solidity files successfully`

---

### 5. Run Tests (Optional but Recommended)

```bash
npm test
```

You should see: `✔ 23 passing`

---

### 6. Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

**Save the contract address from the output!** You'll need it for all future interactions.

Example output:
```
✅ FederatedModelRegistry deployed to: 0xAbC123...
```

---

### 7. Verify Your Deployment

Go to: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

You should see your deployed contract!

---

## 📝 Post-Deployment Setup

### Register Participants

Edit `scripts/interact.js` and update:
```javascript
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
```

Then register a participant (you need to be the owner):
```javascript
// Add this to interact.js
await contract.registerParticipant("0xParticipantWalletAddress");
```

Run:
```bash
node scripts/interact.js
```

---

### Set Oracle Address

The oracle is responsible for aggregating model updates. For testing, you can use your own address:

```javascript
await contract.setOracleAddress("YOUR_WALLET_ADDRESS");
```

---

### Initialize Genesis Model

Before participants can submit updates, you need to initialize the first model:

```javascript
// Upload your initial model to IPFS and get the CID
const genesisCID = "QmYourIPFSCID...";
const genesisHash = "0x" + require('crypto').randomBytes(32).toString('hex');

await contract.initializeGenesisModel(genesisCID, genesisHash);
```

---

## 🏥 For Participants (Hospitals)

### Submit Your Model Update

1. Train your model locally on your private data
2. Upload your encrypted model weights to IPFS
3. Get the IPFS CID
4. Update `scripts/submitUpdate.js` with:
   - Your contract address
   - Your actual IPFS CIDs
5. Run: `node scripts/submitUpdate.js`

---

## 🔍 Check Contract Status

```bash
node scripts/interact.js
```

This will show:
- Current round
- Number of participants
- Number of submissions
- Latest model information

---

## 💡 Useful Commands

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm test` | Run test suite |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |
| `node scripts/interact.js` | Query contract status |
| `node scripts/submitUpdate.js` | Submit model update |

---

## 🆘 Troubleshooting

### Error: "Insufficient funds"
- Make sure you have test ETH in your MetaMask wallet
- Get more from https://sepoliafaucet.com

### Error: "Not a registered participant"
- Ask the contract owner to register your wallet address
- Run: `await contract.registerParticipant("YOUR_ADDRESS")`

### Error: "Invalid private key"
- Make sure you removed the `0x` prefix from your private key in `.env`
- Check there are no extra spaces

### Error: "Network not configured"
- Check your `SEPOLIA_RPC_URL` in `.env`
- Try using: `https://rpc.sepolia.org`

---

## 📚 Next Steps

1. ✅ Deploy contract
2. ✅ Register participants (hospitals)
3. ✅ Set oracle address
4. ✅ Initialize genesis model
5. ✅ Participants submit local updates
6. ✅ Oracle aggregates and publishes new model
7. ✅ Repeat for multiple training rounds

---

## 🔐 Security Reminders

- ❌ **NEVER** commit your `.env` file
- ❌ **NEVER** share your private key
- ❌ **NEVER** store patient data on blockchain
- ✅ **ALWAYS** encrypt model updates before uploading to IPFS
- ✅ **ALWAYS** use test ETH before mainnet deployment

---

## 📖 Documentation

- Smart Contract README: `blockchain-federated-learning/README.md`
- Hardhat Docs: https://hardhat.org/docs
- OpenZeppelin Docs: https://docs.openzeppelin.com
- Sepolia Etherscan: https://sepolia.etherscan.io

---

## ✨ You're Ready!

Your blockchain-based federated learning system is now set up and ready for collaborative, privacy-preserving machine learning!

For questions or issues, refer to the detailed README.md in the project folder.
