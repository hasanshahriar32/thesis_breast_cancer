# Test Data for Blockchain Federated Learning System

This directory contains comprehensive test data simulating three hospitals participating in a federated learning network for breast cancer diagnosis. Each hospital has prepared their local training results and is ready to submit to the blockchain and IPFS.

## Directory Structure

```
test-data/
├── README.md                     # This file
├── simulation_scripts/           # Python scripts to demonstrate usage
├── hospital1-boston/            # Boston Medical Center (US)
├── hospital2-london/            # Royal London Hospital (UK)  
└── hospital3-tokyo/             # Tokyo Medical University Hospital (Japan)
```

## Hospital Profiles

### Hospital 1 - Boston Medical Center (US)
- **Samples**: 1,500 patients
- **Demographics**: Diverse North American population
- **Performance**: Fusion accuracy 93.78%
- **Infrastructure**: 4x NVIDIA A100 GPUs
- **Compliance**: HIPAA compliant

### Hospital 2 - Royal London Hospital (UK)
- **Samples**: 2,800 patients
- **Demographics**: European population with high diversity
- **Performance**: Fusion accuracy 95.12%
- **Infrastructure**: 6x NVIDIA V100 GPUs
- **Compliance**: NHS + GDPR compliant

### Hospital 3 - Tokyo Medical University Hospital (Japan)
- **Samples**: 3,500 patients
- **Demographics**: Predominantly East Asian population
- **Performance**: Fusion accuracy 96.45%
- **Infrastructure**: 8x NVIDIA H100 GPUs
- **Compliance**: JMIP + APPI compliant

## File Types in Each Hospital Directory

### 1. `hospital_info.json`
Contains hospital metadata, infrastructure details, patient demographics (anonymized), and equipment specifications.

**Key Fields**:
- Hospital identification and contact information
- Technical infrastructure (compute, storage, network)
- Patient demographics (age, ethnicity distributions)
- Imaging equipment specifications
- Regulatory compliance information

### 2. `training_session.json`
Detailed training configuration and performance metrics for all models (3 extractors + fusion model).

**Key Fields**:
- Training hyperparameters and configuration
- Dataset information and augmentation settings
- Individual extractor performance metrics
- Fusion model performance and classification reports
- Computational resource usage
- Privacy protection measures

### 3. `model_weights_metadata.json`
Technical specifications of the trained models ready for IPFS upload.

**Key Fields**:
- IPFS CIDs for each encrypted model file
- Model architecture details and parameter counts
- File sizes and compression information
- Encryption details (AES-256-GCM)
- Weight statistics and checksums

### 4. `features_summary.json`
Comprehensive feature extraction analysis showing the 3,840-dimensional feature space.

**Key Fields**:
- 33 interpretable feature categories across 3 modalities:
  - **X-Ray Features** (1,280 dimensions): Mass characteristics, calcifications, architectural distortion
  - **Histopathology Features** (1,280 dimensions): Cellular morphology, nuclear features, tissue architecture
  - **Ultrasound Features** (1,280 dimensions): Lesion shape, echogenicity, vascularity
- Top discriminative features for each modality
- Abnormality detection thresholds and statistics

### 5. `blockchain_submission.json`
Ready-to-submit blockchain transaction data with IPFS integration.

**Key Fields**:
- Smart contract function calls with parameters
- Gas estimates and cost calculations
- IPFS upload confirmations and CIDs
- Oracle integration for verification
- Expected blockchain events
- Compliance and audit information

## Feature Categories Explained

The system extracts **33 distinct feature categories** from breast imaging:

### X-Ray Mammography (10 categories)
1. **Mass Characteristics**: Density, shape, margin features
2. **Calcification Patterns**: Micro/macro calcifications, distribution
3. **Architectural Distortion**: Tissue disruption patterns
4. **Breast Density**: BI-RADS density scoring
5. **Tissue Texture**: Homogeneity, entropy measures
6. **Vascular Patterns**: Vessel prominence and asymmetry
7. **Lymph Node Features**: Size, shape, cortical thickness
8. **Skin Changes**: Thickening, retraction patterns
9. **Positional Features**: Location and depth information
10. **Temporal Changes**: Evolution over time

### Histopathology (12 categories)
1. **Cellular Morphology**: Nuclear pleomorphism, cell variation
2. **Nuclear Features**: Hyperchromasia, membrane irregularity
3. **Mitotic Activity**: Mitotic figures and proliferation
4. **Tissue Architecture**: Glandular structure integrity
5. **Stromal Changes**: Desmoplastic response
6. **Necrosis Patterns**: Necrotic area analysis
7. **Immune Infiltration**: TIL density, immune response
8. **Vascular Invasion**: Lymphovascular penetration
9. **Tumor Margins**: Infiltrative vs pushing borders
10. **Cell Differentiation**: Tubule formation, polarity
11. **Special Staining**: H&E staining intensity patterns
12. **Histological Grade**: Nottingham grading system

### Ultrasound (11 categories)
1. **Lesion Shape**: Irregularity, orientation features
2. **Lesion Margins**: Spiculation, microlobulation
3. **Echogenicity**: Hypoechoic patterns, heterogeneity
4. **Posterior Features**: Shadowing, enhancement patterns
5. **Calcifications**: Macro/micro calcifications on US
6. **Vascularity**: Doppler flow patterns
7. **Elastography**: Tissue stiffness measurements
8. **Surrounding Tissue**: Architectural changes
9. **Orientation**: Parallel vs non-parallel growth
10. **Lesion Size**: Diameter and volume measurements
11. **Associated Features**: Cooper ligament changes

## Simulation Workflow

This test data represents the complete workflow a hospital would follow:

1. **Data Preparation** (`hospital_info.json`)
   - Register hospital metadata
   - Configure infrastructure
   - Prepare patient cohort (anonymized)

2. **Model Training** (`training_session.json`)
   - Train 3 feature extractors (X-Ray, Histopathology, Ultrasound)
   - Train fusion model on concatenated features
   - Validate performance and collect metrics

3. **Feature Analysis** (`features_summary.json`)
   - Extract 3,840-dimensional features
   - Analyze feature importance and categories
   - Detect abnormalities using thresholds

4. **Model Encryption & Upload** (`model_weights_metadata.json`)
   - Encrypt model weights using AES-256-GCM
   - Upload to IPFS and obtain CIDs
   - Store metadata and checksums

5. **Blockchain Submission** (`blockchain_submission.json`)
   - Prepare smart contract transaction
   - Include oracle verification
   - Submit to Ethereum network
   - Monitor transaction and events

## Smart Contract Integration

The test data is designed to work with the enhanced `FederatedModelRegistry.sol` contract:

### Key Functions Used:
- `registerParticipant()`: Register hospital with metadata
- `submitUpdate()`: Submit model updates with IPFS CIDs
- `storeWeightMetadata()`: Store technical model specifications
- `publishNewGlobalModel()`: Aggregate and publish global model

### Minimum Requirements Met:
- ✅ 3 hospitals participating (Boston, London, Tokyo)
- ✅ Minimum 500 samples per hospital (1,500 + 2,800 + 3,500)
- ✅ Valid accuracy scores (93.78%, 95.12%, 96.45%)
- ✅ IPFS CIDs for all model files
- ✅ Complete weight metadata

## Usage Examples

See the `simulation_scripts/` directory for Python scripts demonstrating:

1. **`read_hospital_data.py`**: Parse and analyze hospital JSON files
2. **`simulate_blockchain_submission.py`**: Simulate contract interactions
3. **`analyze_features.py`**: Analyze the 3,840-dimensional feature space
4. **`verify_requirements.py`**: Validate minimum network requirements

## IPFS Integration

Each hospital has uploaded 4 encrypted model files to IPFS:
- `fusion_model.h5` (3.8M parameters, ~12.6MB encrypted)
- `extractor_xray.h5` (4.0M parameters, ~13.4MB encrypted)
- `extractor_histo.h5` (4.0M parameters, ~13.4MB encrypted)  
- `extractor_ultra.h5` (4.0M parameters, ~13.4MB encrypted)

**Total Network Storage**: ~212MB encrypted model data across 12 files

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
- **Average Accuracy**: 95.12%
- **Total Parameters**: ~48M parameters
- **Geographic Diversity**: 3 continents
- **Ethnic Diversity**: Comprehensive representation

This test data provides a complete, realistic simulation of a global federated learning network for breast cancer diagnosis, demonstrating the entire pipeline from local training to blockchain coordination.