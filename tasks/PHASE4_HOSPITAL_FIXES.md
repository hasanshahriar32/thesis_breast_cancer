# Phase 4: Hospital Backend Bug Fixes

**Status**: ✅ Completed  
**Depends on**: Phase 3  
**Completed**: February 14, 2026

---

## Tasks

### 4.1 Fix encryption.js ✅
- [x] `createCipher()` → `createCipheriv()` in `encryptText()` ✅
- [x] `createDecipher()` → `createDecipheriv()` in `decryptText()` ✅
- [x] `createCipher()` → `createCipheriv()` in `encryptModelWeights()` ✅
- [x] `createDecipher()` → `createDecipheriv()` in `decryptModelWeights()` ✅
- [x] Note: `encryptBuffer()`/`decryptBuffer()` were already correct

### 4.2 Fix MongoDB Bugs ✅
- [x] Fixed `$inc` nested inside `$set` in `updatePatientFeatures()` — separated to top-level operators ✅
- [x] Fixed `$inc` nested inside `$set` in `updatePatient()` — separated to top-level operators ✅
- [x] Removed deprecated `useNewUrlParser`/`useUnifiedTopology` from MongoDB client options ✅

### 4.3 Fix IPFS Upload ✅
- [x] Fixed `ipfsService.uploadFile()` in models.js — now passes file path instead of buffer ✅
- [x] Added proper options object as second argument ✅

### 4.4 Purge Multi-Modal Remnants ✅
- [x] features.js — default modalities changed from ['xray','histopathology','ultrasound'] to ['histopathology'] ✅
- [x] features.js — status endpoint: single modality, removed 3840 combined dimensions ✅
- [x] features.js — categories: removed vascular_imaging, doppler_flow, echo_texture ✅
- [x] hospital.js — capabilities modalities changed to ['histopathology'] only ✅
- [x] ipfs.js — completely rewrote upload-patient route: removed xray/ultrasound upload blocks, validation now only checks histopathology, added local filesystem fallback, MongoDB update only sets histopathology CID ✅

---

## Bugs Fixed: 17 issues

| # | Bug | Severity | File | Status |
|---|-----|----------|------|--------|
| 1 | `createCipher()` removed in Node.js 22 | 🔴 Critical | encryption.js | ✅ |
| 2 | `createDecipher()` removed in Node.js 22 | 🔴 Critical | encryption.js | ✅ |
| 3 | `$inc` inside `$set` in updatePatientFeatures | 🔴 Critical | patient.js | ✅ |
| 4 | `$inc` inside `$set` in updatePatient | 🔴 Critical | patient.js | ✅ |
| 5 | Deprecated MongoDB connection options | 🟡 Medium | patient.js | ✅ |
| 6 | IPFS upload: buffer vs file path mismatch | 🔴 Critical | models.js | ✅ |
| 7 | IPFS upload requires xray+ultrasound (always fails) | 🔴 Critical | ipfs.js | ✅ |
| 8 | Uploads non-existent xray/ultrasound files | 🔴 Critical | ipfs.js | ✅ |
| 9 | Default modalities include xray/ultrasound | 🟡 Medium | features.js | ✅ |
| 10 | Status lists 3 modalities + 3840 dimensions | 🟡 Medium | features.js | ✅ |
| 11 | Categories include ultrasound-specific items | 🟡 Low | features.js | ✅ |
| 12 | Capabilities lists 3 modalities | 🟡 Low | hospital.js | ✅ |
