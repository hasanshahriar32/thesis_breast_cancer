# Patient Data Features for Histopathology Analysis

## Overview

This document describes the patient data features extracted and used in the federated learning system for histopathology-based cancer classification.

## Model Architecture

### EfficientNet-B0 + Coordinate Attention

The model uses a transfer learning approach with:

- **Backbone:** EfficientNet-B0 (pre-trained on ImageNet)
- **Attention Mechanism:** FastCoordinateAttention for enhanced spatial feature extraction
- **Classifier:** Custom classification head for binary cancer detection

### Input Specifications

| Parameter | Value |
|-----------|-------|
| Image Size | 160 × 160 pixels |
| Color Space | RGB (3 channels) |
| Normalization | ImageNet mean/std |
| Data Format | PNG/JPEG images |

## Feature Extraction Pipeline

### 1. Preprocessing

```python
transform = transforms.Compose([
    transforms.Resize((160, 160)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])
```

### 2. EfficientNet-B0 Backbone Features

The backbone extracts hierarchical visual features:

- **Low-level features:** Edges, textures, color gradients
- **Mid-level features:** Cellular patterns, tissue structures
- **High-level features:** Malignancy indicators, growth patterns

### 3. Coordinate Attention Features

The FastCoordinateAttention module enhances features by:

- Encoding horizontal and vertical positional information
- Capturing long-range dependencies in tissue images
- Highlighting cancer-relevant spatial regions

```python
class FastCoordinateAttention(nn.Module):
    def __init__(self, inp, reduction=32):
        super().__init__()
        mip = max(8, inp // reduction)
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Sequential(
            nn.Conv2d(inp, mip, 1),
            nn.BatchNorm2d(mip),
            nn.ReLU(inplace=True),
            nn.Conv2d(mip, inp, 1),
            nn.Sigmoid()
        )
```

## Classification Output

### Binary Classification

| Class | Label | Description |
|-------|-------|-------------|
| 0 | Benign | Non-cancerous tissue |
| 1 | Malignant | Cancerous tissue |

### Output Format

```python
{
    "prediction": 0 or 1,
    "confidence": 0.0 to 1.0,
    "probabilities": {
        "benign": float,
        "malignant": float
    }
}
```

## Histopathology-Specific Features

### Tissue Characteristics Detected

1. **Cellular Density:** Higher in malignant tissues
2. **Nuclear-to-Cytoplasm Ratio:** Elevated in cancer cells
3. **Tissue Architecture:** Disorganized in malignant cases
4. **Staining Patterns:** Abnormal chromatin distribution
5. **Growth Patterns:** Invasive vs. encapsulated

### Dataset Characteristics

Each participating hospital provides:

| Feature | Description |
|---------|-------------|
| `sample_count` | Number of histopathology images |
| `benign_count` | Number of benign tissue samples |
| `malignant_count` | Number of malignant tissue samples |
| `class_distribution` | Percentage split of classes |
| `image_quality_score` | Average image quality metric |

## Federated Learning Data Flow

### Hospital Data Submission

```json
{
    "hospitalAddress": "0x...",
    "modelWeightsCID": "Qm...",
    "localSamples": 2500,
    "accuracy": 9430,
    "weightMetadata": {
        "backboneLayers": 237,
        "attentionLayers": 5,
        "classifierLayers": 3,
        "totalParams": 5288548
    }
}
```

### Privacy Preservation

- **No raw images shared:** Only model weights uploaded to IPFS
- **Differential privacy:** Optional noise addition during training
- **Secure aggregation:** Weights combined without exposing individual contributions

## Quality Metrics

### Model Performance

| Metric | Description | Target |
|--------|-------------|--------|
| Accuracy | Overall correct predictions | > 90% |
| Sensitivity | True positive rate (malignant detection) | > 95% |
| Specificity | True negative rate (benign confirmation) | > 85% |
| AUC-ROC | Area under ROC curve | > 0.95 |

### Data Quality Requirements

- **Minimum resolution:** 160×160 pixels
- **Staining consistency:** H&E or IHC stains
- **Label quality:** Pathologist-verified annotations
- **Sample diversity:** Mix of tissue types and patient demographics

## Blockchain Integration

### On-Chain Data

| Field | Description |
|-------|-------------|
| `modelWeightsCID` | IPFS CID for model weights |
| `updateHash` | Cryptographic hash for verification |
| `localSamples` | Number of training samples |
| `accuracy` | Model accuracy (scaled by 100) |
| `timestamp` | Block timestamp of submission |

### Off-Chain Data (IPFS)

- Complete model weights (PyTorch state_dict)
- Training metadata (epochs, learning rate, etc.)
- Validation metrics (confusion matrix, ROC data)

## Usage in Federated Workflow

### 1. Local Training

Each hospital trains on their local histopathology dataset:

```bash
python train.py --data /path/to/local/images --epochs 50
```

### 2. Weight Extraction

Export trained model weights:

```python
torch.save(model.state_dict(), 'model_weights.pth')
```

### 3. IPFS Upload

Upload weights and get CID:

```bash
ipfs add model_weights.pth
```

### 4. Blockchain Submission

Submit update to smart contract:

```javascript
await contract.submitModelUpdate(
    "QmModelWeightsCID...",
    updateHash,
    sampleCount,
    accuracy
);
```

## References

- EfficientNet: https://arxiv.org/abs/1905.11946
- Coordinate Attention: https://arxiv.org/abs/2103.02907
- Federated Learning: https://arxiv.org/abs/1602.05629
