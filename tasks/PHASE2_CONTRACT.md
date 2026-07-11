# Phase 2: Smart Contract Redeploy

**Status**: ✅ Completed  
**Depends on**: Phase 1  
**Completed**: February 14, 2026

---

## Tasks

### 2.1 Verify Smart Contract Tests
- [x] Run `npx hardhat test` — 39/39 pass ✅
- [x] Contract code reviewed, no changes needed

### 2.2 Redeploy to Sepolia
- [x] Deployed to: `0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1`
- [x] Block: 10254150
- [x] deployment-info.json updated automatically

### 2.3 Initialize Network
- [x] Genesis model uploaded to IPFS: `QmW4CN7kJcKniWTG5byWfCoKuwfsCN2Cti4bYbmNtruzWw`
- [x] 3 hospitals registered (Boston, London, Tokyo)
- [x] Oracle set to owner address
- [x] Genesis model initialized on-chain
- [x] network-init-info.json updated

### 2.4 Update Contract Address Everywhere
- [x] README.md
- [x] hospital-backend/README.md
- [x] docs/COMPLETED_WORK.md
- [x] tasks/TASKS.md
- [x] test-data blockchain_submission.json (x3)
- [x] simulation_scripts/simulate_blockchain_submission.py

---

## Notes
- Current contract at `0x95a09089002398669Fa2470c1B3552898995B706` has test data — not worth preserving
- Will need Sepolia ETH in deployer wallet
