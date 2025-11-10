# Enhanced Smart Contract - Cross-Hospital Weight Management

## Overview

The **Enhanced FederatedModelRegistry** smart contract has been upgraded to support comprehensive cross-hospital collaboration with advanced weight management, hospital metadata tracking, and model lineage features.

---

## 🆕 What's New in the Enhanced Version

### 1. **Hospital Metadata Management**
- **Hospital Information Storage**: Name, region, registration time, contribution statistics
- **Active/Inactive Status**: Control which hospitals can participate
- **Contribution Tracking**: Track samples and updates per hospital across all rounds

### 2. **Enhanced Weight Management**
- **Separate Extractor Tracking**: Individual CIDs for X-Ray, Histopathology, and Ultrasound extractors
- **Weight Metadata**: Store framework, version, parameter count, and file sizes
- **Model Lineage**: Track parent-child relationships between model versions

### 3. **Improved Security & Validation**
- **Minimum Sample Requirements**: Enforce at least 500 samples per update (configurable)
- **Minimum Hospital Diversity**: Require at least 3 hospitals for federated rounds
- **Accuracy Validation**: Ensure accuracy values don't exceed 100%
- **Active Status Checking**: Prevent inactive hospitals from submitting updates

### 4. **Better Statistics & Querying**
- **Network Statistics**: Aggregate data across all hospitals
- **Hospital Contributions**: View all rounds a hospital participated in
- **Model History**: Complete version lineage tracking
- **Enhanced Events**: More detailed event emissions for monitoring

---

## 📋 Contract Structures

### HospitalInfo
```solidity
struct HospitalInfo {
    string name;                    // e.g., "Boston Medical Center"
    string region;                  // e.g., "North America", "Europe", "Asia"
    uint256 registrationTime;       // Blockchain timestamp
    uint256 totalContributions;     // Number of updates submitted
    uint256 totalSamplesContributed; // Cumulative samples across rounds
    bool isActive;                  // Can participate in training
}
```

### GlobalModel (Enhanced)
```solidity
struct GlobalModel {
    uint256 version;                // 0 = genesis, 1+ = aggregated versions
    string fusionModelCID;          // IPFS CID for fusion model
    bytes32 fusionModelHash;        // SHA-256 hash of fusion model
    string extractorXrayCID;        // IPFS CID for X-Ray extractor
    string extractorHistoCID;       // IPFS CID for Histopathology extractor
    string extractorUltraCID;       // IPFS CID for Ultrasound extractor
    bytes32 extractorsHash;         // Combined hash of all extractors
    uint256 timestamp;              // Publication time
    uint256 totalSamples;           // Total samples from all contributors
    uint256 accuracy;               // Percentage * 100 (e.g., 9550 = 95.50%)
    uint256 contributorCount;       // Number of hospitals that contributed
    uint256 parentVersion;          // Previous model version (lineage)
}
```

### ModelUpdate (Enhanced)
```solidity
struct ModelUpdate {
    address contributor;            // Hospital wallet address
    string fusionModelCID;          // IPFS CID for hospital's fusion model update
    bytes32 fusionModelHash;        // Hash of fusion model
    string extractorWeightsCID;     // IPFS CID for extractor package
    bytes32 extractorsHash;         // Hash of extractor package
    uint256 dataSampleCount;        // Number of samples used
    uint256 localAccuracy;          // Hospital's local model accuracy
    uint256 round;                  // Training round number
    uint256 submissionTime;         // Submission timestamp
    uint256 trainingDuration;       // Training time in seconds
}
```

### WeightMetadata
```solidity
struct WeightMetadata {
    uint256 totalParameters;        // Total model parameters (~14.1M)
    uint256 fusionModelSize;        // Fusion model file size in bytes
    uint256 extractorTotalSize;     // Combined extractor file sizes
    string framework;               // "TensorFlow", "PyTorch", etc.
    string version;                 // Framework version (e.g., "2.15.0")
}
```

---

## 🔧 Key Functions

### Hospital Management

#### `registerParticipant(address, string name, string region)`
Register a new hospital with metadata.

**Example:**
```javascript
await contract.registerParticipant(
    hospitalAddress,
    "Boston Medical Center",
    "North America"
);
```

#### `updateHospitalInfo(address, string name, string region)`
Update hospital metadata.

#### `setHospitalStatus(address, bool isActive)`
Activate or deactivate a hospital.

#### `getHospitalInfo(address) → HospitalInfo`
Get complete hospital information.

#### `getHospitalContributions(address) → uint256[]`
Get array of all rounds a hospital participated in.

---

### Model Weight Submission

#### `submitUpdate(...)`
Submit local model update with enhanced tracking.

**Parameters:**
- `fusionModelCID` - IPFS CID of encrypted fusion model
- `fusionModelHash` - SHA-256 hash of fusion model
- `extractorWeightsCID` - IPFS CID of extractor package
- `extractorsHash` - SHA-256 hash of extractors
- `dataSampleCount` - Number of samples (≥ minSamplesPerUpdate)
- `localAccuracy` - Local accuracy (0-10000 representing 0-100%)
- `trainingDuration` - Training time in seconds

**Example:**
```javascript
await contract.connect(hospital).submitUpdate(
    "QmFusionModelABC123",
    ethers.id("fusion_hash"),
    "QmExtractorsXYZ456",
    ethers.id("extractors_hash"),
    1500,    // 1,500 samples
    9100,    // 91.00% accuracy
    3600     // 1 hour training
);
```

**Automatic Updates:**
- Increments hospital's `totalContributions`
- Adds to hospital's `totalSamplesContributed`
- Records round number in hospital's contribution history
- Emits `UpdateSubmitted` event with accuracy
- Triggers `AggregationRequired` event when threshold met

---

### Global Model Publication

#### `publishNewGlobalModel(...)`
Publish aggregated global model with separate extractor CIDs.

**Parameters:**
- `fusionModelCID` - Aggregated fusion model IPFS CID
- `fusionModelHash` - Fusion model hash
- `extractorXrayCID` - Aggregated X-Ray extractor CID
- `extractorHistoCID` - Aggregated Histopathology extractor CID
- `extractorUltraCID` - Aggregated Ultrasound extractor CID
- `extractorsHash` - Combined extractors hash
- `accuracy` - Global model accuracy (0-10000)

**Example:**
```javascript
await contract.connect(oracle).publishNewGlobalModel(
    "QmGlobalFusionV1",
    ethers.id("global_fusion_hash"),
    "QmGlobalXrayV1",
    "QmGlobalHistoV1",
    "QmGlobalUltraV1",
    ethers.id("global_extractors_hash"),
    9250  // 92.50%
);
```

**Automatic Calculations:**
- Sums `totalSamples` from all round submissions
- Sets `contributorCount` based on number of submissions
- Sets `parentVersion` to previous model version
- Increments `currentRound`

---

### Weight Metadata Management

#### `storeWeightMetadata(...)`
Store technical metadata about model weights.

**Example:**
```javascript
await contract.connect(oracle).storeWeightMetadata(
    1,          // version
    14100000,   // ~14.1M parameters
    8400000,    // ~8.4MB fusion model
    48000000,   // ~48MB extractors
    "TensorFlow",
    "2.15.0"
);
```

#### `getWeightMetadata(uint256 version) → WeightMetadata`
Retrieve metadata for a specific version.

---

### Query Functions

#### `getLatestGlobalModel() → GlobalModel`
Get the most recent published model.

#### `getGlobalModelByVersion(uint256) → GlobalModel`
Get a specific model by version number (0-indexed).

#### `getNetworkStatistics() → (multiple returns)`
Get aggregate statistics:
- `totalHospitals` - Total registered hospitals
- `activeHospitals` - Currently active hospitals
- `totalContributions` - Total submissions across all rounds
- `totalSamples` - Total samples across all hospitals
- `currentRoundNumber` - Current training round
- `modelsPublished` - Total models published

#### `getModelLineage(uint256 version) → uint256[]`
Get array showing model version ancestry (version → parent → grandparent → ...).

#### `getUpdatesForRound(uint256) → ModelUpdate[]`
Get all updates submitted in a specific round.

#### `getUpdateByIndex(uint256 round, uint256 index) → ModelUpdate`
Get a specific update from a round.

---

### Admin Functions

#### `setMinSamplesPerUpdate(uint256)`
Set minimum samples required per update (≥ 100).

**Example:**
```javascript
await contract.setMinSamplesPerUpdate(1000); // Require 1,000 samples
```

#### `setRequiredSubmissions(uint256)`
Set minimum hospitals required per round (≥ 3).

#### `pause()` / `unpause()`
Emergency pause/unpause contract operations.

---

## 🚀 Deployment

### Updated Constructor

```javascript
constructor(uint256 _requiredSubmissions, uint256 _minSamples)
```

**Requirements:**
- `_requiredSubmissions` ≥ 3 (diversity requirement)
- `_minSamples` ≥ 100 (data quality requirement)

**Example Deployment:**
```javascript
const FederatedModelRegistry = await ethers.getContractFactory("FederatedModelRegistry");
const contract = await FederatedModelRegistry.deploy(
    3,    // Require 3 hospitals minimum
    500   // Require 500 samples per update
);
```

---

## 📊 Complete Workflow Example

### Step 1: Deploy Contract
```javascript
const contract = await FederatedModelRegistry.deploy(3, 500);
```

### Step 2: Register Hospitals
```javascript
await contract.registerParticipant(
    hospital1.address,
    "Boston Medical Center",
    "North America"
);

await contract.registerParticipant(
    hospital2.address,
    "London Healthcare Trust",
    "Europe"
);

await contract.registerParticipant(
    hospital3.address,
    "Tokyo Cancer Institute",
    "Asia"
);
```

### Step 3: Set Oracle
```javascript
await contract.setOracleAddress(oracleAddress);
```

### Step 4: Initialize Genesis Model
```javascript
await contract.initializeGenesisModel(
    "QmGenesisFusion",
    ethers.id("genesis_fusion_hash"),
    "QmGenesisXray",
    "QmGenesisHisto",
    "QmGenesisUltra",
    ethers.id("genesis_extractors_hash")
);
```

### Step 5: Hospitals Submit Updates
```javascript
// Hospital 1
await contract.connect(hospital1).submitUpdate(
    "QmH1Fusion_R0",
    ethers.id("h1_fusion"),
    "QmH1Extractors_R0",
    ethers.id("h1_extractors"),
    1500,  // samples
    9100,  // 91% accuracy
    3600   // 1 hour
);

// Hospital 2
await contract.connect(hospital2).submitUpdate(
    "QmH2Fusion_R0",
    ethers.id("h2_fusion"),
    "QmH2Extractors_R0",
    ethers.id("h2_extractors"),
    600,   // samples
    8700,  // 87% accuracy
    2400   // 40 minutes
);

// Hospital 3
await contract.connect(hospital3).submitUpdate(
    "QmH3Fusion_R0",
    ethers.id("h3_fusion"),
    "QmH3Extractors_R0",
    ethers.id("h3_extractors"),
    2000,  // samples
    9300,  // 93% accuracy
    5400   // 1.5 hours
);
```

### Step 6: Oracle Aggregates and Publishes
```javascript
await contract.connect(oracle).publishNewGlobalModel(
    "QmGlobalFusion_V1",
    ethers.id("global_fusion"),
    "QmGlobalXray_V1",
    "QmGlobalHisto_V1",
    "QmGlobalUltra_V1",
    ethers.id("global_extractors"),
    9250  // 92.5% weighted average accuracy
);
```

### Step 7: Store Metadata
```javascript
await contract.connect(oracle).storeWeightMetadata(
    1,          // version 1
    14100000,   // parameters
    8400000,    // fusion size
    48000000,   // extractors size
    "TensorFlow",
    "2.15.0"
);
```

### Step 8: Query Results
```javascript
// Get latest model
const latestModel = await contract.getLatestGlobalModel();
console.log("Version:", latestModel.version.toString());
console.log("Accuracy:", (Number(latestModel.accuracy) / 100).toFixed(2) + "%");
console.log("Total Samples:", latestModel.totalSamples.toString());
console.log("Contributors:", latestModel.contributorCount.toString());

// Get network stats
const stats = await contract.getNetworkStatistics();
console.log("Active Hospitals:", stats.activeHospitals.toString());
console.log("Total Contributions:", stats.totalContributions.toString());

// Get hospital info
const h1Info = await contract.getHospitalInfo(hospital1.address);
console.log("Hospital:", h1Info.name);
console.log("Region:", h1Info.region);
console.log("Contributions:", h1Info.totalContributions.toString());
console.log("Total Samples:", h1Info.totalSamplesContributed.toString());
```

---

## 📈 Model Weights Storage on IPFS

### What Gets Stored

#### Per Hospital (Local Training)
```
hospital1/
├── fusion_model_round0.h5        → Upload to IPFS → QmH1Fusion_R0
├── extractor_xray_round0.h5      ┐
├── extractor_histo_round0.h5     │→ Package & Upload → QmH1Extractors_R0
└── extractor_ultra_round0.h5     ┘
```

#### Global Model (After Aggregation)
```
global/
├── fusion_model_v1.h5            → Upload to IPFS → QmGlobalFusion_V1
├── extractor_xray_v1.h5          → Upload to IPFS → QmGlobalXray_V1
├── extractor_histo_v1.h5         → Upload to IPFS → QmGlobalHisto_V1
└── extractor_ultra_v1.h5         → Upload to IPFS → QmGlobalUltra_V1
```

### Blockchain Storage (Per Model Version)
```javascript
GlobalModel {
    version: 1,
    fusionModelCID: "QmGlobalFusion_V1",
    fusionModelHash: "0x1a2b3c...",
    extractorXrayCID: "QmGlobalXray_V1",
    extractorHistoCID: "QmGlobalHisto_V1",
    extractorUltraCID: "QmGlobalUltra_V1",
    extractorsHash: "0x4d5e6f...",
    totalSamples: 4100,
    accuracy: 9250,  // 92.50%
    contributorCount: 3
}
```

---

## 🔒 Security Features

1. **Role-Based Access Control**
   - Owner: Register hospitals, set oracle, configure parameters
   - Oracle: Publish models, store metadata
   - Hospitals: Submit updates (only when active)

2. **Validation Checks**
   - Minimum 3 hospitals for diversity
   - Minimum sample counts enforced
   - Accuracy cannot exceed 100%
   - No duplicate submissions per round
   - Active status required for participation

3. **Pausable Operations**
   - Emergency pause/unpause capability
   - Prevents submissions during maintenance

4. **Reentrancy Protection**
   - NonReentrant modifier on sensitive functions

5. **Hash Verification**
   - All weights include SHA-256 hashes
   - Ensures data integrity

---

## 🎯 Use Cases Supported

✅ **Multi-Hospital Collaboration** - Track contributions from 3+ diverse hospitals  
✅ **Weight Version Management** - Complete history of all model versions  
✅ **Performance Tracking** - Compare local vs global accuracies  
✅ **Geographic Diversity** - Track hospital regions for demographic coverage  
✅ **Contribution Auditing** - Full transparency of who contributed what  
✅ **Model Lineage** - Trace evolution from genesis to current version  
✅ **Quality Control** - Enforce minimum standards for samples and diversity  

---

## 📝 Event Emissions

All events now include enhanced information:

```solidity
event ParticipantRegistered(address indexed participant, string name, string region);
event UpdateSubmitted(address indexed contributor, uint256 indexed round, uint256 sampleCount, uint256 accuracy);
event NewGlobalModel(uint256 indexed version, string fusionCID, uint256 accuracy, uint256 contributorCount);
event WeightMetadataStored(uint256 indexed version, uint256 totalParameters);
```

---

## ✅ Testing

Run the comprehensive test suite:

```bash
npx hardhat test test/FederatedModelRegistry.enhanced.test.js
```

**Test Coverage:**
- ✅ 33 passing tests
- ✅ Deployment validation
- ✅ Hospital registration and management
- ✅ Model update submission with validation
- ✅ Global model publication
- ✅ Weight metadata storage
- ✅ Query functions
- ✅ Admin controls
- ✅ Genesis model initialization

---

## 🚀 Next Steps

1. **Deploy to Sepolia Testnet**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

2. **Run Hospital Interaction Demo**
   ```bash
   export CONTRACT_ADDRESS=0x...
   npx hardhat run scripts/hospitalInteraction.js --network sepolia
   ```

3. **Integrate with ML Training Pipeline**
   - Use `PATIENT_DATA_FEATURES.md` for feature extraction
   - Upload weights to IPFS
   - Submit updates via contract

4. **Monitor Network Statistics**
   - Query `getNetworkStatistics()` regularly
   - Track hospital contributions
   - Monitor model evolution

---

## 📚 Related Documentation

- `/docs/USE_CASES.md` - Why multiple hospitals and diversity matter
- `/docs/PATIENT_DATA_FEATURES.md` - Feature extraction and weight conversion
- `/README.md` - Overall project documentation
- `/SETUP_GUIDE.md` - Step-by-step deployment guide

---

**🎉 The enhanced contract is ready for cross-hospital federated learning with comprehensive weight management!**
