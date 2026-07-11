# Phase 5: Admin Backend Bug Fixes

**Status**: ✅ Completed  
**Depends on**: Phase 3  
**Completed**: February 14, 2026

---

## Tasks

### 5.1 Fix Route Ordering ✅ (Done in Phase 3)
- [x] models.js — moved `/latest` and `/history` BEFORE `/:version` ✅
- [x] ipfs.js — `/status` already before `/:cid` (no change needed) ✅

### 5.2 Fix aggregationService.js ✅
- [x] Replaced hardcoded placeholder metrics (0.85, 0.87, 0.83) with weighted-average from submissions ✅
- [x] Added `auc`, `sensitivity`, `specificity` to downloadedModels data ✅
- [x] Computed `weightedAUC`, `weightedSensitivity`, `weightedSpecificity` alongside accuracy ✅
- [x] Fixed comments to clarify scaling expectations for publishGlobalModel ✅
- [x] Extracted inline Python FedAvg script to `admin-backend/src/python/fedavg.py` ✅
- [x] Added `weights_only=True` to torch.load for security ✅

---

## Bugs Fixed

| # | Bug | Severity | File | Status |
|---|-----|----------|------|--------|
| 1 | `/history` caught by `/:version` route | 🟡 Medium | routes/models.js | ✅ (Phase 3) |
| 2 | Hardcoded placeholder aggregation metrics | 🟡 Medium | aggregationService.js | ✅ |
| 3 | Missing AUC/sensitivity/specificity in downloaded models | 🟡 Medium | aggregationService.js | ✅ |
| 4 | FedAvg Python script only as inline string | 🟡 Medium | aggregationService.js | ✅ |
