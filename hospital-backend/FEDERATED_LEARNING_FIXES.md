# Feature Extraction & Federated Learning - CRITICAL FIXES NEEDED

## Current Status: ❌ NOT COMPATIBLE with Federated Learning

### Issues Identified:

1. **File-based vs Buffer-based Extraction**
   - ❌ Current: Reads from disk files
   - ✅ Required: Must read from Vercel Blob URLs (encrypted buffers)

2. **Model Loading**
   - ❌ Current: Models in wrong location or using mocks
   - ✅ Required: Must load from `/Model/extractor_*.h5` and `/Model/fusion_model.h5`

3. **Training Dataset Accumulation**
   - ❌ Current: Features extracted per patient, not stored for batch training
   - ✅ Required: Accumulate 500+ patients' features for training

4. **No Training Endpoint**
   - ❌ Missing: POST /api/models/train
   - ✅ Required: Train fusion model on accumulated features

---

## Recommended Architecture:

```
Step 1: Upload Patient
├── Upload images → Vercel Blob (encrypted)
├── Store metadata → MongoDB
└── ✅ DONE

Step 2: Upload to IPFS  
├── Download from Vercel Blob
├── Upload encrypted to IPFS
└── Store CID in MongoDB
└── ✅ WORKS

Step 3: Extract Features [NEEDS FIX]
├── Download encrypted buffer from Vercel Blob ✅
├── Decrypt buffer ✅
├── Extract 3,840-dim features using REAL models ❌ BROKEN
├── Store features in MongoDB ❌ MISSING
└── Return interpretable feature breakdown ✅

Step 4: Accumulate Training Data [MISSING]
├── Collect features from 500+ patients
├── Store in training_data collection
└── Prepare for local training

Step 5: Train Local Model [MISSING]
├── Load global model from blockchain
├── Load accumulated features (500+ patients)
├── Train fusion_model.h5 locally
├── Save updated weights
└── Calculate metrics

Step 6: Upload to IPFS
├── Upload updated fusion_model.h5
└── Get IPFS CID

Step 7: Submit to Blockchain
└── Submit CID + metrics
```

---

## Action Items:

### 1. Fix Feature Extraction Service
**File:** `/src/services/featureExtractor.js`

**Changes Needed:**
```javascript
// MUST load real models from correct path
const modelPath = path.join(__dirname, '../../Model');
this.models.xray = await tf.loadLayersModel(`file://${modelPath}/extractor_xray.h5`);
this.models.histo = await tf.loadLayersModel(`file://${modelPath}/extractor_histo.h5`);
this.models.ultra = await tf.loadLayersModel(`file://${modelPath}/extractor_ultra.h5`);
this.models.fusion = await tf.loadLayersModel(`file://${modelPath}/fusion_model.h5`);

// MUST extract from Vercel Blob URLs (not disk files)
async extractFromVercelBlob(blobUrl, modality) {
  // 1. Download encrypted file
  const response = await axios.get(blobUrl, { responseType: 'arraybuffer' });
  const encryptedBuffer = Buffer.from(response.data);
  
  // 2. Decrypt
  const decryptedBuffer = await encryptionService.decryptBuffer(encryptedBuffer);
  
  // 3. Extract features
  const tensor = this.preprocessImage(decryptedBuffer, modality);
  const features = this.models[modality].predict(tensor);
  
  return Array.from(await features.data());
}
```

### 2. Create Training Data Accumulation
**New Collection:** `training_data`

**Schema:**
```javascript
{
  patient_id: String,
  features: {
    xray: [1280 numbers],
    histo: [1280 numbers],
    ultra: [1280 numbers],
    combined: [3840 numbers]
  },
  label: Number, // 0 = benign, 1 = malignant
  extracted_at: Date,
  hospital_id: String
}
```

### 3. Create Training Endpoint
**New Route:** `POST /api/models/train`

**Logic:**
```javascript
router.post('/train', async (req, res) => {
  // 1. Load all accumulated training data
  const trainingData = await db.collection('training_data').find({
    hospital_id: process.env.HOSPITAL_ID
  }).toArray();
  
  if (trainingData.length < 100) {
    return res.status(400).json({
      error: 'Need at least 100 patients for training',
      current: trainingData.length
    });
  }
  
  // 2. Prepare tensors
  const X_train = trainingData.map(d => d.features.combined);
  const y_train = trainingData.map(d => d.label);
  
  // 3. Load fusion model
  const fusionModel = await tf.loadLayersModel('file://Model/fusion_model.h5');
  
  // 4. Train
  const history = await fusionModel.fit(
    tf.tensor2d(X_train),
    tf.tensor2d(y_train, [y_train.length, 1]),
    {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          logger.info(`Epoch ${epoch}: loss=${logs.loss}, acc=${logs.acc}`);
        }
      }
    }
  );
  
  // 5. Save updated model
  await fusionModel.save('file://Model/fusion_model_updated.h5');
  
  // 6. Return metrics
  res.json({
    success: true,
    samples_used: trainingData.length,
    final_accuracy: history.history.acc[history.history.acc.length - 1],
    final_loss: history.history.loss[history.history.loss.length - 1],
    epochs_trained: history.history.acc.length
  });
});
```

### 4. Update Extract Features Endpoint
**Changes to:** `POST /api/models/extract-features/:patientId`

**Add:**
```javascript
// After extracting features...

// Save to training_data collection
await db.collection('training_data').insertOne({
  patient_id: patientId,
  features: {
    xray: xrayFeatures,
    histo: histoFeatures,
    ultra: ultraFeatures,
    combined: [...xrayFeatures, ...histoFeatures, ...ultraFeatures]
  },
  label: patient.metadata.diagnosis === 'malignant' ? 1 : 0,
  extracted_at: new Date(),
  hospital_id: process.env.HOSPITAL_ID
});
```

---

## Testing Checklist:

- [ ] 1. Verify models load from `/Model/` directory
- [ ] 2. Test feature extraction from Vercel Blob URL
- [ ] 3. Confirm features are 3,840 dimensions
- [ ] 4. Verify features saved to training_data collection
- [ ] 5. Extract features for 100+ patients
- [ ] 6. Test training endpoint with accumulated data
- [ ] 7. Verify model weights update
- [ ] 8. Test IPFS upload of updated model
- [ ] 9. Test blockchain submission

---

## Next Steps:

1. ✅ Fix model loading paths
2. ✅ Implement Vercel Blob → feature extraction
3. ✅ Create training_data collection
4. ✅ Add training endpoint
5. ✅ Test end-to-end flow with 100 patients
6. ✅ Integrate with blockchain submission
