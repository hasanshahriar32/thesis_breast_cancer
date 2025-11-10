# Patient Data Features & Weight Conversion Guide

## Overview

This document explains:
1. What patient image data is collected
2. How images are converted to feature vectors
3. How feature vectors become model weights
4. What features to monitor for abnormal behavior detection
5. Complete keyword/feature listing for visualization charts

---

## Table of Contents

1. [Patient Image Data Collection](#1-patient-image-data-collection)
2. [Image to Feature Vector Conversion](#2-image-to-feature-vector-conversion)
3. [Feature Vector to Model Weights](#3-feature-vector-to-model-weights)
4. [Abnormal Behavior Detection Features](#4-abnormal-behavior-detection-features)
5. [Feature Keywords for Chart Visualization](#5-feature-keywords-for-chart-visualization)
6. [Implementation Workflow](#6-implementation-workflow)

---

## 1. Patient Image Data Collection

### Required Multi-Modal Images per Patient

For each patient, collect **three types** of breast imaging:

#### 1.1 Chest X-Ray (CXR)
- **Format:** DICOM or standard image formats (PNG, JPG)
- **Resolution:** Minimum 224×224 pixels (will be resized)
- **Color:** RGB (3 channels)
- **Purpose:** Detect tissue density, calcifications, masses
- **File naming:** `patient_ID_xray.png`

#### 1.2 Histopathological Image (Microscopy)
- **Format:** High-resolution microscopy images
- **Resolution:** Minimum 224×224 pixels (will be resized)
- **Color:** RGB (stained tissue samples)
- **Purpose:** Cellular-level analysis (mitosis, nuclear features, tissue architecture)
- **File naming:** `patient_ID_histo.png`

#### 1.3 Ultrasound Image
- **Format:** Standard ultrasound imaging
- **Resolution:** Minimum 224×224 pixels (will be resized)
- **Color:** RGB or grayscale (converted to RGB)
- **Purpose:** Mass boundaries, tissue echogenicity, vascular patterns
- **File naming:** `patient_ID_ultra.png`

### Patient Metadata (NOT stored on blockchain)

The following is kept **locally** at each hospital:
- Patient ID (anonymized)
- Age, gender, ethnicity
- Diagnosis label: `0 = Benign`, `1 = Malignant`
- Imaging date
- Equipment type/model

---

## 2. Image to Feature Vector Conversion

### Pipeline Overview

```
Raw Image (224×224×3) 
    ↓
Preprocessing (normalization, color conversion)
    ↓
EfficientNetB0 Feature Extractor (pretrained on ImageNet)
    ↓
Global Average Pooling
    ↓
Feature Vector (1280 dimensions)
```

### 2.1 Image Preprocessing

**For each image:**
```python
IMG_SIZE = 224

def load_and_preprocess_image(path):
    # 1. Load image
    img = cv2.imread(path)
    
    # 2. Convert color space (BGR → RGB)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # 3. Resize to standard size
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    
    # 4. EfficientNet-specific normalization
    # Pixel values scaled to [-1, 1]
    img = tf.keras.applications.efficientnet.preprocess_input(img)
    
    return img  # Shape: (224, 224, 3)
```

### 2.2 Feature Extraction (Transfer Learning)

**EfficientNetB0 Architecture:**
- Pretrained on ImageNet (1.2M images, 1000 classes)
- Optimized for efficiency and accuracy
- Compound scaling (depth, width, resolution)

**Process per modality:**
```python
def create_extractor(input_shape=(224, 224, 3)):
    # Load pretrained EfficientNetB0 (without classification head)
    base_model = EfficientNetB0(
        include_top=False,  # Remove final Dense layers
        input_shape=input_shape,
        weights='imagenet'  # Pretrained weights
    )
    
    # Freeze weights (no training during feature extraction)
    base_model.trainable = False
    
    # Add Global Average Pooling to reduce dimensionality
    inputs = Input(shape=input_shape)
    x = base_model(inputs, training=False)
    outputs = GlobalAveragePooling2D()(x)  # (batch, 1280)
    
    return Model(inputs, outputs)

# Three separate extractors (one per modality)
extractor_xray = create_extractor()   # X-Ray features
extractor_histo = create_extractor()  # Histopathology features
extractor_ultra = create_extractor()  # Ultrasound features
```

**Output per image:**
- **X-Ray features:** 1280-dimensional vector
- **Histopathology features:** 1280-dimensional vector
- **Ultrasound features:** 1280-dimensional vector

**Combined feature vector:** 3,840 dimensions (1280 × 3)

---

## 3. Feature Vector to Model Weights

### 3.1 Multi-Modal Fusion Architecture

The combined 3,840-dimensional feature vector is fed into a fusion model:

```
Combined Features (3,840 dims)
    ↓
Multi-Head Attention Layer (learns importance of each modality)
    ↓
Hybrid Fusion (original + attended features)
    ↓
Dense Layer 1 (512 neurons + Dropout 0.5)
    ↓
Dense Layer 2 (256 neurons + Dropout 0.5)
    ↓
Dense Layer 3 (128 neurons)
    ↓
Output (1 neuron, sigmoid activation) → Probability [0, 1]
```

### 3.2 Model Weights Explanation

**What are "weights"?**
- Weights are the **learned parameters** of the neural network
- Each connection between neurons has a weight (strength of connection)
- Biases are additional parameters added to neurons

**Weight Structure:**
```python
# Example weight counts in fusion model
Dense(512):  3,840 × 512 = 1,966,080 weights + 512 biases
Dense(256):  512 × 256 = 131,072 weights + 256 biases
Dense(128):  256 × 128 = 32,768 weights + 128 biases
Dense(1):    128 × 1 = 128 weights + 1 bias

Total: ~2.1 million parameters
```

### 3.3 How Training Updates Weights

**Local Training at Hospital:**
1. Hospital loads global model weights (v1.0) from blockchain
2. Hospital trains on local patient data (500 samples)
3. Training adjusts weights using backpropagation:
   - Calculate prediction error (loss)
   - Compute gradients (how much to change each weight)
   - Update weights to minimize error
4. Hospital saves updated weights

**Federated Aggregation (FedAvg):**
```
Hospital A weights: W_A (trained on 500 samples)
Hospital B weights: W_B (trained on 600 samples)
Hospital C weights: W_C (trained on 400 samples)

Global weights = (500×W_A + 600×W_B + 400×W_C) / (500+600+400)
               = Weighted average based on sample size
```

**What goes to blockchain:**
- IPFS CID of weight file (e.g., `Qm...abc123`)
- SHA-256 hash of weights (for integrity)
- Sample count (500, 600, 400)
- Accuracy metrics (91%, 89%, 92%)

---

## 4. Abnormal Behavior Detection Features

### Philosophy

Instead of showing raw feature vectors (3,840 numbers), we monitor **interpretable features** derived from:
1. **Feature activation patterns** (which parts of EfficientNet activate strongly)
2. **Attention weights** (which modality the model focuses on)
3. **Statistical distributions** of features
4. **Model confidence** and prediction probabilities

### 4.1 Per-Modality Feature Categories

Each modality (X-Ray, Histo, Ultrasound) has 1,280 features. We group them into interpretable categories:

#### X-Ray Feature Groups (1,280 features → 10 categories)

| Category | Feature Indices | Description | Normal Range | Abnormal Indicator |
|----------|----------------|-------------|--------------|-------------------|
| **Density Features** | 0-127 | Tissue density patterns | [0.2, 0.6] | >0.7 = dense mass |
| **Calcification Features** | 128-255 | Bright spots indicating calcium deposits | [0.1, 0.3] | >0.5 = suspicious calcifications |
| **Mass Features** | 256-383 | Presence of discrete masses | [0.1, 0.4] | >0.6 = likely mass |
| **Architectural Distortion** | 384-511 | Disruption of normal tissue pattern | [0.0, 0.2] | >0.4 = distortion present |
| **Asymmetry Features** | 512-639 | Left-right breast differences | [0.0, 0.3] | >0.5 = significant asymmetry |
| **Edge Sharpness** | 640-767 | Boundaries of masses (sharp = malignant) | [0.2, 0.5] | >0.7 = irregular borders |
| **Texture Patterns** | 768-895 | Coarse vs fine texture | [0.3, 0.6] | >0.8 = heterogeneous |
| **Contrast Features** | 896-1023 | Difference between mass and tissue | [0.2, 0.5] | >0.7 = high contrast |
| **Lymph Node Features** | 1024-1151 | Axillary lymph node appearance | [0.0, 0.2] | >0.4 = enlarged nodes |
| **Global Structural** | 1152-1279 | Overall breast structure | [0.4, 0.7] | <0.3 or >0.8 = abnormal |

#### Histopathology Feature Groups (1,280 features → 12 categories)

| Category | Feature Indices | Description | Normal Range | Abnormal Indicator |
|----------|----------------|-------------|--------------|-------------------|
| **Nuclear Features** | 0-106 | Nucleus size, shape, chromatin | [0.2, 0.5] | >0.7 = pleomorphic nuclei |
| **Mitotic Activity** | 107-213 | Cell division rate | [0.0, 0.2] | >0.5 = high mitotic rate |
| **Cellular Density** | 214-320 | Number of cells per area | [0.3, 0.6] | >0.8 = hypercellular |
| **Tubule Formation** | 321-427 | Glandular structure preservation | [0.5, 0.8] | <0.3 = poor differentiation |
| **Necrosis Features** | 428-534 | Presence of dead tissue | [0.0, 0.1] | >0.3 = tumor necrosis |
| **Stromal Features** | 535-641 | Connective tissue appearance | [0.3, 0.6] | >0.7 = desmoplastic reaction |
| **Inflammation** | 642-748 | Immune cell infiltration | [0.1, 0.3] | >0.6 = significant inflammation |
| **Nuclear-Cytoplasm Ratio** | 749-855 | Ratio of nucleus to cytoplasm size | [0.2, 0.4] | >0.7 = high N/C ratio |
| **Chromatin Pattern** | 856-962 | DNA distribution in nucleus | [0.3, 0.6] | >0.8 = coarse chromatin |
| **Cell Cohesion** | 963-1069 | How tightly cells stick together | [0.5, 0.8] | <0.3 = loss of cohesion |
| **Vascular Invasion** | 1070-1176 | Cancer cells in blood vessels | [0.0, 0.1] | >0.3 = vascular invasion |
| **Margin Features** | 1177-1279 | Tumor boundary characteristics | [0.3, 0.6] | >0.8 = invasive margins |

#### Ultrasound Feature Groups (1,280 features → 11 categories)

| Category | Feature Indices | Description | Normal Range | Abnormal Indicator |
|----------|----------------|-------------|--------------|-------------------|
| **Echogenicity** | 0-116 | Brightness of mass (hypo/hyper) | [0.3, 0.6] | <0.2 or >0.8 = suspicious |
| **Mass Shape** | 117-233 | Round, oval, irregular | [0.5, 0.8] | <0.4 = irregular shape |
| **Mass Margin** | 234-350 | Smooth, microlobulated, spiculated | [0.5, 0.8] | <0.3 = spiculated margins |
| **Posterior Features** | 351-467 | Shadowing or enhancement behind mass | [0.3, 0.6] | >0.7 = shadowing (suspicious) |
| **Orientation** | 468-584 | Parallel vs not parallel to skin | [0.5, 0.8] | <0.4 = not parallel (suspicious) |
| **Vascularity** | 585-701 | Blood flow in/around mass | [0.1, 0.4] | >0.6 = increased vascularity |
| **Calcifications** | 702-818 | Acoustic shadowing from calcifications | [0.0, 0.2] | >0.4 = calcifications present |
| **Elasticity** | 819-935 | Tissue stiffness (if available) | [0.4, 0.7] | >0.8 = very stiff (suspicious) |
| **Tissue Layers** | 936-1052 | Disruption of normal layers | [0.5, 0.8] | <0.3 = architectural distortion |
| **Axillary Findings** | 1053-1169 | Lymph node appearance | [0.0, 0.2] | >0.4 = abnormal lymph nodes |
| **Acoustic Pattern** | 1170-1279 | Overall acoustic transmission | [0.4, 0.7] | <0.3 or >0.8 = abnormal |

### 4.2 Fusion Model Features (Derived)

These are **not** part of the 3,840 input features but are **computed** by the fusion model:

| Feature | Description | Normal Range | Abnormal Indicator |
|---------|-------------|--------------|-------------------|
| **Attention Weights** | How much model focuses on each modality | Balanced [0.3, 0.4, 0.3] | Heavily skewed (e.g., [0.8, 0.1, 0.1]) |
| **Confidence Score** | Model's certainty in prediction | >0.7 for either class | 0.4-0.6 = uncertain/borderline |
| **Cross-Modality Consistency** | Agreement between modalities | High correlation | Low correlation = conflicting signals |
| **Feature Magnitudes** | L2 norm of feature vectors | [50, 150] | >200 = extreme activation |
| **Gradient Magnitude** | Sensitivity to input changes | [0.01, 0.1] | >0.5 = very sensitive area |

---

## 5. Feature Keywords for Chart Visualization

### 5.1 Recommended Chart Types

#### Chart 1: **Per-Modality Feature Heatmap**
**Type:** Heatmap (3 rows × 1280 columns)

**Keywords/Axes:**
- **Y-axis:** `["X-Ray Features", "Histopathology Features", "Ultrasound Features"]`
- **X-axis:** `Feature Index [0-1279]`
- **Color Scale:** `Activation Intensity [0.0 - 1.0]`
- **Threshold Line:** `Abnormal Threshold = 0.7`

**Interpretation:**
- Dark red (>0.7) = Strong abnormal indicator
- Yellow (0.4-0.6) = Normal range
- Dark blue (<0.2) = Suppressed features

---

#### Chart 2: **Categorical Feature Radar Plot**
**Type:** Radar/Spider Chart (per modality)

**X-Ray Keywords (10 categories):**
```python
xray_categories = [
    "Density",
    "Calcification",
    "Mass Presence",
    "Arch. Distortion",
    "Asymmetry",
    "Edge Sharpness",
    "Texture",
    "Contrast",
    "Lymph Nodes",
    "Global Structure"
]
```

**Histopathology Keywords (12 categories):**
```python
histo_categories = [
    "Nuclear Atypia",
    "Mitotic Activity",
    "Cell Density",
    "Tubule Formation",
    "Necrosis",
    "Stromal Reaction",
    "Inflammation",
    "N/C Ratio",
    "Chromatin Pattern",
    "Cell Cohesion",
    "Vascular Invasion",
    "Margin Invasiveness"
]
```

**Ultrasound Keywords (11 categories):**
```python
ultra_categories = [
    "Echogenicity",
    "Mass Shape",
    "Mass Margin",
    "Posterior Features",
    "Orientation",
    "Vascularity",
    "Calcifications",
    "Elasticity",
    "Tissue Layers",
    "Axillary Findings",
    "Acoustic Pattern"
]
```

**Threshold Annotation:**
- Green zone: `[0.0, 0.6]` = Normal
- Yellow zone: `[0.6, 0.7]` = Borderline
- Red zone: `[0.7, 1.0]` = Abnormal

---

#### Chart 3: **Attention Weight Distribution**
**Type:** Bar Chart

**Keywords:**
```python
modalities = ["X-Ray", "Histopathology", "Ultrasound"]
attention_weights = [0.35, 0.40, 0.25]  # Example values
```

**Interpretation:**
- Balanced: `[0.33, 0.34, 0.33]` = All modalities important
- X-Ray dominant: `[0.7, 0.15, 0.15]` = Mass clearly visible on X-Ray
- Histo dominant: `[0.1, 0.8, 0.1]` = Diagnosis relies on cellular features

---

#### Chart 4: **Prediction Confidence Timeline**
**Type:** Line Plot

**Keywords:**
```python
x_axis = "Training Epoch / Prediction Time"
y_axis = "Confidence Score [0.0 - 1.0]"
threshold_benign = 0.5  # <0.5 = benign
threshold_malignant = 0.5  # >0.5 = malignant
uncertainty_zone = [0.4, 0.6]  # Borderline cases
```

**Annotations:**
- `Benign (High Confidence): [0.0, 0.3]`
- `Benign (Low Confidence): [0.3, 0.5]`
- `Uncertain: [0.4, 0.6]`
- `Malignant (Low Confidence): [0.5, 0.7]`
- `Malignant (High Confidence): [0.7, 1.0]`

---

#### Chart 5: **Feature Distribution Histogram**
**Type:** Histogram (per category)

**Keywords:**
```python
feature_categories = [
    "Density", "Calcification", "Mass", "Distortion", 
    "Asymmetry", "Edge", "Texture", "Contrast", 
    "Lymph", "Structure"
]
histogram_bins = 50
x_axis = "Feature Value [0.0 - 1.0]"
y_axis = "Frequency (Number of Features)"
normal_range_overlay = [0.2, 0.6]  # Shaded region
```

**Interpretation:**
- Distribution mostly in green zone → Normal
- Distribution skewed to red zone → Abnormal

---

#### Chart 6: **Cross-Modality Correlation Matrix**
**Type:** Correlation Heatmap

**Keywords:**
```python
modalities = ["X-Ray", "Histopathology", "Ultrasound"]
correlation_matrix = [
    [1.0, 0.65, 0.58],  # X-Ray correlations
    [0.65, 1.0, 0.72],  # Histo correlations
    [0.58, 0.72, 1.0]   # Ultra correlations
]
color_scale = "Correlation Coefficient [-1.0 to 1.0]"
```

**Interpretation:**
- High correlation (>0.7): Modalities agree on diagnosis
- Low correlation (<0.4): Conflicting signals, needs expert review

---

#### Chart 7: **Top-K Most Activated Features**
**Type:** Bar Chart

**Keywords:**
```python
top_k = 20  # Show top 20 features
x_axis = "Feature Name/Index"
y_axis = "Activation Magnitude [0.0 - 1.0]"

# Example feature names
feature_names = [
    "XRay_Mass_Presence_042",
    "Histo_Mitotic_Activity_187",
    "Ultra_Margin_Irregularity_267",
    # ... etc
]
```

**Color Coding:**
- Red bars: Malignant-associated features
- Green bars: Benign-associated features
- Gray bars: Neutral features

---

#### Chart 8: **Global Model Performance Dashboard**
**Type:** Multi-panel Dashboard

**Keywords:**
```python
metrics = {
    "Accuracy": 0.94,
    "AUC Score": 0.96,
    "Sensitivity": 0.93,
    "Specificity": 0.95,
    "Precision": 0.94,
    "F1 Score": 0.935
}

confusion_matrix_labels = ["True Benign", "False Malignant", "False Benign", "True Malignant"]

roc_curve_labels = {
    "x_axis": "False Positive Rate",
    "y_axis": "True Positive Rate",
    "diagonal_line": "Random Classifier (AUC=0.5)"
}
```

---

### 5.2 Complete Feature Keyword Dictionary

For programmatic use:

```python
FEATURE_KEYWORDS = {
    # Patient metadata (local only, NOT on blockchain)
    "patient_info": {
        "patient_id": "Anonymized patient identifier",
        "age": "Patient age in years",
        "diagnosis": "Ground truth label (0=Benign, 1=Malignant)"
    },
    
    # Image preprocessing
    "image_processing": {
        "image_size": 224,
        "color_channels": 3,
        "normalization": "EfficientNet preprocessing [-1, 1]",
        "augmentation": ["rotation", "flip", "zoom", "brightness"]
    },
    
    # Feature extraction
    "feature_extraction": {
        "extractor_architecture": "EfficientNetB0",
        "pretrained_dataset": "ImageNet",
        "feature_dimension": 1280,
        "pooling_method": "Global Average Pooling",
        "total_combined_features": 3840
    },
    
    # X-Ray features (0-1279)
    "xray_features": {
        "density": [0, 127],
        "calcification": [128, 255],
        "mass": [256, 383],
        "distortion": [384, 511],
        "asymmetry": [512, 639],
        "edge_sharpness": [640, 767],
        "texture": [768, 895],
        "contrast": [896, 1023],
        "lymph_nodes": [1024, 1151],
        "structure": [1152, 1279]
    },
    
    # Histopathology features (1280-2559)
    "histo_features": {
        "nuclear": [1280, 1386],
        "mitotic": [1387, 1493],
        "density": [1494, 1600],
        "tubule": [1601, 1707],
        "necrosis": [1708, 1814],
        "stromal": [1815, 1921],
        "inflammation": [1922, 2028],
        "nc_ratio": [2029, 2135],
        "chromatin": [2136, 2242],
        "cohesion": [2243, 2349],
        "vascular": [2350, 2456],
        "margin": [2457, 2559]
    },
    
    # Ultrasound features (2560-3839)
    "ultra_features": {
        "echogenicity": [2560, 2676],
        "shape": [2677, 2793],
        "margin": [2794, 2910],
        "posterior": [2911, 3027],
        "orientation": [3028, 3144],
        "vascularity": [3145, 3261],
        "calcifications": [3262, 3378],
        "elasticity": [3379, 3495],
        "layers": [3496, 3612],
        "axillary": [3613, 3729],
        "acoustic": [3730, 3839]
    },
    
    # Fusion model outputs
    "fusion_outputs": {
        "attention_xray": "Attention weight for X-Ray modality",
        "attention_histo": "Attention weight for Histopathology modality",
        "attention_ultra": "Attention weight for Ultrasound modality",
        "prediction_probability": "Malignancy probability [0.0-1.0]",
        "prediction_class": "Binary prediction (0=Benign, 1=Malignant)",
        "confidence": "Model confidence in prediction"
    },
    
    # Thresholds for abnormality detection
    "abnormal_thresholds": {
        "feature_activation": 0.7,
        "prediction_threshold": 0.5,
        "uncertainty_range": [0.4, 0.6],
        "high_confidence": 0.8,
        "attention_skewness": 0.6
    },
    
    # Model weights (for blockchain storage)
    "model_weights": {
        "fusion_model_size": "~2.1M parameters",
        "extractor_xray_size": "~4M parameters",
        "extractor_histo_size": "~4M parameters",
        "extractor_ultra_size": "~4M parameters",
        "total_size": "~14.1M parameters",
        "file_format": ".h5 (Keras HDF5)",
        "storage": "IPFS (encrypted)",
        "blockchain_fields": ["IPFS_CID", "SHA256_hash", "sample_count", "accuracy"]
    },
    
    # Performance metrics
    "performance_metrics": {
        "accuracy": "Correct predictions / Total predictions",
        "auc": "Area Under ROC Curve",
        "sensitivity": "True Positive Rate (Recall)",
        "specificity": "True Negative Rate",
        "precision": "Positive Predictive Value",
        "f1_score": "Harmonic mean of Precision and Recall",
        "confusion_matrix": ["TN", "FP", "FN", "TP"]
    }
}
```

---

## 6. Implementation Workflow

### 6.1 At Hospital (Local Training)

**Step 1: Collect Patient Data**
```python
# For each patient, collect 3 images
patient_data = {
    "patient_id": "ANON_001",
    "xray_path": "/data/patient_001_xray.png",
    "histo_path": "/data/patient_001_histo.png",
    "ultra_path": "/data/patient_001_ultra.png",
    "diagnosis": 1  # 0=Benign, 1=Malignant
}
```

**Step 2: Preprocess Images**
```python
xray_img = load_and_preprocess_image(patient_data["xray_path"])
histo_img = load_and_preprocess_image(patient_data["histo_path"])
ultra_img = load_and_preprocess_image(patient_data["ultra_path"])
```

**Step 3: Extract Features**
```python
# Load pretrained extractors
extractor_xray = tf.keras.models.load_model('extractor_xray.h5')
extractor_histo = tf.keras.models.load_model('extractor_histo.h5')
extractor_ultra = tf.keras.models.load_model('extractor_ultra.h5')

# Extract features
features_xray = extractor_xray.predict(xray_img)   # (1, 1280)
features_histo = extractor_histo.predict(histo_img) # (1, 1280)
features_ultra = extractor_ultra.predict(ultra_img) # (1, 1280)

# Concatenate
combined_features = np.concatenate([features_xray, features_histo, features_ultra], axis=1)
# Shape: (1, 3840)
```

**Step 4: Train Fusion Model**
```python
# Load global model from blockchain
fusion_model = tf.keras.models.load_model('fusion_model_v1.h5')

# Train on local data (500 patients)
history = fusion_model.fit(
    X_train_local,  # (500, 3840)
    y_train_local,  # (500,)
    epochs=50,
    batch_size=32,
    validation_split=0.2
)
```

**Step 5: Save Updated Weights**
```python
fusion_model.save('fusion_model_updated.h5')

# Upload to IPFS (encrypted)
ipfs_cid = upload_to_ipfs('fusion_model_updated.h5', encrypt=True)
# Returns: "QmXxY...abc123"

# Calculate hash
file_hash = sha256('fusion_model_updated.h5')
# Returns: "0x1a2b3c..."
```

**Step 6: Submit to Blockchain**
```python
# Via smart contract interaction
contract.submitUpdate(
    encryptedUpdateCID=ipfs_cid,
    updateHash=file_hash,
    sampleCount=500,
    extractorCID="QmExtractors...xyz"
)
```

---

### 6.2 Abnormality Detection Function

**Function to detect abnormal features:**

```python
def detect_abnormal_behavior(features, feature_type="xray"):
    """
    Detect abnormal behavior in extracted features.
    
    Args:
        features: numpy array of shape (1280,) for single modality
        feature_type: "xray", "histo", or "ultra"
    
    Returns:
        dict with abnormal categories and their values
    """
    abnormal_threshold = 0.7
    abnormal_features = {}
    
    # Define category ranges based on feature_type
    if feature_type == "xray":
        categories = {
            "Density": features[0:128],
            "Calcification": features[128:256],
            "Mass": features[256:384],
            "Distortion": features[384:512],
            "Asymmetry": features[512:640],
            "Edge_Sharpness": features[640:768],
            "Texture": features[768:896],
            "Contrast": features[896:1024],
            "Lymph_Nodes": features[1024:1152],
            "Structure": features[1152:1280]
        }
    elif feature_type == "histo":
        categories = {
            "Nuclear": features[0:107],
            "Mitotic": features[107:214],
            "Density": features[214:321],
            "Tubule": features[321:428],
            "Necrosis": features[428:535],
            "Stromal": features[535:642],
            "Inflammation": features[642:749],
            "NC_Ratio": features[749:856],
            "Chromatin": features[856:963],
            "Cohesion": features[963:1070],
            "Vascular": features[1070:1177],
            "Margin": features[1177:1280]
        }
    elif feature_type == "ultra":
        categories = {
            "Echogenicity": features[0:117],
            "Shape": features[117:234],
            "Margin": features[234:351],
            "Posterior": features[351:468],
            "Orientation": features[468:585],
            "Vascularity": features[585:702],
            "Calcifications": features[702:819],
            "Elasticity": features[819:936],
            "Layers": features[936:1053],
            "Axillary": features[1053:1170],
            "Acoustic": features[1170:1280]
        }
    
    # Check each category
    for category_name, category_features in categories.items():
        mean_activation = np.mean(category_features)
        max_activation = np.max(category_features)
        
        if mean_activation > abnormal_threshold or max_activation > 0.85:
            abnormal_features[category_name] = {
                "mean_activation": float(mean_activation),
                "max_activation": float(max_activation),
                "severity": "HIGH" if max_activation > 0.85 else "MODERATE"
            }
    
    return abnormal_features

# Example usage
features_xray = extractor_xray.predict(patient_image)  # (1, 1280)
abnormal = detect_abnormal_behavior(features_xray[0], feature_type="xray")

if abnormal:
    print("⚠️ ABNORMAL BEHAVIOR DETECTED:")
    for category, details in abnormal.items():
        print(f"  - {category}: {details['severity']} (mean={details['mean_activation']:.3f})")
else:
    print("✅ All features within normal range")
```

---

### 6.3 Chart Generation Function

**Function to generate visualization charts:**

```python
def generate_feature_charts(patient_id, features_xray, features_histo, features_ultra, 
                           prediction, attention_weights):
    """
    Generate comprehensive feature visualization charts for a patient.
    
    Args:
        patient_id: Patient identifier
        features_xray: (1280,) array
        features_histo: (1280,) array
        features_ultra: (1280,) array
        prediction: Model prediction probability [0-1]
        attention_weights: [xray_weight, histo_weight, ultra_weight]
    """
    
    # Chart 1: Feature Heatmap
    plt.figure(figsize=(15, 5))
    heatmap_data = np.vstack([features_xray, features_histo, features_ultra])
    sns.heatmap(heatmap_data, cmap='RdYlBu_r', vmin=0, vmax=1,
                yticklabels=['X-Ray', 'Histopathology', 'Ultrasound'],
                cbar_kws={'label': 'Activation Intensity'})
    plt.title(f'Feature Activation Heatmap - Patient {patient_id}')
    plt.xlabel('Feature Index [0-1279]')
    plt.axvline(x=896, color='white', linestyle='--', linewidth=0.5)  # Category separators
    plt.savefig(f'charts/{patient_id}_heatmap.png', dpi=300, bbox_inches='tight')
    
    # Chart 2: Attention Weights
    plt.figure(figsize=(8, 6))
    modalities = ['X-Ray', 'Histopathology', 'Ultrasound']
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']
    plt.bar(modalities, attention_weights, color=colors)
    plt.ylabel('Attention Weight')
    plt.title(f'Multi-Head Attention Distribution - Patient {patient_id}')
    plt.ylim(0, 1)
    for i, v in enumerate(attention_weights):
        plt.text(i, v + 0.02, f'{v:.3f}', ha='center', fontweight='bold')
    plt.savefig(f'charts/{patient_id}_attention.png', dpi=300, bbox_inches='tight')
    
    # Chart 3: Prediction Confidence
    plt.figure(figsize=(8, 3))
    plt.barh(['Prediction'], [prediction], color='red' if prediction > 0.5 else 'green')
    plt.xlim(0, 1)
    plt.axvline(x=0.5, color='black', linestyle='--', linewidth=2)
    plt.axvspan(0.4, 0.6, alpha=0.2, color='yellow', label='Uncertain')
    plt.xlabel('Malignancy Probability')
    plt.title(f'Prediction: {"MALIGNANT" if prediction > 0.5 else "BENIGN"} (Confidence: {abs(prediction - 0.5)*200:.1f}%)')
    plt.legend()
    plt.savefig(f'charts/{patient_id}_prediction.png', dpi=300, bbox_inches='tight')
    
    # Chart 4: Abnormal Feature Detection
    abnormal_xray = detect_abnormal_behavior(features_xray, "xray")
    abnormal_histo = detect_abnormal_behavior(features_histo, "histo")
    abnormal_ultra = detect_abnormal_behavior(features_ultra, "ultra")
    
    all_abnormal = list(abnormal_xray.keys()) + list(abnormal_histo.keys()) + list(abnormal_ultra.keys())
    
    if all_abnormal:
        plt.figure(figsize=(12, 6))
        categories = all_abnormal[:10]  # Top 10
        values = [abnormal_xray.get(c, abnormal_histo.get(c, abnormal_ultra.get(c, {})))['mean_activation'] 
                  for c in categories]
        
        plt.barh(categories, values, color=['red' if v > 0.85 else 'orange' for v in values])
        plt.axvline(x=0.7, color='red', linestyle='--', label='Abnormal Threshold')
        plt.xlabel('Mean Activation')
        plt.title(f'⚠️ Abnormal Features Detected - Patient {patient_id}')
        plt.legend()
        plt.tight_layout()
        plt.savefig(f'charts/{patient_id}_abnormal.png', dpi=300, bbox_inches='tight')
        
        print(f"⚠️ WARNING: {len(all_abnormal)} abnormal features detected!")
    else:
        print("✅ No abnormal features detected")
    
    print(f"✅ Charts saved to charts/{patient_id}_*.png")
```

---

## Summary

### Key Takeaways

1. **Patient Data = 3 Images** (X-Ray, Histopathology, Ultrasound)
2. **Images → Features** via EfficientNetB0 (1,280 features per image = 3,840 total)
3. **Features → Weights** via training (adjusts ~2.1M parameters in fusion model)
4. **Weights → Blockchain** via IPFS CID + hash (NOT raw data)
5. **Abnormal Detection** via feature activation thresholds (>0.7 = suspicious)
6. **Charts** visualize 33 interpretable categories (10 X-Ray + 12 Histo + 11 Ultra)

### What Goes Where

| Data Type | Storage Location | Privacy |
|-----------|-----------------|---------|
| Patient images | Local hospital only | ✅ Private |
| Patient IDs | Local hospital only | ✅ Private |
| Feature vectors (3,840 dims) | Local hospital only | ✅ Private |
| Model weights (~14MB) | IPFS (encrypted) | ✅ Private |
| IPFS CID | Blockchain | 🔓 Public |
| Sample count | Blockchain | 🔓 Public |
| Accuracy metrics | Blockchain | 🔓 Public |

This ensures **complete privacy** while enabling **collaborative learning**! 🚀
