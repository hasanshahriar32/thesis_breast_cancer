# FedProx for Federated Breast Cancer Histopathology Classification

## 1. Introduction

This document describes the federated learning (FL) aggregation methodology
used in the thesis. We compare **FedProx** (Li et al., 2020) against the
baseline **FedAvg** (McMahan et al., 2017) for training a breast cancer
histopathology classifier across three geographically distributed hospital
sites, each holding non-IID (non-identically distributed) data.

## 2. Model Architecture

The classification model follows the architecture defined in `model_code (4).ipynb`:

**EfficientNet-B0 + Fast Coordinate Attention**

| Component | Details |
|---|---|
| Backbone | EfficientNet-B0 (ImageNet pre-trained, all layers trainable) |
| Attention | Fast Coordinate Attention (Hou et al., 2021) on 1280-channel feature maps |
| Pooling | Adaptive Average Pooling → 1280-d vector |
| Classifier | Dropout(0.3) → Linear(1280, 256) → BN → ReLU → Dropout(0.15) → Linear(256, 2) |
| Total Parameters | 5,927,510 |
| Input Size | 160 × 160 × 3 |

### Centralized Training Results (Reference Baseline)

| Metric | Value |
|---|---|
| Best Validation Accuracy | 98.84% |
| Test Accuracy | 99% |
| AUC-ROC | 0.9989 |
| F1-Score | 0.9904 |
| Sensitivity (Malignant Recall) | 0.9945 |
| Specificity (Benign Recall) | 0.9815 |

## 3. Datasets

Three publicly available breast cancer histopathology datasets are used,
totalling **19,155 images**:

| Dataset | Kaggle Source | Benign | Malignant | Total |
|---|---|---:|---:|---:|
| BreaKHis | `ambarish/breakhis` | 2,480 | 5,429 | 7,909 |
| Breast Cancer Dataset | `djaidwalid/breast-cancer-dataset` | 5,000 | 5,000 | 10,000 |
| Histopathological MSI | `zoya77/breast-cancer-msi-multimodal-image-dataset` | 623 | 623 | 1,246 |
| **Combined** | | **8,103** | **11,052** | **19,155** |

### Non-IID Partitioning for Federated Simulation

Each dataset is assigned to a simulated hospital site, creating natural
statistical heterogeneity:

- **Site A (BreaKHis)** — Cancer specialty center: 7,909 samples with 31.4% benign
  ratio. Represents a hospital biased toward malignant cases, with images at
  multiple magnification levels (40×, 100×, 200×, 400×).

- **Site B (Breast Cancer Dataset)** — General screening facility: 10,000 samples
  with balanced 50/50 class distribution. The largest site by volume.

- **Site C (Histopathological MSI)** — Research hospital with multi-spectral
  imaging: 1,246 samples with balanced distribution. The smallest site,
  contributing a different imaging modality.

This partitioning captures three key forms of data heterogeneity:
- **Label skew**: varying benign-to-malignant ratios across sites
- **Quantity skew**: site sample counts range from 1,246 to 10,000
- **Domain shift**: different imaging equipment, magnifications, and staining

## 4. Federated Optimization: FedProx

### 4.1. Background — FedAvg

FedAvg (McMahan et al., 2017) proceeds in communication rounds:

1. The server broadcasts the current global model $w^t$ to all clients.
2. Each client $k$ performs $E$ epochs of SGD on its local data.
3. The server collects updated weights and computes:

$$w^{t+1} = \sum_{k} \frac{n_k}{n} \cdot w_k^{t+1}$$

where $n_k$ is the number of samples at client $k$ and $n = \sum_k n_k$.

### 4.2. FedProx — Proximal Regularization

FedProx modifies the local objective by adding a proximal term that penalizes
deviation from the global model:

$$\min_{w} \; F_k(w) + \frac{\mu}{2} \| w - w^t \|^2$$

where:
- $F_k(w)$ is the local cross-entropy loss on client $k$'s data
- $w^t$ are the global model parameters at the start of round $t$
- $\mu \geq 0$ is the proximal regularization strength

When $\mu = 0$, FedProx reduces to FedAvg. As $\mu$ increases, local updates
are more strongly constrained to stay close to the global model, reducing
"client drift" — a key problem in non-IID federated settings.

### 4.3. Why FedProx for This Application

In our multi-hospital breast cancer scenario, FedProx is particularly
beneficial because:

- The three datasets exhibit **significant label skew** (31.4% vs 50% benign ratio)
- Site sizes differ by up to **8× factor** (1,246 vs 10,000 samples)
- Different imaging modalities introduce **domain shift**

Without the proximal constraint, local models at specialized sites (e.g., Site A
with mostly malignant cases) can drift substantially from the global model,
degrading performance on underrepresented classes.

## 5. Experimental Setup

| Parameter | Value |
|---|---|
| Communication Rounds | 10 |
| Local Epochs per Round | 3 |
| Local Optimizer | Adam (lr = 1×10⁻⁴) |
| Batch Size | 64 |
| FedAvg μ | 0.0 |
| FedProx μ | 0.01 |
| μ Sweep | [0.0, 0.001, 0.005, 0.01, 0.05, 0.1, 0.5] |

## 6. References

1. **Li, T., Sahu, A. K., Zaheer, M., Sanjabi, M., Talwalkar, A., & Smith, V.** (2020). *Federated Optimization in Heterogeneous Networks*. Proceedings of Machine Learning and Systems (MLSys).

2. **McMahan, B., Moore, E., Ramage, D., Hampson, S., & Arcas, B. A. y.** (2017). *Communication-Efficient Learning of Deep Networks from Decentralized Data*. Proceedings of the 20th International Conference on Artificial Intelligence and Statistics (AISTATS).

3. **Hou, Q., Zhou, D., & Feng, J.** (2021). *Coordinate Attention for Efficient Mobile Network Design*. IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR).

4. **Tan, M., & Le, Q. V.** (2019). *EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks*. International Conference on Machine Learning (ICML).

5. **Spanhol, F. A., Oliveira, L. S., Petitjean, C., & Heutte, L.** (2016). *A Dataset for Breast Cancer Histopathological Image Classification*. IEEE Transactions on Biomedical Engineering.
