/**
 * Feature Extractor Service for Histopathology Classification
 * 
 * Model: EfficientNet-B0 + Coordinate Attention
 * Task: Binary Classification (Benign vs Malignant)
 * Input: 160×160 RGB histopathology images
 * Framework: PyTorch (inference via Python subprocess)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const encryptionService = require('./encryption');
const axios = require('axios');

class FeatureExtractor {
  constructor() {
    this.modelPath = null;
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.isInitialized = false;
    this.IMG_SIZE = 160; // EfficientNet-B0 input size for this model
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing Histopathology Feature Extractor...');
      logger.info('Model: EfficientNet-B0 + Coordinate Attention');
      logger.info('Task: Binary Classification (Benign vs Malignant)');
      
      // Find model path
      this.modelPath = process.env.MODEL_PATH || path.join(__dirname, '../../../model/best_histopathology_model.pth');
      
      // Check if model exists
      try {
        await fs.access(this.modelPath);
        logger.info(`✓ Model found at: ${this.modelPath}`);
      } catch {
        logger.warn(`⚠️ Model not found at ${this.modelPath} - will use mock inference`);
        this.modelPath = null;
      }

      // Check if Python inference script exists
      this.inferenceScript = path.join(__dirname, 'inference.py');
      try {
        await fs.access(this.inferenceScript);
        logger.info(`✓ Inference script found at: ${this.inferenceScript}`);
      } catch {
        logger.warn('⚠️ Inference script not found - creating it...');
        await this.createInferenceScript();
      }

      this.isInitialized = true;
      logger.info('✓ Histopathology Feature Extractor initialized');
      
    } catch (error) {
      logger.error('Failed to initialize feature extractor:', error);
      throw new Error('Feature extraction initialization failed');
    }
  }

  /**
   * Create Python inference script for PyTorch model
   * Architecture must exactly match the training code (model_code notebook)
   */
  async createInferenceScript() {
    const scriptContent = `#!/usr/bin/env python3
"""
Histopathology Image Classification Inference Script
Model: EfficientNet-B0 + Coordinate Attention (FastHistopathologyModel)
Architecture matches: model/model_code (1).ipynb training code

State dict key prefixes:
  - base_model.*   (original EfficientNet-B0 backbone, kept for reference)
  - features.*     (fine-tuned backbone features, used for inference)
  - attention.*    (Coordinate Attention: conv1, bn1, conv_h, conv_w)
  - classifier.*   (1: Linear 1280->256, 2: BN1d 256, 5: Linear 256->2)
"""

import sys
import json
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import numpy as np


class FastCoordinateAttention(nn.Module):
    """Coordinate Attention mechanism - must match training code exactly"""
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

        self.last_attention = None

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

        self.last_attention = a_h * a_w

        out = identity * self.last_attention
        return out


class FastHistopathologyModel(nn.Module):
    """EfficientNet-B0 + Coordinate Attention - must match training code exactly"""
    def __init__(self, num_classes=2, dropout_rate=0.3):
        super(FastHistopathologyModel, self).__init__()

        # Use EfficientNet-B0
        self.base_model = models.efficientnet_b0(weights=None)

        # Feature extraction (creates self.features as alias)
        self.features = self.base_model.features

        # Coordinate Attention on 1280-dim feature maps
        self.attention = FastCoordinateAttention(inp=1280)

        # Pooling
        self.avgpool = nn.AdaptiveAvgPool2d(1)

        # Classifier: Dropout -> Linear(1280,256) -> BN -> ReLU -> Dropout -> Linear(256,2)
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

    def extract_features(self, x):
        """Extract 1280-dim feature vector before classification head"""
        x = self.features(x)
        x = self.attention(x)
        x = self.avgpool(x)
        return x.view(x.size(0), -1)


def load_model(model_path):
    model = FastHistopathologyModel(num_classes=2)
    state_dict = torch.load(model_path, map_location='cpu', weights_only=False)
    # Checkpoint is a raw state_dict (OrderedDict), not wrapped in a dict
    if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
        state_dict = state_dict['model_state_dict']
    model.load_state_dict(state_dict, strict=True)
    model.eval()
    return model


def preprocess_image(image_path):
    transform = transforms.Compose([
        transforms.Resize((160, 160)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    image = Image.open(image_path).convert('RGB')
    return transform(image).unsqueeze(0)


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: inference.py <model_path> <image_path>"}))
        sys.exit(1)

    model_path = sys.argv[1]
    image_path = sys.argv[2]

    try:
        model = load_model(model_path)
        input_tensor = preprocess_image(image_path)

        with torch.no_grad():
            features = model.extract_features(input_tensor)
            output = model(input_tensor)
            probabilities = torch.softmax(output, dim=1)

        predicted_class = torch.argmax(probabilities, dim=1).item()
        confidence = probabilities[0][predicted_class].item()

        result = {
            "success": True,
            "prediction": {
                "class": predicted_class,
                "label": "Malignant" if predicted_class == 1 else "Benign",
                "confidence": confidence,
                "probabilities": {
                    "benign": probabilities[0][0].item(),
                    "malignant": probabilities[0][1].item()
                }
            },
            "features": {
                "vector": features[0].tolist(),
                "dimensions": features.shape[1]
            }
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
`;

    await fs.writeFile(this.inferenceScript, scriptContent);
    logger.info(`✓ Created inference script at ${this.inferenceScript}`);
  }

  /**
   * Run Python inference on an image
   * @param {string} imagePath - Path to the histopathology image
   * @returns {Promise<Object>} Prediction and feature results
   */
  async runInference(imagePath) {
    return new Promise((resolve, reject) => {
      if (!this.modelPath) {
        // Return mock results if model not available
        resolve(this.getMockInference());
        return;
      }

      const python = spawn(this.pythonPath, [
        this.inferenceScript,
        this.modelPath,
        imagePath
      ]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          logger.error(`Python inference failed: ${stderr}`);
          resolve(this.getMockInference());
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (e) {
          logger.error(`Failed to parse inference result: ${stdout}`);
          resolve(this.getMockInference());
        }
      });

      python.on('error', (err) => {
        logger.error(`Failed to start Python process: ${err.message}`);
        resolve(this.getMockInference());
      });
    });
  }

  /**
   * Mock inference for development/testing
   */
  getMockInference() {
    const prediction = Math.random() > 0.5 ? 1 : 0;
    const confidence = 0.7 + Math.random() * 0.25;
    
    // Generate mock 1280-dimensional feature vector (EfficientNet-B0 output)
    const features = Array(1280).fill(0).map(() => Math.random() * 2 - 1);
    
    return {
      success: true,
      mock: true,
      prediction: {
        class: prediction,
        label: prediction === 1 ? "Malignant" : "Benign",
        confidence: confidence,
        probabilities: {
          benign: prediction === 0 ? confidence : 1 - confidence,
          malignant: prediction === 1 ? confidence : 1 - confidence
        }
      },
      features: {
        vector: features,
        dimensions: 1280
      }
    };
  }

  /**
   * Extract features from an image file
   * @param {string} imagePath - Path to histopathology image
   * @returns {Promise<Object>} Feature extraction results
   */
  async extractFromFile(imagePath) {
    await this.initialize();
    
    logger.info(`Extracting features from: ${imagePath}`);
    const startTime = Date.now();
    
    const result = await this.runInference(imagePath);
    
    return {
      ...result,
      processing_time_ms: Date.now() - startTime,
      image_path: imagePath
    };
  }

  /**
   * Extract features from encrypted blob storage
   * @param {string} blobUrl - URL to encrypted image in blob storage
   * @returns {Promise<Object>} Feature extraction results
   */
  async extractFromBlob(blobUrl) {
    await this.initialize();
    
    logger.info(`Extracting features from blob: ${blobUrl}`);
    const startTime = Date.now();
    
    try {
      // Download encrypted image
      const response = await axios.get(blobUrl, { responseType: 'arraybuffer' });
      const encryptedData = Buffer.from(response.data);
      
      // Decrypt image
      const decryptedData = encryptionService.decryptBuffer(encryptedData);
      
      // Save to temp file for inference
      const tempPath = path.join('/tmp', `histo_${Date.now()}.png`);
      await fs.writeFile(tempPath, decryptedData);
      
      // Run inference
      const result = await this.runInference(tempPath);
      
      // Clean up temp file
      await fs.unlink(tempPath).catch(() => {});
      
      return {
        ...result,
        processing_time_ms: Date.now() - startTime,
        source: 'blob'
      };
      
    } catch (error) {
      logger.error('Failed to extract from blob:', error);
      return {
        ...this.getMockInference(),
        processing_time_ms: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Extract features for a patient record
   * @param {Object} patient - Patient record with histopathology image
   * @returns {Promise<Object>} Complete feature extraction results
   */
  async extractPatientFeatures(patient) {
    await this.initialize();
    
    logger.info(`Extracting histopathology features for patient: ${patient.id}`);
    const startTime = Date.now();
    
    // Get histopathology image URL
    const histoFile = patient.files?.histopathology?.[0];
    
    if (!histoFile) {
      throw new Error('Patient must have a histopathology image');
    }
    
    let result;
    
    if (histoFile.blob_storage?.url) {
      // Extract from blob storage (preferred)
      result = await this.extractFromBlob(histoFile.blob_storage.url);
    } else if (histoFile.local_path) {
      // Extract from local file
      result = await this.extractFromFile(histoFile.local_path);
    } else {
      throw new Error('No valid image source found for patient');
    }
    
    return {
      patient_id: patient.id,
      prediction: result.prediction,
      features: result.features,
      processing_time_ms: Date.now() - startTime,
      model: {
        architecture: 'EfficientNet-B0 + CoordinateAttention',
        input_size: '160x160',
        framework: 'PyTorch'
      },
      mock: result.mock || false
    };
  }

  /**
   * Batch extract features for multiple patients
   * @param {Array} patients - Array of patient records
   * @returns {Promise<Array>} Array of feature extraction results
   */
  async batchExtract(patients) {
    await this.initialize();
    
    logger.info(`Batch extracting features for ${patients.length} patients`);
    
    const results = [];
    for (const patient of patients) {
      try {
        const result = await this.extractPatientFeatures(patient);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to extract features for patient ${patient.id}:`, error);
        results.push({
          patient_id: patient.id,
          error: error.message,
          success: false
        });
      }
    }
    
    return results;
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      architecture: 'EfficientNet-B0 + Coordinate Attention',
      task: 'Binary Classification (Benign vs Malignant)',
      input_size: '160×160 RGB',
      feature_dimensions: 1280,
      parameters: '~5.9M',
      framework: 'PyTorch 2.0+',
      model_path: this.modelPath,
      initialized: this.isInitialized
    };
  }
}

// Export singleton instance
const featureExtractor = new FeatureExtractor();
module.exports = featureExtractor;
