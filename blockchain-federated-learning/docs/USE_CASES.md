# Use Cases for Blockchain-Based Federated Learning System

## Overview

This document outlines the specific use cases and requirements for the blockchain-based federated learning system for **histopathology-based breast cancer classification**. The system uses **EfficientNet-B0 with Coordinate Attention** to collaboratively train across multiple hospitals while preserving patient privacy.

---

## Model Architecture

- **Backbone**: EfficientNet-B0 (pretrained on ImageNet)
- **Attention**: Coordinate Attention mechanism
- **Task**: Binary Classification (Benign vs Malignant)
- **Framework**: PyTorch 2.0+
- **Input Size**: 160×160 RGB histopathology images
- **Parameters**: ~5.9 million

---

## Use Case 1: Multi-Hospital Collaborative Training

### Scenario
Multiple hospitals want to collaboratively train a histopathology breast cancer classification model without sharing sensitive patient data.

### Requirements
- **Minimum 3 hospitals** (recommended 5+ for optimal results)
- Each hospital must have:
  - At least 500 histopathology images with confirmed diagnoses
  - Binary labels: Benign (0) or Malignant (1)
  - Local computing resources for model training (GPU recommended)
  - MetaMask wallet for blockchain identity

### Benefits
1. **Larger Effective Dataset**: 3 hospitals × 500 samples = 1,500 total samples
2. **Privacy Preserved**: No hospital shares raw histopathology images
3. **Improved Accuracy**: Aggregated model performs better than any single hospital's model
4. **Compliance**: Meets HIPAA, GDPR, and other privacy regulations

### Example
```
Hospital A (Urban, 1,500 samples) → 93.78% accuracy, 0.9650 AUC
Hospital B (Rural, 800 samples)   → 91.00% accuracy, 0.9400 AUC
Hospital C (Research, 2,000 samples) → 95.00% accuracy, 0.9750 AUC

After Federated Aggregation (FedAvg):
Global Model (4,300 samples) → 93.50% accuracy, 0.9600 AUC across ALL populations
```

---

## Use Case 2: Diverse Histopathology Data Coverage

### Why Diversity Matters

Histopathology images vary significantly across:
- **Magnification levels**: 40X, 100X, 200X, 400X
- **Staining protocols**: H&E, IHC, different laboratories
- **Scanner types**: Different digital pathology equipment
- **Tumor subtypes**: Ductal carcinoma, lobular carcinoma, etc.
- **Demographics**: Age, ethnicity, genetic factors

### Requirements for Diversity

1. **Geographic Diversity** (Minimum 3 different regions)
   - Urban teaching hospitals
   - Rural community hospitals
   - Specialized cancer centers

2. **Dataset Diversity** (Recommended sources)
   - BreaKHis dataset
   - Breast Cancer Histopathology Images
   - Histopathological MSI dataset
   - Custom institutional data

3. **Clinical Diversity**
   - Different disease stages
   - Various tumor types and subtypes
   - Both screening and diagnostic cases

### Example Diverse Network

```
┌─────────────────────────────────────────────────────────────┐
│ Hospital A: Boston Medical Center (North America)          │
├─────────────────────────────────────────────────────────────┤
│ • 1,500 histopathology samples                              │
│ • Dataset: BreaKHis (multiple magnifications)               │
│ • Accuracy: 93.78%, AUC: 0.9650                            │
│ • Sensitivity: 94%, Specificity: 93%                       │
│ • Training Time: 1 hour                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Hospital B: London Healthcare Trust (Europe)               │
├─────────────────────────────────────────────────────────────┤
│ • 800 histopathology samples                                │
│ • Dataset: Breast Cancer Histopathology                     │
│ • Accuracy: 91.00%, AUC: 0.9400                            │
│ • Sensitivity: 92%, Specificity: 90%                       │
│ • Training Time: 40 minutes                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Hospital C: Tokyo Cancer Institute (Asia)                  │
├─────────────────────────────────────────────────────────────┤
│ • 2,000 histopathology samples                              │
│ • Dataset: Histopathological MSI                            │
│ • Accuracy: 95.00%, AUC: 0.9750                            │
│ • Sensitivity: 96%, Specificity: 94%                       │
│ • Training Time: 1.5 hours                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Use Case 3: Metrics Tracking for Clinical Validation

### Tracked Metrics

| Metric | Description | Clinical Importance |
|--------|-------------|---------------------|
| **Accuracy** | Overall correct predictions | General performance |
| **AUC-ROC** | Area under ROC curve | Model discrimination ability |
| **Sensitivity** | True positive rate for malignant | Critical for cancer detection |
| **Specificity** | True negative rate for benign | Reduces false alarms |
| **F1-Score** | Harmonic mean of precision/recall | Balance metric |

### Clinical Significance

- **High Sensitivity (>90%)**: Minimizes missed cancers
- **High Specificity (>90%)**: Reduces unnecessary biopsies
- **High AUC (>0.95)**: Excellent diagnostic accuracy

---

## Use Case 4: Privacy-Preserving Model Updates

### What Gets Shared

✅ **Shared on Blockchain**:
- IPFS CID (pointer to encrypted model weights)
- SHA-256 hash of model
- Training metrics (accuracy, AUC, sensitivity, specificity)
- Sample count (no patient identifiers)
- Training duration

❌ **Never Shared**:
- Raw histopathology images
- Patient identifiers
- Hospital internal data
- Feature vectors

### Workflow

1. Hospital trains EfficientNet-B0 locally on private histopathology data
2. Model weights are encrypted and uploaded to IPFS
3. IPFS CID and metrics are submitted to blockchain
4. Oracle aggregates models using FedAvg
5. New global model is published
6. Hospitals download and continue training

---

## Use Case 5: Federated Averaging (FedAvg)

### Aggregation Process

```
Global Model = Σ (n_k / n_total) × Model_k

Where:
- n_k = samples from hospital k
- n_total = total samples across all hospitals
- Model_k = hospital k's model weights
```

### Example Calculation

```
Hospital A: 1,500 samples, 93.78% accuracy
Hospital B: 800 samples, 91.00% accuracy
Hospital C: 2,000 samples, 95.00% accuracy

Weighted Aggregation:
Total = 4,300 samples

Global Accuracy ≈ (1500/4300 × 93.78%) + (800/4300 × 91.00%) + (2000/4300 × 95.00%)
Global Accuracy ≈ 32.73% + 16.93% + 44.19%
Global Accuracy ≈ 93.85%
```

---

## Technical Requirements

### Hardware Requirements (Per Hospital)

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU | NVIDIA GTX 1060 | NVIDIA RTX 3080+ |
| RAM | 16 GB | 32 GB |
| Storage | 50 GB | 100 GB SSD |
| CPU | 4 cores | 8+ cores |

### Software Requirements

- Python 3.8+
- PyTorch 2.0+
- CUDA 11.0+ (for GPU)
- Node.js 18+ (for blockchain scripts)
- MetaMask wallet

### Network Requirements

- Stable internet connection
- Access to Ethereum Sepolia testnet
- IPFS access (Pinata or similar)

---

## Compliance & Security

### Privacy Compliance

- ✅ HIPAA compliant (US)
- ✅ GDPR compliant (EU)
- ✅ No patient data on blockchain
- ✅ Encrypted model weights on IPFS
- ✅ Audit trail via blockchain

### Security Features

- AES-256-GCM encryption for model weights
- SHA-256 hash verification
- Smart contract access control
- Pausable operations for emergencies
- Reentrancy protection
