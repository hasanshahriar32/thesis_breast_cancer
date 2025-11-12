const tf = require('@tensorflow/tfjs-node');
const logger = require('../utils/logger');
const path = require('path');
const axios = require('axios');

/**
 * Enhanced Feature Extractor
 * Extracts detailed multi-level features from medical images
 * 
 * Feature Breakdown:
 * 1. EfficientNetB0 Base Features (1,280 per modality)
 * 2. Multi-Layer Features (from multiple depths)
 * 3. Statistical Features (from raw images)
 * 4. Attention Weights (from fusion model)
 * 5. Intermediate Dense Layer Activations
 * 
 * Total: ~5,000+ dimensions per patient (depending on configuration)
 */

class EnhancedFeatureExtractor {
  constructor() {
    this.models = {
      xray: null,
      histo: null,
      ultra: null,
      fusion: null
    };
    
    this.intermediateModels = {
      xray: {},
      histo: {},
      ultra: {},
      fusion: {}
    };
    
    this.isLoaded = false;
    this.IMG_SIZE = 224;
  }

  /**
   * Load all models from disk
   */
  async loadModels() {
    if (this.isLoaded) return;

    try {
      logger.info('Loading enhanced feature extraction models...');
      
      const modelPath = process.env.MODEL_PATH || path.join(__dirname, '../../Model');
      
      // Load base extractors
      this.models.xray = await tf.loadLayersModel(`file://${modelPath}/extractor_xray.h5`);
      this.models.histo = await tf.loadLayersModel(`file://${modelPath}/extractor_histo.h5`);
      this.models.ultra = await tf.loadLayersModel(`file://${modelPath}/extractor_ultra.h5`);
      this.models.fusion = await tf.loadLayersModel(`file://${modelPath}/fusion_model.h5`);
      
      // Create intermediate layer models for multi-level feature extraction
      await this.createIntermediateModels();
      
      this.isLoaded = true;
      logger.info('✓ Enhanced feature extraction models loaded successfully');
      
    } catch (error) {
      logger.error('Failed to load models:', error.message);
      throw new Error(`Model loading failed: ${error.message}`);
    }
  }

  /**
   * Create intermediate models that output features from multiple layers
   */
  async createIntermediateModels() {
    try {
      // For each modality extractor (EfficientNetB0 based)
      const modalities = ['xray', 'histo', 'ultra'];
      
      for (const modality of modalities) {
        const baseModel = this.models[modality];
        
        // Get outputs from multiple depths
        // EfficientNetB0 has blocks at different depths
        const layerNames = [
          'block2a_expand_activation',  // Early features (low-level patterns)
          'block3a_expand_activation',  // Mid-level features
          'block5a_expand_activation',  // High-level features
          'top_activation'               // Final features
        ];
        
        this.intermediateModels[modality] = {};
        
        for (const layerName of layerNames) {
          try {
            const layer = baseModel.getLayer(layerName);
            if (layer) {
              // Create model that outputs this intermediate layer
              const intermediateModel = tf.model({
                inputs: baseModel.inputs,
                outputs: layer.output
              });
              this.intermediateModels[modality][layerName] = intermediateModel;
              logger.info(`✓ Created intermediate model for ${modality}:${layerName}`);
            }
          } catch (err) {
            logger.warn(`Layer ${layerName} not found in ${modality} model`);
          }
        }
      }
      
      // For fusion model - extract attention weights and dense layer outputs
      const fusionModel = this.models.fusion;
      const fusionLayerNames = [
        'multi_head_attention',
        'dense',      // First dense layer (512 neurons)
        'dense_1',    // Second dense layer (256 neurons)
        'dense_2'     // Third dense layer (128 neurons)
      ];
      
      for (const layerName of fusionLayerNames) {
        try {
          const layer = fusionModel.getLayer(layerName);
          if (layer) {
            const intermediateModel = tf.model({
              inputs: fusionModel.inputs,
              outputs: layer.output
            });
            this.intermediateModels.fusion[layerName] = intermediateModel;
            logger.info(`✓ Created intermediate model for fusion:${layerName}`);
          }
        } catch (err) {
          logger.warn(`Layer ${layerName} not found in fusion model`);
        }
      }
      
    } catch (error) {
      logger.error('Failed to create intermediate models:', error.message);
      // Don't throw - base features will still work
    }
  }

  /**
   * Extract statistical features from raw image
   */
  extractStatisticalFeatures(imageTensor) {
    return tf.tidy(() => {
      const features = {};
      
      // Convert to grayscale for some calculations
      const gray = tf.mean(imageTensor, -1);
      
      // 1. Basic statistics
      features.mean = tf.mean(gray).arraySync();
      features.std = tf.moments(gray).variance.sqrt().arraySync();
      features.min = tf.min(gray).arraySync();
      features.max = tf.max(gray).arraySync();
      
      // 2. Histogram features (divide into 10 bins)
      const histogram = this.computeHistogram(gray, 10);
      features.histogram = histogram;
      
      // 3. Texture features (using gradient magnitude)
      const [gradX, gradY] = tf.grad((x) => x)(gray);
      const gradMag = tf.sqrt(tf.add(tf.square(gradX), tf.square(gradY)));
      features.texture_mean = tf.mean(gradMag).arraySync();
      features.texture_std = tf.moments(gradMag).variance.sqrt().arraySync();
      
      // 4. Edge density (high gradient areas)
      const edgeMask = tf.greater(gradMag, tf.scalar(0.1));
      features.edge_density = tf.mean(tf.cast(edgeMask, 'float32')).arraySync();
      
      // 5. Contrast (max - min)
      features.contrast = features.max - features.min;
      
      // 6. Energy (sum of squared pixels)
      features.energy = tf.sum(tf.square(gray)).div(tf.scalar(gray.size)).arraySync();
      
      return features;
    });
  }

  /**
   * Compute histogram of image intensities
   */
  computeHistogram(tensor, bins = 10) {
    const flattened = tensor.flatten();
    const min = tf.min(flattened).arraySync();
    const max = tf.max(flattened).arraySync();
    const binWidth = (max - min) / bins;
    
    const histogram = new Array(bins).fill(0);
    const values = flattened.arraySync();
    
    for (const value of values) {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    }
    
    // Normalize
    const total = values.length;
    return histogram.map(count => count / total);
  }

  /**
   * Extract multi-level features from a single modality
   */
  async extractModalityFeaturesEnhanced(imageBuffer, modality) {
    await this.loadModels();
    
    return tf.tidy(() => {
      const startTime = Date.now();
      
      // 1. Preprocess image
      const imageTensor = this.preprocessImage(imageBuffer);
      
      // 2. Extract statistical features from raw image
      const statisticalFeatures = this.extractStatisticalFeatures(imageTensor);
      
      // 3. Extract base EfficientNet features (1,280 dims)
      const baseFeatures = this.models[modality].predict(imageTensor);
      const baseFeaturesArray = baseFeatures.arraySync()[0];
      
      // 4. Extract multi-layer features
      const multiLayerFeatures = {};
      for (const [layerName, model] of Object.entries(this.intermediateModels[modality])) {
        const layerOutput = model.predict(imageTensor);
        // Apply global average pooling to intermediate features
        const pooled = tf.mean(layerOutput, [1, 2]);
        multiLayerFeatures[layerName] = pooled.arraySync()[0];
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        modality,
        base_features: baseFeaturesArray,
        base_dimensions: baseFeaturesArray.length,
        multi_layer_features: multiLayerFeatures,
        statistical_features: statisticalFeatures,
        processing_time_ms: processingTime,
        total_feature_count: this.countFeatures({
          base_features: baseFeaturesArray,
          multi_layer_features: multiLayerFeatures,
          statistical_features: statisticalFeatures
        })
      };
    });
  }

  /**
   * Extract fusion model features (attention weights + intermediate activations)
   */
  extractFusionFeatures(combinedFeatures) {
    return tf.tidy(() => {
      const fusionFeatures = {};
      
      // Convert combined features to tensor
      const inputTensor = tf.tensor2d([combinedFeatures]);
      
      // Extract attention weights
      if (this.intermediateModels.fusion['multi_head_attention']) {
        const attentionOutput = this.intermediateModels.fusion['multi_head_attention'].predict(inputTensor);
        fusionFeatures.attention_weights = attentionOutput.arraySync()[0];
      }
      
      // Extract dense layer activations
      const denseLayerNames = ['dense', 'dense_1', 'dense_2'];
      fusionFeatures.dense_activations = {};
      
      for (const layerName of denseLayerNames) {
        if (this.intermediateModels.fusion[layerName]) {
          const activation = this.intermediateModels.fusion[layerName].predict(inputTensor);
          fusionFeatures.dense_activations[layerName] = activation.arraySync()[0];
        }
      }
      
      return fusionFeatures;
    });
  }

  /**
   * Preprocess image buffer to tensor
   */
  preprocessImage(imageBuffer) {
    // Decode image from buffer
    const imageTensor = tf.node.decodeImage(imageBuffer, 3);
    
    // Resize to model input size
    const resized = tf.image.resizeBilinear(imageTensor, [this.IMG_SIZE, this.IMG_SIZE]);
    
    // Normalize to [-1, 1] (EfficientNet preprocessing)
    const normalized = resized.div(127.5).sub(1);
    
    // Add batch dimension
    const batched = normalized.expandDims(0);
    
    return batched;
  }

  /**
   * Count total number of features
   */
  countFeatures(featureObject) {
    let count = 0;
    
    if (Array.isArray(featureObject.base_features)) {
      count += featureObject.base_features.length;
    }
    
    if (featureObject.multi_layer_features) {
      for (const features of Object.values(featureObject.multi_layer_features)) {
        count += Array.isArray(features) ? features.length : 1;
      }
    }
    
    if (featureObject.statistical_features) {
      for (const value of Object.values(featureObject.statistical_features)) {
        if (Array.isArray(value)) {
          count += value.length;
        } else {
          count += 1;
        }
      }
    }
    
    return count;
  }

  /**
   * Main extraction function - extracts ALL features from patient images
   */
  async extractAllFeatures(imageBuffers) {
    const startTime = Date.now();
    
    try {
      // Extract features from each modality
      const xrayFeatures = await this.extractModalityFeaturesEnhanced(
        imageBuffers.xray, 
        'xray'
      );
      
      const histoFeatures = await this.extractModalityFeaturesEnhanced(
        imageBuffers.histo, 
        'histo'
      );
      
      const ultraFeatures = await this.extractModalityFeaturesEnhanced(
        imageBuffers.ultra, 
        'ultra'
      );
      
      // Combine base features for fusion model
      const combinedBaseFeatures = [
        ...xrayFeatures.base_features,
        ...histoFeatures.base_features,
        ...ultraFeatures.base_features
      ];
      
      // Extract fusion model features
      const fusionFeatures = this.extractFusionFeatures(combinedBaseFeatures);
      
      // Make prediction
      const predictionTensor = this.models.fusion.predict(
        tf.tensor2d([combinedBaseFeatures])
      );
      const prediction = predictionTensor.arraySync()[0][0];
      
      const totalTime = Date.now() - startTime;
      
      return {
        xray: xrayFeatures,
        histo: histoFeatures,
        ultra: ultraFeatures,
        fusion: fusionFeatures,
        prediction: {
          probability: prediction,
          classification: prediction >= 0.5 ? 'malignant' : 'benign',
          confidence: Math.abs(prediction - 0.5) * 2 // 0-1 scale
        },
        summary: {
          total_dimensions: this.getTotalDimensions({
            xray: xrayFeatures,
            histo: histoFeatures,
            ultra: ultraFeatures,
            fusion: fusionFeatures
          }),
          base_dimensions: 3840,
          enhanced_dimensions: this.getEnhancedDimensions({
            xray: xrayFeatures,
            histo: histoFeatures,
            ultra: ultraFeatures,
            fusion: fusionFeatures
          }),
          processing_time_ms: totalTime
        }
      };
      
    } catch (error) {
      logger.error('Enhanced feature extraction failed:', error);
      throw error;
    }
  }

  /**
   * Calculate total feature dimensions
   */
  getTotalDimensions(features) {
    let total = 0;
    
    for (const modalityFeatures of [features.xray, features.histo, features.ultra]) {
      total += modalityFeatures.total_feature_count;
    }
    
    // Add fusion features
    if (features.fusion.attention_weights) {
      total += features.fusion.attention_weights.length;
    }
    
    for (const activation of Object.values(features.fusion.dense_activations || {})) {
      total += activation.length;
    }
    
    return total;
  }

  /**
   * Calculate enhanced feature dimensions (excluding base 3840)
   */
  getEnhancedDimensions(features) {
    return this.getTotalDimensions(features) - 3840;
  }
}

module.exports = new EnhancedFeatureExtractor();
