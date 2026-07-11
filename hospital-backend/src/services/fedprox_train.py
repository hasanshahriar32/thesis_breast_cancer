#!/usr/bin/env python3
"""
FedProx Local Training Script for Hospital Nodes

Implements the client-side (hospital-side) component of FedProx, which adds
a proximal regularization term to the local training objective:

    min_w F_k(w) + (mu/2) * ||w - w^t||^2

where:
    F_k(w) = local loss function (CrossEntropyLoss for binary classification)
    w      = current local model parameters being optimized
    w^t    = global model parameters received from the server at the start of the round
    mu     = proximal hyperparameter controlling regularization strength

The proximal term constrains local model updates to stay close to the global
model, preventing "client drift" — a key problem when hospitals have non-IID
data distributions (e.g., varying disease prevalence, different scanner types,
diverse patient demographics across Boston, London, and Tokyo hospitals).

When mu = 0, FedProx reduces to standard FedAvg (no proximal regularization).

Model Architecture: EfficientNet-B0 + Coordinate Attention (~5.9M parameters)
Task: Binary Classification (Benign vs Malignant)
Input: 160×160 RGB histopathology images
Framework: PyTorch 2.0+

References:
    Li, T., Sahu, A. K., Zaheer, M., Sanjabi, M., Talwalkar, A., & Smith, V.
    (2020). Federated Optimization in Heterogeneous Networks.
    Proceedings of Machine Learning and Systems (MLSys), 2, 429-450.

Usage:
    python fedprox_train.py <config_json>

Config JSON format:
    {
        "global_model_path": "/path/to/global_model.pth",
        "data_dir": "/path/to/training/data",
        "output_path": "/path/to/save/local_model.pth",
        "mu": 0.01,
        "epochs": 5,
        "batch_size": 32,
        "learning_rate": 0.001
    }
"""

import sys
import json
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms, models
from PIL import Image
import numpy as np
from collections import OrderedDict
import time


# ============================================================================
# Model Architecture (must match training notebook and inference.py exactly)
# ============================================================================

class FastCoordinateAttention(nn.Module):
    """Coordinate Attention mechanism — matches training code exactly."""
    def __init__(self, inp, reduction=16):
        super(FastCoordinateAttention, self).__init__()
        self.pool_h = nn.AdaptiveAvgPool2d((None, 1))
        self.pool_w = nn.AdaptiveAvgPool2d((1, None))

        mip = max(8, inp // reduction)

        self.conv1 = nn.Conv2d(inp, mip, kernel_size=1, stride=1, padding=0)
        self.bn1 = nn.BatchNorm2d(mip)
        self.act = nn.ReLU(inplace=True)

        self.conv_h = nn.Conv2d(mip, inp, kernel_size=1, stride=1, padding=0)
        self.conv_w = nn.Conv2d(mip, inp, kernel_size=1, stride=1, padding=0)

    def forward(self, x):
        identity = x
        n, c, h, w = x.size()

        x_h = self.pool_h(x)
        x_w = self.pool_w(x).permute(0, 1, 3, 2)

        y = torch.cat([x_h, x_w], dim=2)
        y = self.conv1(y)
        y = self.bn1(y)
        y = self.act(y)

        x_h, x_w = torch.split(y, [h, w], dim=2)
        x_w = x_w.permute(0, 1, 3, 2)

        a_h = torch.sigmoid(self.conv_h(x_h))
        a_w = torch.sigmoid(self.conv_w(x_w))

        out = identity * a_h * a_w
        return out


class FastHistopathologyModel(nn.Module):
    """EfficientNet-B0 + Coordinate Attention — matches training code exactly."""
    def __init__(self, num_classes=2, dropout_rate=0.3):
        super(FastHistopathologyModel, self).__init__()

        self.base_model = models.efficientnet_b0(weights=None)
        self.features = self.base_model.features
        self.attention = FastCoordinateAttention(inp=1280)
        self.avgpool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(1280, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout_rate / 2),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.attention(x)
        x = self.avgpool(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x


# ============================================================================
# Dataset
# ============================================================================

class HistopathologyDataset(Dataset):
    """
    Dataset for histopathology images.

    Expected directory structure:
        data_dir/
        ├── benign/
        │   ├── image1.png
        │   └── ...
        └── malignant/
            ├── image1.png
            └── ...
    """
    def __init__(self, data_dir, transform=None):
        self.data_dir = data_dir
        self.transform = transform or transforms.Compose([
            transforms.Resize((160, 160)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

        self.samples = []
        self.labels = []

        # Load benign samples (label = 0)
        benign_dir = os.path.join(data_dir, 'benign')
        if os.path.exists(benign_dir):
            for fname in os.listdir(benign_dir):
                if fname.lower().endswith(('.png', '.jpg', '.jpeg', '.tif', '.tiff')):
                    self.samples.append(os.path.join(benign_dir, fname))
                    self.labels.append(0)

        # Load malignant samples (label = 1)
        malignant_dir = os.path.join(data_dir, 'malignant')
        if os.path.exists(malignant_dir):
            for fname in os.listdir(malignant_dir):
                if fname.lower().endswith(('.png', '.jpg', '.jpeg', '.tif', '.tiff')):
                    self.samples.append(os.path.join(malignant_dir, fname))
                    self.labels.append(1)

        print(f"  Dataset loaded: {len(self.samples)} samples "
              f"(benign: {self.labels.count(0)}, malignant: {self.labels.count(1)})")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        image = Image.open(self.samples[idx]).convert('RGB')
        if self.transform:
            image = self.transform(image)
        return image, self.labels[idx]


# ============================================================================
# FedProx Local Training
# ============================================================================

def compute_proximal_term(model, global_params):
    """
    Compute the FedProx proximal regularization term:
        (mu/2) * ||w - w^t||^2

    This is the L2 distance between current local model parameters and
    the global model parameters received at the start of the round.

    Args:
        model: Current local model being trained
        global_params: List of detached global model parameter tensors

    Returns:
        torch.Tensor: The proximal term (scalar), without the mu/2 factor
    """
    proximal_term = 0.0
    for local_w, global_w in zip(model.parameters(), global_params):
        proximal_term += (local_w - global_w).norm(2) ** 2
    return proximal_term


def fedprox_train(config):
    """
    Perform FedProx local training at a hospital node.

    This function:
    1. Loads the global model received from the server
    2. Trains locally with the proximal term added to the loss
    3. Saves the updated local model for submission to the FL network

    Args:
        config: Dict with training configuration:
            - global_model_path: Path to the global model weights
            - data_dir: Path to local training data
            - output_path: Where to save the trained local model
            - mu: FedProx proximal hyperparameter (default: 0.01)
            - epochs: Number of local training epochs (default: 5)
            - batch_size: Training batch size (default: 32)
            - learning_rate: Learning rate (default: 0.001)

    Returns:
        dict: Training results including metrics
    """
    # Configuration
    global_model_path = config['global_model_path']
    data_dir = config['data_dir']
    output_path = config['output_path']
    mu = config.get('mu', 0.01)  # FedProx proximal parameter
    epochs = config.get('epochs', 5)
    batch_size = config.get('batch_size', 32)
    learning_rate = config.get('learning_rate', 0.001)
    hospital_name = config.get('hospital_name', 'unknown')

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"\n{'='*60}")
    print(f"FedProx Local Training — {hospital_name}")
    print(f"{'='*60}")
    print(f"  Device:         {device}")
    print(f"  Proximal μ:     {mu}")
    print(f"  Epochs:         {epochs}")
    print(f"  Batch size:     {batch_size}")
    print(f"  Learning rate:  {learning_rate}")
    print(f"  Global model:   {global_model_path}")
    print(f"  Data dir:       {data_dir}")
    print(f"  Output:         {output_path}")
    print()

    # ---- 1. Load the global model ----
    model = FastHistopathologyModel(num_classes=2)
    state_dict = torch.load(global_model_path, map_location='cpu', weights_only=False)
    if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
        state_dict = state_dict['model_state_dict']
    elif isinstance(state_dict, dict) and 'state_dict' in state_dict:
        state_dict = state_dict['state_dict']
    model.load_state_dict(state_dict, strict=True)
    model = model.to(device)
    print(f"  ✓ Global model loaded ({sum(p.numel() for p in model.parameters()):,} parameters)")

    # ---- 2. Store global model parameters for proximal term ----
    # These are w^t — the global model weights at the start of this round
    global_params = [p.detach().clone() for p in model.parameters()]

    # ---- 3. Prepare dataset and dataloader ----
    dataset = HistopathologyDataset(data_dir)
    if len(dataset) == 0:
        raise ValueError(f"No training data found in {data_dir}")

    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=2,
        pin_memory=True if device.type == 'cuda' else False
    )

    # ---- 4. Training setup ----
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)

    # ---- 5. FedProx local training loop ----
    model.train()
    training_start = time.time()
    total_loss_history = []
    ce_loss_history = []
    prox_loss_history = []

    for epoch in range(epochs):
        epoch_loss = 0.0
        epoch_ce_loss = 0.0
        epoch_prox_loss = 0.0
        correct = 0
        total = 0

        for batch_idx, (images, labels) in enumerate(dataloader):
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()

            # Forward pass
            outputs = model(images)

            # Standard cross-entropy loss: F_k(w)
            ce_loss = criterion(outputs, labels)

            # ============================================
            # FedProx Proximal Term: (mu/2) * ||w - w^t||^2
            # This is the key difference from FedAvg
            # ============================================
            proximal_term = compute_proximal_term(model, global_params)
            prox_loss = (mu / 2.0) * proximal_term

            # Total loss: F_k(w) + (mu/2) * ||w - w^t||^2
            total_loss = ce_loss + prox_loss
            # ============================================

            # Backward pass and optimization
            total_loss.backward()
            optimizer.step()

            # Track metrics
            epoch_loss += total_loss.item()
            epoch_ce_loss += ce_loss.item()
            epoch_prox_loss += prox_loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

        # Epoch statistics
        avg_loss = epoch_loss / len(dataloader)
        avg_ce = epoch_ce_loss / len(dataloader)
        avg_prox = epoch_prox_loss / len(dataloader)
        accuracy = 100.0 * correct / total

        total_loss_history.append(avg_loss)
        ce_loss_history.append(avg_ce)
        prox_loss_history.append(avg_prox)

        print(f"  Epoch [{epoch+1}/{epochs}] | "
              f"Loss: {avg_loss:.4f} (CE: {avg_ce:.4f} + Prox: {avg_prox:.4f}) | "
              f"Acc: {accuracy:.2f}%")

    training_duration = time.time() - training_start

    # ---- 6. Evaluate on training data (for reporting metrics) ----
    model.eval()
    correct = 0
    total = 0
    tp = fp = tn = fn = 0
    all_probs = []
    all_labels = []

    with torch.no_grad():
        for images, labels in dataloader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            _, predicted = torch.max(outputs.data, 1)

            total += labels.size(0)
            correct += (predicted == labels).sum().item()

            # Confusion matrix components (malignant = positive = class 1)
            for pred, label in zip(predicted, labels):
                if pred == 1 and label == 1:
                    tp += 1
                elif pred == 1 and label == 0:
                    fp += 1
                elif pred == 0 and label == 0:
                    tn += 1
                elif pred == 0 and label == 1:
                    fn += 1

            all_probs.extend(probs[:, 1].cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    final_accuracy = 100.0 * correct / total
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

    # AUC-ROC calculation
    try:
        from sklearn.metrics import roc_auc_score
        auc_score = roc_auc_score(all_labels, all_probs)
    except (ImportError, ValueError):
        auc_score = 0.0
        print("  ⚠ sklearn not available — AUC not computed")

    # ---- 7. Save locally trained model ----
    torch.save({
        'model_state_dict': model.state_dict(),
        'training_info': {
            'algorithm': 'FedProx',
            'mu': mu,
            'epochs': epochs,
            'batch_size': batch_size,
            'learning_rate': learning_rate,
            'training_duration_seconds': training_duration,
            'hospital': hospital_name,
            'total_samples': len(dataset),
            'final_accuracy': final_accuracy,
            'sensitivity': sensitivity,
            'specificity': specificity,
            'auc_score': auc_score,
            'loss_history': {
                'total': total_loss_history,
                'cross_entropy': ce_loss_history,
                'proximal': prox_loss_history
            }
        }
    }, output_path)

    # ---- 8. Print summary ----
    print(f"\n{'='*60}")
    print(f"FedProx Training Complete — {hospital_name}")
    print(f"{'='*60}")
    print(f"  Accuracy:     {final_accuracy:.2f}%")
    print(f"  AUC-ROC:      {auc_score:.4f}")
    print(f"  Sensitivity:  {sensitivity:.4f}")
    print(f"  Specificity:  {specificity:.4f}")
    print(f"  Samples:      {len(dataset)}")
    print(f"  Duration:     {training_duration:.1f}s")
    print(f"  Proximal μ:   {mu}")
    print(f"  Model saved:  {output_path}")
    print()

    return {
        'success': True,
        'hospital': hospital_name,
        'samples': len(dataset),
        'accuracy': final_accuracy,
        'auc_score': auc_score,
        'sensitivity': sensitivity,
        'specificity': specificity,
        'training_duration': training_duration,
        'mu': mu,
        'output_path': output_path
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python fedprox_train.py <config_json>", file=sys.stderr)
        print("\nConfig JSON format:", file=sys.stderr)
        print(json.dumps({
            "global_model_path": "/path/to/global_model.pth",
            "data_dir": "/path/to/training/data",
            "output_path": "/path/to/save/local_model.pth",
            "mu": 0.01,
            "epochs": 5,
            "batch_size": 32,
            "learning_rate": 0.001,
            "hospital_name": "Boston Medical Center"
        }, indent=2), file=sys.stderr)
        sys.exit(1)

    config_path = sys.argv[1]

    with open(config_path, 'r') as f:
        config = json.load(f)

    result = fedprox_train(config)

    # Output result as JSON for the Node.js backend to parse
    print(json.dumps(result))


if __name__ == '__main__':
    main()
