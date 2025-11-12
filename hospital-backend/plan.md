1. ✅ Upload Patient (DONE)
POST /api/patients/upload
→ Stores encrypted images + metadata in MongoDB
2. ⏭️ Upload to IPFS (NEXT)
POST /api/ipfs/upload-patient/P456789
→ Gets IPFS CIDs for encrypted images
3. ⏭️ Extract Features
POST /api/models/extract-features/P456789
→ Extracts 3,840-dimensional feature vector
4. ⏭️ Repeat Steps 1-3 for 500+ patients
→ Build up training dataset
5. ⏭️ Train Local Model
POST /api/models/train
→ Trains on all collected patient data
6. ⏭️ Upload Models to IPFS
POST /api/ipfs/upload-models
→ Gets IPFS CIDs for model weights
7. ⏭️ Submit to Blockchain
POST /api/blockchain/submit-update
→ Publishes update to Sepolia smart contract
8. ⏭️ Wait for Aggregation
→ Oracle collects updates from 3+ hospitals
→ Publishes new global model
9. ⏭️ Download Global Model
GET /api/blockchain/get-global-model
→ Download and continue training