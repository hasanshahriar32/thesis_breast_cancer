# Phase 1: Clean Environment & Dependencies

**Status**: ✅ Completed  
**Started**: February 14, 2026  
**Completed**: February 14, 2026

---

## Tasks

### 1.1 Create .env.example Files
- [x] admin-backend/.env.example — all required env vars
- [x] hospital-backend/.env.example — all required env vars

### 1.2 Fix Root requirements.txt
- [x] Replace TensorFlow/Keras with PyTorch/torchvision
- [x] Keep only relevant Python dependencies

### 1.3 Clean hospital-backend/package.json
- [x] Remove `@tensorflow/tfjs-node` (unused — project uses PyTorch)
- [x] Remove `bcryptjs` (unused)
- [x] Remove `jsonwebtoken` (unused)
- [x] Remove `joi` (unused)
- [x] Remove `node-cron` (unused)
- [x] Remove `node-fetch` (unused)
- [x] Remove `sharp` (unused)
- [x] Remove `jimp` (unused)
- [x] Remove `crypto` npm package (deprecated — built into Node.js)
- [x] Add `mongodb` native driver explicitly

### 1.4 Create docker-compose.yml
- [x] MongoDB service for local development
- [x] Volume persistence

### 1.5 Add Local Filesystem Storage Fallback
- [x] Rewrite blobStorage.js to use local uploads/ dir when VERCEL_BLOB_TOKEN is not set
- [x] Simplify to single-modality (histopathology only)

---

## Issues Fixed

| # | Bug | File | Fix |
|---|-----|------|-----|
| 1 | Root requirements.txt lists TensorFlow/Keras instead of PyTorch | requirements.txt | Replaced with torch, torchvision |
| 2 | 7 unused npm packages in hospital-backend | hospital-backend/package.json | Removed |
| 3 | `crypto` npm package deprecated (Node.js built-in) | hospital-backend/package.json | Removed |
| 4 | `mongodb` native driver used in code but not in dependencies | hospital-backend/package.json | Added |
| 5 | No .env.example files exist | Both backends | Created |
| 6 | No MongoDB setup instructions | Project root | docker-compose.yml created |
| 7 | Hard dependency on Vercel Blob Storage | hospital-backend blobStorage.js | Added local FS fallback |
| 8 | Multi-modal code in blobStorage.js | hospital-backend blobStorage.js | Simplified to histopathology only |
