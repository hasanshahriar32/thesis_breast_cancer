# Enhanced Smart Contract Guide - Histopathology Classification

## Overview

The **FederatedModelRegistry** smart contract coordinates privacy-preserving federated learning for **histopathology-based breast cancer classification** using **EfficientNet-B0 with Coordinate Attention**.

---

## Model Architecture

| Property | Value |
|----------|-------|
| Backbone | EfficientNet-B0 |
| Attention | Coordinate Attention |
| Task | Binary Classification |
| Classes | Benign (0), Malignant (1) |
| Input Size | 160×160 RGB |
| Parameters | ~5.9 million |
| Framework | PyTorch 2.0+ |

---

## Contract Structures

### HospitalInfo

```solidity
struct HospitalInfo {
    string name;                    // e.g., "Boston Medical Center"
    string region;                  // e.g., "North America"
    uint256 registrationTime;       // Blockchain timestamp
    uint256 totalContributions;     // Number of updates submitted
    uint256 totalSamplesContributed; // Cumulative histopathology samples
    bool isActive;                  // Can participate in training
}
```

### GlobalModel

```solidity
struct GlobalModel {
    uint256 version;                // 0 = genesis, 1+ = aggregated
    string modelWeightsCID;         // IPFS CID for EfficientNet-B0 weights
    bytes32 modelHash;              // SHA-256 hash for verification
    uint256 timestamp;              // Publication time
    uint256 totalSamples;           // Total histopathology samples
    uint256 accuracy;               // Percentage × 100 (9550 = 95.50%)
    uint256 aucScore;               // AUC × 10000 (9800 = 0.9800)
    uint256 sensitivity;            // Sensitivity × 10000
    uint256 specificity;            // Specificity × 10000
    uint256 contributorCount;       // Number of contributing hospitals
    uint256 parentVersion;          // Previous model version (lineage)
}
```

### ModelUpdate

```solidity
struct ModelUpdate {
    address contributor;            // Hospital wallet address
    string modelWeightsCID;         // IPFS CID for hospital's model
    bytes32 modelHash;              // Hash of model weights
    uint256 dataSampleCount;        // Number of histopathology samples
    uint256 localAccuracy;          // Hospital's accuracy × 100
    uint256 localAUC;               // Hospital's AUC × 10000
    uint256 localSensitivity;       // Sensitivity × 10000
    uint256 localSpecificity;       // Specificity × 10000
    uint256 round;                  // Training round number
    uint256 submissionTime;         // Submission timestamp
    uint256 trainingDuration;       // Training time in seconds
}
```

### WeightMetadata

```solidity
struct WeightMetadata {
    uint256 totalParameters;        // ~5.9M for EfficientNet-B0
    uint256 modelSize;              // Model file size in bytes
    uint256 inputSize;              // 160 for 160×160
    string framework;               // "PyTorch"
    string version;                 // "2.0.0"
    string architecture;            // "EfficientNet-B0 + CoordinateAttention"
}
```

---

## Key Functions

### Hospital Management

#### registerParticipant

```javascript
await contract.registerParticipant(
    hospitalAddress,
    "Boston Medical Center",
    "North America"
);
```

#### updateHospitalInfo

```javascript
await contract.updateHospitalInfo(
    hospitalAddress,
    "New Hospital Name",
    "New Region"
);
```

#### setHospitalStatus

```javascript
await contract.setHospitalStatus(hospitalAddress, true); // Activate
await contract.setHospitalStatus(hospitalAddress, false); // Deactivate
```

---

### Model Submission

#### submitUpdate

Submit local EfficientNet-B0 model training results.

```javascript
await contract.connect(hospital).submitUpdate(
    "QmModelWeightsCID123",           // IPFS CID
    ethers.id("model_hash"),          // SHA-256 hash
    1500,                             // Histopathology samples
    9378,                             // 93.78% accuracy
    9650,                             // 0.9650 AUC
    9400,                             // 94% sensitivity
    9300,                             // 93% specificity
    3600                              // 1 hour training
);
```

**Validations:**
- Hospital must be registered and active
- Sample count ≥ minSamplesPerUpdate (default: 500)
- All metrics ≤ 10000 (100%)
- No duplicate submissions per round

---

### Global Model Publication

#### publishNewGlobalModel

Oracle publishes aggregated model after FedAvg.

```javascript
await contract.connect(oracle).publishNewGlobalModel(
    "QmAggregatedModelCID456",
    ethers.id("global_hash"),
    9350,                             // 93.50% global accuracy
    9600,                             // 0.9600 global AUC
    9400,                             // 94% global sensitivity
    9233                              // 92.33% global specificity
);
```

---

### Weight Metadata

#### storeWeightMetadata

```javascript
await contract.connect(oracle).storeWeightMetadata(
    1,                                // version
    5900000,                          // 5.9M parameters
    21200000,                         // 21.2MB model size
    160,                              // 160×160 input
    "PyTorch",
    "2.0.0",
    "EfficientNet-B0 + CoordinateAttention"
);
```

---

### Genesis Model

#### initializeGenesisModel

Initialize with pre-trained EfficientNet-B0 weights.

```javascript
await contract.initializeGenesisModel(
    "QmPretrainedEfficientNetB0",
    ethers.id("genesis_hash")
);
```

---

## Query Functions

### getLatestGlobalModel

```javascript
const model = await contract.getLatestGlobalModel();
console.log("Version:", model.version);
console.log("Accuracy:", model.accuracy / 100, "%");
console.log("AUC:", model.aucScore / 10000);
console.log("Sensitivity:", model.sensitivity / 100, "%");
console.log("Specificity:", model.specificity / 100, "%");
```

### getNetworkStatistics

```javascript
const stats = await contract.getNetworkStatistics();
console.log("Total Hospitals:", stats.totalHospitals);
console.log("Active Hospitals:", stats.activeHospitals);
console.log("Total Samples:", stats.totalSamples);
console.log("Current Round:", stats.currentRoundNumber);
```

### getHospitalInfo

```javascript
const info = await contract.getHospitalInfo(hospitalAddress);
console.log("Name:", info.name);
console.log("Region:", info.region);
console.log("Contributions:", info.totalContributions);
console.log("Total Samples:", info.totalSamplesContributed);
```

### getWeightMetadata

```javascript
const meta = await contract.getWeightMetadata(1);
console.log("Parameters:", meta.totalParameters);
console.log("Architecture:", meta.architecture);
console.log("Framework:", meta.framework, meta.version);
```

---

## Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `ParticipantRegistered` | address, name, region | Hospital registered |
| `UpdateSubmitted` | contributor, round, samples, accuracy, auc | Model submitted |
| `NewGlobalModel` | version, modelCID, accuracy, auc, contributors | Global model published |
| `WeightMetadataStored` | version, parameters, architecture | Metadata stored |
| `AggregationRequired` | round, submissionCount | Ready for aggregation |

---

## Security Features

- **Access Control**: Only registered participants can submit
- **Reentrancy Protection**: OpenZeppelin ReentrancyGuard
- **Pausable**: Emergency stop mechanism
- **Metric Validation**: All metrics validated ≤ 100%
- **Hash Verification**: SHA-256 hashes for integrity

---

## Example Workflow

```
1. Deploy contract with:
   - requiredSubmissions = 3
   - minSamplesPerUpdate = 500

2. Owner registers hospitals:
   - Boston Medical Center (North America)
   - London Healthcare Trust (Europe)
   - Tokyo Cancer Institute (Asia)

3. Owner sets oracle address

4. Owner initializes genesis model:
   - Pre-trained EfficientNet-B0 weights

5. Hospitals train locally:
   - Load global model
   - Train on private histopathology data
   - Evaluate: accuracy, AUC, sensitivity, specificity

6. Hospitals submit updates:
   - Upload encrypted .pth to IPFS
   - Submit CID + metrics to blockchain

7. Oracle aggregates (after 3 submissions):
   - FedAvg on model weights
   - Calculate global metrics
   - Publish new global model

8. Repeat from step 5
```

---

## Deployment Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| requiredSubmissions | 3 | Minimum hospitals per round |
| minSamplesPerUpdate | 500 | Minimum histopathology samples |

Both can be updated by owner after deployment.
