# Completed Work Documentation

This document tracks all completed work on the Blockchain Federated Learning project.

---

## July 2025

### FedAvg → FedProx Aggregation Upgrade (Journal Publication Preparation)

**Summary**: Upgraded the federated learning aggregation strategy from FedAvg to FedProx
(Li et al., "Federated Optimization in Heterogeneous Networks," MLSys 2020) to address
non-IID data heterogeneity across hospitals and strengthen the methodology for journal
publication.

**Motivation**: FedAvg is considered a baseline method in 2025 FL literature. FedProx adds
a proximal regularization term `(μ/2) * ||w - w^t||²` to each hospital's local training
objective, constraining local model updates to stay close to the global model. This mitigates
"client drift" when hospitals have heterogeneous data distributions (different disease
prevalence, scanner types, patient demographics across Boston, London, Tokyo).

**Key Design Decision**: FedProx's server-side aggregation is identical to FedAvg (weighted
average of model parameters). The innovation is entirely on the client side (hospital
training). This means the smart contract, IPFS workflow, and blockchain coordination
required zero changes.

#### Changes Made

**1. New Files**
- `admin-backend/src/python/fedprox_aggregation.py` — FedProx server-side aggregation
  script with proper citations and documentation. Server-side math is identical to FedAvg
  (weighted average), but named and documented as FedProx.
- `hospital-backend/src/services/fedprox_train.py` — Complete FedProx local training
  script for hospital nodes. Includes: FastHistopathologyModel architecture, proximal
  term computation, dataset loading, full training loop with CE + proximal loss,
  evaluation metrics (accuracy, AUC, sensitivity, specificity), and configurable μ parameter.

**2. Modified Files**
- `admin-backend/src/services/aggregationService.js` — Rebranded from FedAvg to FedProx.
  Updated method `performFedAvg()` → `performFedProxAggregation()`, Python script reference
  now tries `fedprox_aggregation.py` first with `fedavg.py` fallback, all logging and error
  messages updated.
- `admin-backend/src/routes/aggregation.js` — Updated Swagger docs and logging from
  FedAvg → FedProx.
- `admin-backend/README.md` — Full rewrite of aggregation section with FedProx algorithm
  description, client-side and server-side formulas, architecture diagram update.
- `README.md` (project root) — Updated architecture diagram and features list.
- `docs/COMPLETED_WORK.md` — This documentation.

**3. No Changes Required**
- Smart contract (`FederatedModelRegistry.sol`) — Zero changes needed
- IPFS workflow — Zero changes needed (same model weight format)
- Blockchain interaction scripts — Zero changes needed
- Hospital backend API routes — Zero changes needed (training script is standalone)

#### Reference

Li, T., Sahu, A. K., Zaheer, M., Sanjabi, M., Talwalkar, A., & Smith, V. (2020).
Federated Optimization in Heterogeneous Networks. *Proceedings of Machine Learning
and Systems (MLSys)*, 2, 429-450.

---

## December 10, 2025

### Smart Contract Update - Single Modality Architecture

**Summary**: Updated the entire blockchain federated learning system from multi-modal (X-Ray, Histopathology, Ultrasound) to single-modality (Histopathology only) to match the new EfficientNet-B0 model.

#### Changes Made

**1. Smart Contract (`FederatedModelRegistry.sol`)**

- Removed multi-modal extractor CIDs (X-Ray, Histo, Ultrasound)
- Simplified to single `modelWeightsCID` field
- Updated structs: `GlobalModel`, `ModelUpdate`, `WeightMetadata`
- Updated function signatures for `submitModelUpdate` and `aggregateUpdates`
- Added accuracy tracking to global model

**2. Deployment Scripts**

- `deploy.js` - Updated for single-model deployment
- `interact.js` - Fixed contract connection, loads address from deployment-info.json
- `submitUpdate.js` - Single model CID submission
- `hospitalInteraction.js` - Complete rewrite for new workflow

**3. Test Suite**

- `FederatedModelRegistry.enhanced.test.js` - All 39 tests passing
- Tests cover: deployment, registration, submission, publication, metadata, admin functions

**4. Test Data**

Updated all 3 hospital test data files:
- `hospital1-boston/blockchain_submission.json`
- `hospital2-london/blockchain_submission.json`
- `hospital3-tokyo/blockchain_submission.json`

**5. Documentation**

Updated documentation to reflect new architecture:
- README.md files
- PROJECT_SUMMARY.md
- SETUP_GUIDE.md
- docs/USE_CASES.md
- docs/ENHANCED_CONTRACT_GUIDE.md
- docs/CONTRACT_UPDATE_SUMMARY.md
- docs/PATIENT_DATA_FEATURES.md

#### Deployment

**Network**: Sepolia Testnet

| Property | Value |
|----------|-------|
| Contract Address | `0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1` |
| Owner Address | `0x8cc0861616B52b115EAa64C1c8313AfdC4fF1d42` |
| Block Number | 9808044 |
| Required Submissions | 3 |
| Min Samples per Update | 500 |

#### Verification

- Contract compiled successfully
- All 39 tests passing
- Scripts syntax validated
- Contract interaction working on Sepolia

---

## Model Architecture (Current)

### EfficientNet-B0 + Coordinate Attention

```
Input (160×160 RGB)
       │
       ▼
┌──────────────────┐
│  EfficientNet-B0 │  (Pre-trained backbone)
│   Feature Maps   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ FastCoordinate   │  (Spatial attention)
│   Attention      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Classification  │  (Binary: Benign/Malignant)
│      Head        │
└────────┬─────────┘
         │
         ▼
    Output (2 classes)
```

### Model Specifications

| Property | Value |
|----------|-------|
| Backbone | EfficientNet-B0 |
| Attention | Coordinate Attention |
| Input Size | 160×160 RGB |
| Output Classes | 2 (Benign, Malignant) |
| Parameters | ~5.9M |
| Framework | PyTorch 2.0+ |

---

## Previous Architecture (Deprecated)

The system previously used a multi-modal approach:
- X-Ray feature extractor
- Histopathology feature extractor
- Ultrasound feature extractor
- Fusion model for combining features

This has been replaced with the single-modality histopathology approach described above.

---

## Full System Revision — 7-Phase Bug Fix & Alignment

**Date**: June 2025  
**Scope**: Comprehensive audit found ~30 critical/medium bugs across all layers → 7-phase systematic fix

### Phase 1: Environment Cleanup ✅
- Fixed `.env` files with correct contract address, RPC, keys
- Rewrote `hospital-backend/src/services/blobStorage.js` with local filesystem fallback
- Fixed `requirements.txt` (removed broken multi-modal deps)
- Fixed `hospital-backend/package.json` (corrupted multer version)
- Created `docker-compose.yml` (MongoDB 7)

### Phase 2: Smart Contract Redeploy ✅
- 39/39 tests passing
- Deployed to Sepolia: `0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1` (block 10254150)
- Network initialized: 3 hospitals (Boston, London, Tokyo), oracle set, genesis model published
- All old addresses replaced across 8+ files

### Phase 3: ABI Alignment ✅ (31 mismatch points)
- `blockchainService.js`: Lazy init pattern, fixed all function names, field mappings, scaling (÷100→÷10000)
- `blockchain.js` (hospital): Inline ABI corrected, `setHospitalStatus`, `getNetworkStatistics`
- `models.js` (admin): Route ordering fix, duplicate route removed
- 4 blockchain scripts: Sensitivity/specificity scaling corrected

### Phase 4: Hospital Backend Fixes ✅ (17 issues)
- `encryption.js`: 4× `createCipher` → `createCipheriv`
- `patient.js`: MongoDB `$inc` bug fixed, deprecated options removed
- `ipfs.js`: Upload route rewritten for histopathology only
- `features.js`, `hospital.js`: Multi-modal remnants purged

### Phase 5: Admin Backend Fixes ✅
- `aggregationService.js`: Weighted metrics; upgraded from FedAvg to FedProx aggregation
- Extracted FedProx aggregation script to `admin-backend/src/python/fedprox_aggregation.py`
- Legacy `admin-backend/src/python/fedavg.py` kept for backwards compatibility

### Phase 6: ML Model Verification ✅ (CRITICAL FIX)
- **`inference.py` had completely wrong architecture** (0 key match with checkpoint)
- Rewrote to match training notebook: `FastHistopathologyModel` with correct attention, classifier
- Verified: strict load succeeds, real image inference works (5,927,510 params)

### Phase 7: Integration & Documentation ✅
- Updated 3 `.env` files with correct contract address
- Rewrote `swagger.yml` (histopathology only)
- Updated all parameter counts (5.3M → 5.9M)
- Full revision documented in tasks/ folder
