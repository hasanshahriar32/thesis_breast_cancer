# End-to-End Testing Guide

Quick-start guide to test the full federated learning pipeline — from starting services through to blockchain-recorded aggregation.

---

## 1. Prerequisites

| Component | Detail |
|-----------|--------|
| Node.js | v18+ |
| Python | 3.11 (pyenv) |
| Model | `model/best_histopathology_model.pth` must exist |
| Sepolia ETH | Wallet must have testnet ETH for gas |
| MongoDB | Atlas connection string in `hospital-backend/.env` |

---

## 2. Install Dependencies & Start Backends

**Terminal 1 — Hospital Backend (port 3000):**
```bash
cd ~/Desktop/thesis/hospital-backend
npm install
npm start
```

**Terminal 2 — Admin Backend (port 4000):**
```bash
cd ~/Desktop/thesis/admin-backend
npm install
npm start
```

**Verify both are running:**
```bash
curl http://localhost:3000/health
curl http://localhost:4000/health
```

Both should return `{ "status": "healthy", ... }`.

**Swagger docs:**
- Hospital: http://localhost:3000/api-docs
- Admin: http://localhost:4000/api-docs

---

## 3. Check Network Status (Admin)

```bash
curl http://localhost:4000/api/network/status | jq
```

This reads the smart contract on Sepolia and returns the current round, registered hospitals, pause state, etc.

---

## 4. Register a Hospital (Admin)

```bash
curl -X POST http://localhost:4000/api/hospitals/register \
  -H "Content-Type: application/json" \
  -d '{
    "hospitalAddress": "0x684D46A481A66dBB0Ab8A8E24c1d791E4c459C56",
    "name": "Boston Hospital",
    "dataQualityScore": 90
  }' | jq
```

> Skip if this hospital is already registered from a prior run (the contract will revert with "Already registered").

---

## 5. Upload a Patient Image (Hospital)

```bash
curl -X POST http://localhost:3000/api/patients/upload \
  -F "histopathology=@dataset_image/train_folder/img/TCGA-A7-A13E-01Z-00-DX1_1.png" \
  -F "patientId=TEST-001" \
  -F "diagnosis=malignant" \
  -F "tissue_type=breast" | jq
```

Note the returned `patientId`.

---

## 6. Extract Features for a Patient (Hospital)

```bash
curl -X POST http://localhost:3000/api/models/extract-features/TEST-001 | jq
```

This runs inference through the EfficientNet-B0 model and extracts a 1280-dimensional feature vector. It takes 10–30 seconds on CPU.

**Check extraction status:**
```bash
curl http://localhost:3000/api/features/status | jq
```

---

## 7. View Training Data (Hospital)

```bash
curl http://localhost:3000/api/models/training-data | jq
```

Should show the extracted features and labels ready for local training.

---

## 8. Prepare a Model Update (Hospital)

```bash
curl -X POST http://localhost:3000/api/models/prepare-update \
  -H "Content-Type: application/json" \
  -d '{
    "epochs": 1,
    "learningRate": 0.001
  }' | jq
```

This simulates local training and produces updated model weights.

---

## 9. Upload Weights to IPFS (Hospital)

```bash
curl -X POST http://localhost:3000/api/models/upload-weights | jq
```

Returns an IPFS CID (e.g. `Qm...`). Note this CID — it goes on-chain next.

---

## 10. Submit Model Update to Blockchain (Hospital)

```bash
curl -X POST http://localhost:3000/api/blockchain/submit-model \
  -H "Content-Type: application/json" \
  -d '{
    "ipfsHash": "<CID_FROM_STEP_10>",
    "accuracy": 92,
    "loss": 25,
    "datasetSize": 50
  }' | jq
```

> `accuracy` and `loss` are integers (contract uses basis points: 92 = 92%, 25 = 0.25 loss).

This sends a transaction to the `FederatedModelRegistry` contract on Sepolia.

---

## 11. Check Pending Updates (Admin)

```bash
curl http://localhost:4000/api/aggregation/pending | jq
```

Shows all hospital submissions waiting for the current round.

---

## 12. Run Aggregation — FedAvg (Admin)

```bash
# Run aggregation only (downloads weights from IPFS → FedAvg → new weights)
curl -X POST http://localhost:4000/api/aggregation/run | jq

# Or run + publish in one step:
curl -X POST http://localhost:4000/api/aggregation/run-and-publish | jq
```

This:
1. Downloads each hospital's weight file from IPFS
2. Runs Federated Averaging (Python `fedavg.py`)
3. Uploads the aggregated weights to IPFS
4. Records the new global model version on-chain

---

## 13. Verify the New Global Model (Admin)

```bash
# Latest model info
curl http://localhost:4000/api/models/latest | jq

# Full model history
curl http://localhost:4000/api/models/history | jq
```

---

## 14. Check the Blockchain Transaction

```bash
# Network status (includes current round number)
curl http://localhost:4000/api/network/status | jq
```

Or check directly on Etherscan:
```
https://sepolia.etherscan.io/address/0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1
```

---

## Quick Smoke-Test (Minimal)

If you just want to verify services are alive and connected:

```bash
# 1. Health checks
curl -s http://localhost:3000/health | jq .status
curl -s http://localhost:4000/health | jq .status

# 2. Model info (loads PyTorch model)
curl -s http://localhost:3000/api/models/info | jq

# 3. Network status (reads blockchain)
curl -s http://localhost:4000/api/network/status | jq

# 4. IPFS connectivity
curl -s http://localhost:4000/api/ipfs/status | jq

# 5. Feature categories
curl -s http://localhost:3000/api/features/categories | jq
```

---

## Useful Extra Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `localhost:3000/api/patients/list` | GET | List all patients in MongoDB |
| `localhost:3000/api/hospital/info` | GET | Hospital config info |
| `localhost:3000/api/hospital/stats` | GET | Hospital statistics |
| `localhost:3000/api/blockchain/hospital-info` | GET | On-chain hospital info |
| `localhost:3000/api/blockchain/latest-model` | GET | Latest global model from chain |
| `localhost:4000/api/hospitals/` | GET | All registered hospitals |
| `localhost:4000/api/aggregation/status` | GET | Aggregation service status |
| `localhost:4000/api/network/connections` | GET | Network connectivity info |
| `localhost:4000/api/ipfs/:cid` | GET | Retrieve content from IPFS |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| MongoDB connection error | Check the `MONGODB_URL` in `hospital-backend/.env` — must be a valid Atlas connection string |
| "Insufficient funds" on blockchain tx | Fund the wallet with Sepolia ETH from a faucet |
| Feature extraction timeout | Normal on CPU — takes 10-30s per image |
| "Already registered" on hospital register | Hospital is already on-chain — skip step 5 |
| IPFS upload fails | Check Pinata credentials in `.env` |
| Model file not found | Ensure `model/best_histopathology_model.pth` exists |
| Port already in use | Kill the process: `lsof -ti:3000 | xargs kill` |
