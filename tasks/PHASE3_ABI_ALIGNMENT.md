# Phase 3: ABI Alignment (Critical Bug Fixes)

**Status**: ✅ Completed  
**Depends on**: Phase 2  
**Completed**: February 14, 2026

---

## Tasks

### 3.1 Update Admin Backend ABI
- [x] Verified: ABI in admin-backend/src/config/contractABI.json already matches compiled artifacts (identical) ✅

### 3.2 Fix admin-backend/src/services/blockchainService.js
- [x] `getParticipantCount()` → `getParticipants()` (returns array, use `.length`) ✅
- [x] `pendingUpdatesCount()` → `getCurrentRoundSubmissions()` ✅
- [x] Fix `getPendingUpdates()` field mappings: `hospital`→`contributor`, `accuracy`→`localAccuracy`, `loss`→removed, `timestamp`→`submissionTime`, `notes`→removed; added `localAUC`, `localSensitivity`, `localSpecificity`, `trainingDuration` ✅
- [x] Fix sensitivity/specificity scaling: divide by `10000` not `100` in `formatGlobalModel()` ✅
- [x] Fix sensitivity/specificity scaling in `publishGlobalModel()`: multiply by `10000` not `100` ✅
- [x] Wrap initialization in lazy `connect()` / `_ensureConnected()` pattern ✅
- [x] Added `_ensureConnected()` to all 18+ methods that use `this.contract` ✅

### 3.3 Fix hospital-backend/src/routes/blockchain.js Inline ABI
- [x] `setHospitalActive` → `setHospitalStatus` ✅
- [x] `getNetworkStats` (5 returns) → `getNetworkStatistics` (6 returns, added totalContributions and modelsPublished) ✅
- [x] Fixed `submitUpdate` parameter names to match contract ✅
- [x] Fixed `getLatestGlobalModel` tuple — corrected field order, added `parentVersion` ✅
- [x] Fixed `getHospitalInfo` tuple — removed `hospitalAddress`, `averageAccuracy`, `lastContributionTime`; added `registrationTime`, `totalSamplesContributed` ✅
- [x] Fixed `getHospitalInfo` route: removed references to non-existent struct fields ✅
- [x] Fixed `getNetworkStatistics` route: correct field destructuring (6 values) ✅
- [x] Fixed sensitivity/specificity scaling: `/ 10000` not `/ 100` in latest-model route ✅

### 3.4 Fix Blockchain Scripts Scaling
- [x] Fixed `hospitalInteraction.js`: sensitivity/specificity `/ 10000 * 100` ✅
- [x] Fixed `submitUpdate.js`: sensitivity/specificity `/ 10000 * 100` ✅
- [x] Fixed `interact.js`: sensitivity/specificity `/ 10000 * 100` ✅
- [x] Fixed `fixGenesisIPFS.js`: `pendingUpdatesCount()` → `getCurrentRoundSubmissions()` ✅

### 3.5 Fix Route Ordering (Admin Backend)
- [x] Moved `/models/history` BEFORE `/:version` to prevent param capture ✅
- [x] Added `isNaN` validation to `/:version` parameter ✅
- [x] Verified `/models/latest` was already before `/:version` ✅
- [x] Verified IPFS `/status` already before `/:cid` ✅

### 3.6 Fix aggregationService.js
- [x] Updated comments to clarify input scaling expectations ✅

---

## Bugs Fixed: 31 mismatch points across 7 files

| # | Bug | Severity | File | Status |
|---|-----|----------|------|--------|
| 1 | `getParticipantCount()` doesn't exist | 🔴 Critical | blockchainService.js | ✅ |
| 2 | `pendingUpdatesCount()` doesn't exist | 🔴 Critical | blockchainService.js | ✅ |
| 3 | Wrong field names in ModelUpdate mapping | 🔴 Critical | blockchainService.js | ✅ |
| 4 | Sensitivity/Specificity ÷100 instead of ÷10000 | 🔴 Critical | blockchainService.js | ✅ |
| 5 | Sensitivity/Specificity ×100 instead of ×10000 | 🔴 Critical | blockchainService.js | ✅ |
| 6 | Inline ABI `setHospitalActive` wrong name | 🔴 Critical | blockchain.js | ✅ |
| 7 | Inline ABI `getNetworkStats` wrong name + returns | 🔴 Critical | blockchain.js | ✅ |
| 8 | HospitalInfo tuple fields don't match struct | 🔴 Critical | blockchain.js | ✅ |
| 9 | GlobalModel tuple missing `parentVersion` | 🟡 Medium | blockchain.js | ✅ |
| 10 | Constructor crashes if env vars missing | 🟡 Medium | blockchainService.js | ✅ |
| 11 | Route ordering: `/history` caught by `/:version` | 🟡 Medium | models.js | ✅ |
| 12 | Scaling bugs in blockchain scripts | 🟡 Medium | 3 script files | ✅ |
