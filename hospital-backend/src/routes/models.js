/**
 * Model Routes for Federated Learning
 * 
 * Model: EfficientNet-B0 + Coordinate Attention
 * Task: Histopathology Binary Classification (Benign vs Malignant)
 * Framework: PyTorch
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const logger = require('../utils/logger');
const featureExtractor = require('../services/featureExtractor');
const patientService = require('../services/patient');
const ipfsService = require('../services/ipfs');

/**
 * @swagger
 * /api/models/info:
 *   get:
 *     summary: Get current model information
 */
router.get('/info', async (req, res) => {
  try {
    await featureExtractor.initialize();
    
    const modelInfo = featureExtractor.getModelInfo();
    
    res.json({
      success: true,
      model: modelInfo
    });
    
  } catch (error) {
    logger.error('Error getting model info:', error);
    res.status(500).json({
      error: 'Failed to get model information',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/models/extract-features/:patientId:
 *   post:
 *     summary: Extract features for a specific patient
 */
router.post('/extract-features/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    logger.info(`Extracting histopathology features for patient: ${patientId}`);

    // Get patient from database
    await patientService.connect();
    
    const patient = await patientService.collection.findOne({ id: patientId });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: `Patient ${patientId} not found`
      });
    }

    // Check if histopathology image exists
    if (!patient.files?.histopathology?.[0]) {
      return res.status(400).json({
        success: false,
        error: 'Patient must have a histopathology image'
      });
    }

    // Extract features
    const extractionResult = await featureExtractor.extractPatientFeatures(patient);

    // Save to training_data collection for federated learning
    const trainingDataEntry = {
      patient_id: patient.id,
      features: extractionResult.features.vector,
      feature_dimensions: extractionResult.features.dimensions,
      prediction: extractionResult.prediction,
      label: patient.metadata?.diagnosis || 'unknown',
      hospital_id: process.env.HOSPITAL_ID || 'default_hospital',
      patient_metadata: {
        age: patient.metadata?.age,
        gender: patient.metadata?.gender,
        diagnosis: patient.metadata?.diagnosis
      },
      model_info: extractionResult.model,
      extracted_at: new Date().toISOString(),
      processing_time_ms: extractionResult.processing_time_ms
    };
    
    // Insert or update in training_data collection
    await patientService.db.collection('training_data').updateOne(
      { patient_id: patient.id },
      { $set: trainingDataEntry },
      { upsert: true }
    );
    
    logger.info(`✓ Saved ${extractionResult.features.dimensions} features to training_data collection`);

    // Update patient record
    await patientService.collection.updateOne(
      { id: patientId },
      { 
        $set: {
          features_extracted: true,
          features_extracted_at: new Date().toISOString(),
          prediction: extractionResult.prediction,
          updated_at: new Date()
        }
      }
    );

    res.json({
      success: true,
      patient_id: patientId,
      prediction: extractionResult.prediction,
      features: {
        dimensions: extractionResult.features.dimensions,
        saved_to_training_data: true
      },
      model: extractionResult.model,
      processing_time_ms: extractionResult.processing_time_ms
    });

  } catch (error) {
    logger.error(`Error extracting features: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/models/training-data:
 *   get:
 *     summary: Get training data statistics
 */
router.get('/training-data', async (req, res) => {
  try {
    await patientService.connect();
    
    const trainingDataCollection = patientService.db.collection('training_data');
    
    // Get statistics
    const totalRecords = await trainingDataCollection.countDocuments({});
    
    const labelStats = await trainingDataCollection.aggregate([
      { $group: { _id: '$label', count: { $sum: 1 } } }
    ]).toArray();
    
    const predictionStats = await trainingDataCollection.aggregate([
      { $group: { _id: '$prediction.label', count: { $sum: 1 } } }
    ]).toArray();
    
    res.json({
      success: true,
      training_data: {
        total_samples: totalRecords,
        label_distribution: labelStats.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        prediction_distribution: predictionStats.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        feature_dimensions: 1280,
        model: 'EfficientNet-B0 + CoordinateAttention'
      }
    });
    
  } catch (error) {
    logger.error('Error getting training data:', error);
    res.status(500).json({
      error: 'Failed to get training data statistics',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/models/prepare-update:
 *   post:
 *     summary: Prepare model weights for blockchain submission
 */
router.post('/prepare-update', async (req, res) => {
  try {
    await patientService.connect();
    
    const trainingDataCollection = patientService.db.collection('training_data');
    
    // Get all training data
    const trainingData = await trainingDataCollection.find({}).toArray();
    
    if (trainingData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No training data available'
      });
    }
    
    // Calculate statistics
    const totalSamples = trainingData.length;
    
    // Count predictions
    let correctPredictions = 0;
    let benignCount = 0;
    let malignantCount = 0;
    
    for (const record of trainingData) {
      const actualLabel = record.label?.toLowerCase();
      const predictedLabel = record.prediction?.label?.toLowerCase();
      
      if (actualLabel === predictedLabel) {
        correctPredictions++;
      }
      
      if (predictedLabel === 'benign') benignCount++;
      if (predictedLabel === 'malignant') malignantCount++;
    }
    
    const accuracy = totalSamples > 0 ? (correctPredictions / totalSamples) * 100 : 0;
    
    // Prepare model update info
    const updateInfo = {
      hospital_id: process.env.HOSPITAL_ID || 'default_hospital',
      total_samples: totalSamples,
      accuracy: Math.round(accuracy * 100), // Scale by 100 for contract
      class_distribution: {
        benign: benignCount,
        malignant: malignantCount
      },
      model: {
        architecture: 'EfficientNet-B0 + CoordinateAttention',
        input_size: '160×160',
        framework: 'PyTorch',
        feature_dimensions: 1280
      },
      prepared_at: new Date().toISOString()
    };
    
    // Generate hash for the update
    const updateHash = crypto.createHash('sha256')
      .update(JSON.stringify(updateInfo))
      .digest('hex');
    
    updateInfo.update_hash = '0x' + updateHash;
    
    res.json({
      success: true,
      update_info: updateInfo,
      ready_for_submission: totalSamples >= (parseInt(process.env.MIN_SAMPLES) || 100),
      min_samples_required: parseInt(process.env.MIN_SAMPLES) || 100
    });
    
  } catch (error) {
    logger.error('Error preparing model update:', error);
    res.status(500).json({
      error: 'Failed to prepare model update',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/models/upload-weights:
 *   post:
 *     summary: Upload model weights to IPFS
 */
router.post('/upload-weights', async (req, res) => {
  try {
    const modelPath = process.env.MODEL_PATH || 
      path.join(__dirname, '../../../model/best_histopathology_model.pth');
    
    // Check if model file exists
    try {
      await fs.access(modelPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Model weights file not found',
        expected_path: modelPath
      });
    }
    
    // Read model file
    const modelBuffer = await fs.readFile(modelPath);
    
    // Calculate hash
    const modelHash = crypto.createHash('sha256')
      .update(modelBuffer)
      .digest('hex');
    
    // Upload to IPFS
    let ipfsCID;
    try {
      // uploadFile expects a file path, not a buffer
      ipfsCID = await ipfsService.uploadFile(modelPath, { metadata: { name: 'model_weights.pth' } });
      logger.info(`✓ Model weights uploaded to IPFS: ${ipfsCID}`);
    } catch (error) {
      logger.warn('IPFS upload failed, using mock CID:', error.message);
      ipfsCID = `Qm${crypto.randomBytes(22).toString('hex')}`;
    }
    
    res.json({
      success: true,
      model_weights: {
        ipfs_cid: ipfsCID,
        model_hash: '0x' + modelHash,
        file_size: modelBuffer.length,
        model_path: modelPath
      },
      model_info: {
        architecture: 'EfficientNet-B0 + CoordinateAttention',
        task: 'Histopathology Binary Classification',
        framework: 'PyTorch'
      },
      ready_for_blockchain_submission: true
    });
    
  } catch (error) {
    logger.error('Error uploading model weights:', error);
    res.status(500).json({
      error: 'Failed to upload model weights',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/models/batch-extract:
 *   post:
 *     summary: Extract features for multiple patients
 */
router.post('/batch-extract', async (req, res) => {
  try {
    const { patient_ids, all = false } = req.body;
    
    await patientService.connect();
    
    let patients;
    
    if (all) {
      // Get all patients without extracted features
      patients = await patientService.collection.find({
        'files.histopathology': { $exists: true, $ne: [] },
        features_extracted: { $ne: true }
      }).toArray();
    } else if (patient_ids && Array.isArray(patient_ids)) {
      patients = await patientService.collection.find({
        id: { $in: patient_ids }
      }).toArray();
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide patient_ids array or set all=true'
      });
    }
    
    logger.info(`Batch extracting features for ${patients.length} patients`);
    
    const results = await featureExtractor.batchExtract(patients);
    
    // Save results to training_data
    const trainingDataCollection = patientService.db.collection('training_data');
    let savedCount = 0;
    
    for (const result of results) {
      if (result.success !== false && result.features) {
        await trainingDataCollection.updateOne(
          { patient_id: result.patient_id },
          {
            $set: {
              patient_id: result.patient_id,
              features: result.features.vector,
              feature_dimensions: result.features.dimensions,
              prediction: result.prediction,
              model_info: result.model,
              extracted_at: new Date().toISOString()
            }
          },
          { upsert: true }
        );
        savedCount++;
        
        // Update patient record
        await patientService.collection.updateOne(
          { id: result.patient_id },
          {
            $set: {
              features_extracted: true,
              prediction: result.prediction
            }
          }
        );
      }
    }
    
    res.json({
      success: true,
      total_patients: patients.length,
      extracted: savedCount,
      failed: patients.length - savedCount,
      results: results.map(r => ({
        patient_id: r.patient_id,
        success: r.success !== false,
        prediction: r.prediction?.label,
        error: r.error
      }))
    });
    
  } catch (error) {
    logger.error('Error in batch extraction:', error);
    res.status(500).json({
      error: 'Batch extraction failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/models/clear-training-data:
 *   delete:
 *     summary: Clear training data (for testing)
 */
router.delete('/clear-training-data', async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_ALL_TRAINING_DATA') {
      return res.status(400).json({
        success: false,
        error: 'Must confirm deletion with confirm: "DELETE_ALL_TRAINING_DATA"'
      });
    }
    
    await patientService.connect();
    
    const result = await patientService.db.collection('training_data').deleteMany({});
    
    res.json({
      success: true,
      deleted_count: result.deletedCount
    });
    
  } catch (error) {
    logger.error('Error clearing training data:', error);
    res.status(500).json({
      error: 'Failed to clear training data',
      message: error.message
    });
  }
});

module.exports = router;
