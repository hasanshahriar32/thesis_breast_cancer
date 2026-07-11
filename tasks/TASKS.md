# Task List — Full Architecture Revision

## Current Status

**Last Updated**: February 14, 2026  
**Revision Reason**: ~30 critical/medium bugs found across all layers  
**Approach**: Fresh redeploy + systematic bug fixes in 7 phases

**Available Test Data**: 82 histopathology images
- train_folder: 24 images
- monuseg_test_folder: 8 images  
- TNBC_test_folder: 50 images

---

## ✅ Previously Completed (Pre-Revision)

- [x] EfficientNet-B0 + Coordinate Attention model trained
- [x] FederatedModelRegistry smart contract written (39 tests pass)
- [x] Admin backend scaffolding (Express, Swagger, routes)
- [x] Hospital backend scaffolding (Express, Swagger, routes)
- [x] Initial deployment to Sepolia

---

## Revision Progress

### Phase 1: Clean Environment & Dependencies ✅
See: [PHASE1_ENVIRONMENT.md](PHASE1_ENVIRONMENT.md)
- [x] Fix .env.example files
- [x] Fix requirements.txt (TensorFlow → PyTorch)
- [x] Clean hospital-backend dependencies
- [x] Create docker-compose.yml (MongoDB)
- [x] Add local filesystem storage fallback

### Phase 2: Smart Contract Redeploy ✅
See: [PHASE2_CONTRACT.md](PHASE2_CONTRACT.md)
- [x] Verify tests pass (39/39)
- [x] Redeploy to Sepolia: `0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1`
- [x] Initialize network (3 hospitals, oracle, genesis model)
- [x] Update all contract addresses

### Phase 3: ABI Alignment ✅
See: [PHASE3_ABI_ALIGNMENT.md](PHASE3_ABI_ALIGNMENT.md)
- [x] Fixed blockchainService.js: 15 bugs (wrong functions, wrong fields, wrong scaling, lazy init)
- [x] Fixed hospital blockchain.js: 11 bugs (inline ABI, struct fields, scaling)
- [x] Verified ABI already matches artifacts (no copy needed)
- [x] Fixed 3 blockchain scripts + route ordering in models.js

### Phase 4: Hospital Backend Fixes ✅
See: [PHASE4_HOSPITAL_FIXES.md](PHASE4_HOSPITAL_FIXES.md)
- [x] Fixed encryption.js (4× createCipher → createCipheriv)
- [x] Fixed MongoDB $inc bug (2 locations) + deprecated options
- [x] Fixed IPFS upload: buffer → file path in models.js
- [x] Purged multi-modal remnants (features.js, hospital.js, ipfs.js)

### Phase 5: Admin Backend Fixes ✅
See: [PHASE5_ADMIN_FIXES.md](PHASE5_ADMIN_FIXES.md)
- [x] Route ordering fixed (in Phase 3)
- [x] aggregationService.js: weighted metrics, extracted FedAvg script

### Phase 6: ML Model Verification ✅
See: [PHASE6_ML_VERIFY.md](PHASE6_ML_VERIFY.md)
- [x] Verified checkpoint: raw OrderedDict, 738 layers, 5.9M unique params
- [x] **CRITICAL FIX**: Rewrote inference.py — architecture was completely wrong (0 key match)
- [x] End-to-end inference test passed on real histopathology image
- [x] FedAvg script compatibility verified (handles both raw and wrapped formats)

### Phase 7: Integration & Docs ✅
See: [PHASE7_INTEGRATION.md](PHASE7_INTEGRATION.md)
- [x] Fixed 3 `.env` files with old/placeholder contract addresses
- [x] Rewrote swagger.yml (histopathology only, removed xray/ultrasound)
- [x] Updated COMPLETED_WORK.md with full 7-phase revision docs
- [x] All parameter counts corrected (5.3M → 5.9M)

---

## 📝 Notes

### Contract Deployment Info
- **Network**: Sepolia Testnet
- **Old Address**: `0x95a09089002398669Fa2470c1B3552898995B706` (retired)
- **New Address**: `0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1` ✅
- **Owner**: `0x8cc0861616B52b115EAa64C1c8313AfdC4fF1d42`
- **Block**: 10254150
