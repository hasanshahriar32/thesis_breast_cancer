# Test Data for Blockchain Federated Learning System

This directory contains comprehensive test data simulating three hospitals participating in a federated learning network for breast cancer diagnosis using histopathology imaging. Each hospital has prepared their local training results and is ready to submit to the blockchain and IPFS.

## Architecture

- **Model**: EfficientNet-B0 + Coordinate Attention (FastHistopathologyModel)
- **Framework**: PyTorch 2.0.0
- **Modality**: Single-modality (Histopathology H&E staining)
- **Feature Dimensions**: 1,280
- **Parameters**: ~5.9M (5,927,510)
- **Input Size**: 160x160 RGB
- **Output**: Binary classification (Benign vs Malignant)

## Directory Structure

```
test-data/
├── README.md                     # This file
├── simulation_scripts/           # Python scripts to demonstrate usage
├── hospital1-boston/              # Boston Medical Center (US)
├── hospital2-london/             # Royal London Hospital (UK)  
└── hospital3-tokyo/              # Tokyo Medical University Hospital (Japan)
```

## Hospital Profiles

### Hospital 1 - Boston Medical Center (US)
- **Samples**: 1,500 patients
- **Demographics**: Diverse North American population
- **Performance**: Accuracy 93.78%, AUC 0.9650
- **Infrastructure**: 4x NVIDIA A100 GPUs
- **Compliance**: HIPAA compliant

### Hospital 2 - Royal London Hospital (UK)
- **Samples**: 2,800 patients
- **Demographics**: European population with high diversity
- **Performance**: Accuracy 91.00%, AUC 0.9400
- **Infrastructure**: 6x NVIDIA V100 GPUs
- **Compliance**: NHS + GDPR compliant

### Hospital 3 - Tokyo Medical University Hospital (Japan)
- **Samples**: 3,500 patients
- **Demographics**: Predominantly East Asian population
- **Performance**: Accuracy 95.00%, AUC 0.9750
- **Infrastructure**: 8x NVIDIA H100 GPUs
- **Compliance**: JMIP + APPI compliant

## File Types in Each Hospital Directory

### 1. `hospital_info.json`
Contains hospital metadata, infrastructure details, patient demographics (anonymized), and histopathology equipment specifications.

**Key Fields**:
- Hospital identification and contact information
- Technical infrastructure (compute, storage, network)
- Patient demographics (age, ethnicity distributions)
- Histopathology imaging equipment specifications
- Regulatory compliance information

### 2. `training_session.json`
Detailed training configuration and performance metrics for the single PyTorch model.

**Key Fields**:
- Training hyperparameters and configuration
- Dataset information and augmentation settings
- Model performance metrics (accuracy, AUC, F1, confusion matrix)
- Computational resource usage
- Privacy protection measures (differential privacy)

### 3. `model_weights_metadata.json`
Technical specifications of the trained model ready for IPFS upload.

**Key Fields**:
- IPFS CID for the encrypted model file (.pth)
- Model architecture details (EfficientNet-B0 + Coordinate Attention)
- Parameter counts (~5.9M total)
- File sizes and compression information
- Encryption details (AES-256-GCM)
- Weight statistics and checksums

### 4. `features_summary.json`
Comprehensive feature extraction analysis showing the 1,280-dimensional feature space.

**Key Fields**:
- 12 interpretable feature categories from histopathology:
  1. Cellular Morphology
  2. Nuclear Features
  3. Mitotic Activity
  4. Tissue Architecture
  5. Stromal Changes
  6. Necrosis Patterns
  7. Immune Infiltration
  8. Vascular Invasion
  9. Tumor Margins
  10. Cell Differentiation
  11. Special Staining Patterns
  12. Histological Grade
- Top discriminative features
- Abnormality detection thresholds and statistics

### 5. `blockchain_submission.json`
Ready-to-submit blockchain transaction data with IPFS integration.

**Key Fields**:
- Smart contract function calls with parameters
- Gas estimates and cost calculations
- IPFS upload confirmation and CID
- Oracle integration for verification
- Expected blockchain events
- Compliance and audit information

## Simulation Workflow

This test data represents the complete workflow a hospital would follow:

1. **Data Preparation** (`hospital_info.json`)
   - Register hospital metadata
   - Configure infrastructure
   - Prepare patient cohort (anonymized)

2. **Model Training** (`training_session.json`)
   - Train EfficientNet-B0 + Coordinate Attention model on histopathology images
   - Validate performance and collect metrics

3. **Feature Analysis** (`features_summary.json`)
   - Extract 1,280-dimensional features from histopathology images
   - Analyze feature importance across 12 categories
   - Detect abnormalities using thresholds

4. **Model Encryption & Upload** (`model_weights_metadata.json`)
   - Encrypt model weights (.pth) using AES-256-GCM
   - Upload to IPFS and obtain CID
   - Store metadata and checksums

5. **Blockchain Submission** (`blockchain_submission.json`)
   - Prepare smart contract transaction
   - Include oracle verification
   - Submit to Ethereum network
   - Monitor transaction and events

## Smart Contract Integration

The test data is designed to work with the `FederatedModelRegistry.sol` contract:

### Key Functions Used:
- `registerParticipant()`: Register hospital with metadata
- `submitUpdate()`: Submit model update with single IPFS CID
- `storeWeightMetadata()`: Store technical model specifications
- `publishNewGlobalModel()`: Aggregate and publish global model

### Minimum Requirements Met:
- ✅ 3 hospitals participating (Boston, London, Tokyo)
- ✅ Minimum 500 samples per hospital (1,500 + 2,800 + 3,500)
- ✅ Valid accuracy scores (93.78%, 91.00%, 95.00%)
- ✅ IPFS CID for model file
- ✅ Complete weight metadata

## Usage Examples

See the `simulation_scripts/` directory for Python scripts demonstrating:

1. **`read_hospital_data.py`**: Parse and analyze hospital JSON files
2. **`simulate_blockchain_submission.py`**: Simulate contract interactions
3. **`analyze_features.py`**: Analyze the 1,280-dimensional feature space
4. **`verify_requirements.py`**: Validate minimum network requirements

## IPFS Integration

Each hospital has uploaded 1 encrypted model file to IPFS:
- `efficientnet_b0_coordattn_histopathology.pth` (~5.9M parameters, ~21.2MB encrypted)

## Oracle Verification

All submissions include Chainlink oracle verification for:
- ✅ Accuracy validation
- ✅ Sample count verification
- ✅ Training duration validation
- ✅ IPFS availability checks

## Privacy & Compliance

### Data Protection:
- **Encryption**: AES-256-GCM for all model weights
- **Anonymization**: Complete PHI removal
- **Differential Privacy**: ε ∈ [0.7, 1.0], δ ∈ [3e-6, 1e-5]

### Regulatory Compliance:
- **US**: HIPAA compliant (Boston)
- **UK**: NHS + GDPR compliant (London)  
- **Japan**: JMIP + APPI compliant (Tokyo)

## Network Statistics

When all 3 hospitals have submitted:
- **Total Samples**: 7,800 patients
- **Average Accuracy**: 93.26%
- **Total Parameters**: ~5.9M parameters (same model architecture)
- **Geographic Diversity**: 3 continents
- **Ethnic Diversity**: Comprehensive representation

This test data provides a complete, realistic simulation of a global federated learning network for breast cancer diagnosis using histopathology, demonstrating the entire pipeline from local training to blockchain coordination.
