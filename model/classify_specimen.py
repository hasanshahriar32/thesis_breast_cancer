#!/usr/bin/env python3
"""
Real Histopathology Specimen Classification using EfficientNet-B0 + Coordinate Attention.
Loads the thesis model weights from thesis/model/best_histopathology_model.pth.
"""

import sys
import os
import json
import time
import argparse
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

class FastCoordinateAttention(nn.Module):
    def __init__(self, inp, reduction=16):
        super().__init__()
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
        return identity * a_h * a_w

class FastHistopathologyModel(nn.Module):
    def __init__(self, num_classes=2, dropout_rate=0.3):
        super().__init__()
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
        features_1280 = x.view(x.size(0), -1)
        out = self.classifier(features_1280)
        return out, features_1280

def classify_image(image_path, model_path):
    start_time = time.time()
    
    if not os.path.exists(image_path):
        return {"error": f"Image not found: {image_path}"}
    if not os.path.exists(model_path):
        return {"error": f"Model weights not found: {model_path}"}

    # Load model
    model = FastHistopathologyModel(num_classes=2)
    state_dict = torch.load(model_path, map_location="cpu", weights_only=False)
    model.load_state_dict(state_dict, strict=False)
    model.eval()

    # Preprocessing
    transform = transforms.Compose([
        transforms.Resize((160, 160)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    img = Image.open(image_path).convert("RGB")
    tensor = transform(img).unsqueeze(0)

    with torch.no_grad():
        logits, features = model(tensor)
        probs = torch.softmax(logits, dim=1)[0]
        benign_prob = float(probs[0].item())
        malignant_prob = float(probs[1].item())
        pred_idx = int(torch.argmax(probs).item())
        
        feature_vector_sample = [round(float(v), 4) for v in features[0][:10].tolist()]

    latency_ms = round((time.time() - start_time) * 1000, 2)
    predicted_label = "Benign" if pred_idx == 0 else "Malignant"
    confidence = round(max(benign_prob, malignant_prob) * 100, 2)

    return {
        "success": True,
        "image_path": image_path,
        "filename": os.path.basename(image_path),
        "prediction": predicted_label,
        "confidence": confidence,
        "probabilities": {
            "benign": round(benign_prob * 100, 2),
            "malignant": round(malignant_prob * 100, 2)
        },
        "latency_ms": latency_ms,
        "model_architecture": "EfficientNet-B0 + Coordinate Attention (5.9M params)",
        "input_resolution": "160x160 RGB",
        "feature_dim": 1280,
        "feature_sample": feature_vector_sample,
        "device": "CPU (Edge Enclave Container)"
    }

def main():
    parser = argparse.ArgumentParser(description="Classify histopathology specimen image")
    parser.add_argument("--image", required=True, help="Path to histopathology slide image")
    parser.add_argument("--model", default="/home/hs32/Desktop/medchain/thesis/model/best_histopathology_model.pth", help="Path to model weights")
    args = parser.parse_args()

    result = classify_image(args.image, args.model)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
