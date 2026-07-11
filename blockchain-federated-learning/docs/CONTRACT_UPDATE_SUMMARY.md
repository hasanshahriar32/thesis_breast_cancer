# Contract Update Summary

## Overview

This document summarizes the major updates made to the FederatedModelRegistry smart contract to align with the new single-modality EfficientNet-B0 histopathology classification model.

## Previous Architecture (Deprecated)

The original contract was designed for a **multi-modal federated learning** system:

- **Three separate feature extractors:**
  - X-Ray extractor (extractorXrayCID)
  - Histopathology extractor (extractorHistoCID)  
  - Ultrasound extractor (extractorUltraCID)
- **Fusion model** for combining multi-modal features
- Complex weight tracking for each modality

## New Architecture (Current)

The updated contract supports a **single-modality histopathology** classification model:

- **Model:** EfficientNet-B0 backbone + Coordinate Attention mechanism
- **Task:** Binary classification (Benign vs Malignant)
- **Input:** 160×160 RGB histopathology images
- **Parameters:** ~5.9M trainable parameters
- **Framework:** PyTorch 2.0+

## Contract Changes

### Struct Updates

#### GlobalModel (Before)
```solidity
struct GlobalModel {
    string extractorXrayCID;
    string extractorHistoCID;
    string extractorUltraCID;
    string fusionModelCID;
    bytes32 modelHash;
    uint256 version;
    uint256 timestamp;
    uint256 totalSamples;
}
```

#### GlobalModel (After)
```solidity
struct GlobalModel {
    string modelWeightsCID;
    bytes32 modelHash;
    uint256 version;
    uint256 timestamp;
    uint256 totalSamples;
    uint256 accuracy;
}
```

#### ModelUpdate (Before)
```solidity
struct ModelUpdate {
    address hospital;
    string extractorXrayCID;
    string extractorHistoCID;
    string extractorUltraCID;
    bytes32 updateHash;
    uint256 localSamples;
    uint256 timestamp;
    bool validated;
    uint256 accuracy;
}
```

#### ModelUpdate (After)
```solidity
struct ModelUpdate {
    address hospital;
    string modelWeightsCID;
    bytes32 updateHash;
    uint256 localSamples;
    uint256 timestamp;
    bool validated;
    uint256 accuracy;
}
```

#### WeightMetadata (Before)
```solidity
struct WeightMetadata {
    uint256 xrayLayers;
    uint256 histoLayers;
    uint256 ultraLayers;
    uint256 fusionLayers;
    uint256 totalParams;
}
```

#### WeightMetadata (After)
```solidity
struct WeightMetadata {
    uint256 backboneLayers;
    uint256 attentionLayers;
    uint256 classifierLayers;
    uint256 totalParams;
}
```

### Function Signature Updates

#### submitModelUpdate

**Before:**
```solidity
function submitModelUpdate(
    string memory _extractorXrayCID,
    string memory _extractorHistoCID,
    string memory _extractorUltraCID,
    bytes32 _updateHash,
    uint256 _localSamples,
    uint256 _accuracy
) external onlyParticipant
```

**After:**
```solidity
function submitModelUpdate(
    string memory _modelWeightsCID,
    bytes32 _updateHash,
    uint256 _localSamples,
    uint256 _accuracy
) external onlyParticipant
```

#### aggregateUpdates

**Before:**
```solidity
function aggregateUpdates(
    string memory _newExtractorXrayCID,
    string memory _newExtractorHistoCID,
    string memory _newExtractorUltraCID,
    string memory _newFusionModelCID,
    bytes32 _newModelHash
) external onlyOwner
```

**After:**
```solidity
function aggregateUpdates(
    string memory _newModelWeightsCID,
    bytes32 _newModelHash,
    uint256 _aggregatedAccuracy
) external onlyOwner
```

### New Features

1. **Accuracy Tracking:** The global model now tracks aggregated accuracy across all participants
2. **Simplified Weight Metadata:** Reflects EfficientNet-B0 architecture with backbone, attention, and classifier layers
3. **Streamlined Events:** Cleaner event emissions for model updates

## Migration Notes

### For Existing Hospitals

Hospitals previously submitting multi-modal updates need to:

1. Train the new EfficientNet-B0 histopathology model
2. Upload single model weights to IPFS (not multiple extractors)
3. Use updated `submitModelUpdate` with single CID
4. Update accuracy metrics to reflect binary classification performance

### For Aggregators

When aggregating updates:

1. Apply Federated Averaging to single model architecture
2. Include aggregated accuracy in the new global model
3. Deploy aggregated weights as single IPFS CID

## Test Data Updates

All hospital test data has been updated:

- `hospital1-boston/`: Boston General Hospital histopathology focus
- `hospital2-london/`: Royal London histopathology dataset
- `hospital3-tokyo/`: Tokyo Medical histopathology collection

Each now contains:
- Single `modelWeightsCID` instead of multiple extractor CIDs
- Updated `weightMetadata` reflecting EfficientNet-B0 structure
- Binary classification accuracy metrics (Benign/Malignant)

## Verification

To verify the updated contract:

```bash
# Compile the contract
npx hardhat compile

# Run the test suite
npx hardhat test

# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Current | Single-modality EfficientNet-B0 histopathology model |
| 1.0.0 | Previous | Multi-modal X-Ray/Histo/Ultrasound architecture |
