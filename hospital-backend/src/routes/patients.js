/**
 * Patient Routes for Histopathology Classification
 * 
 * Single-modality: Histopathology images only
 * Model: EfficientNet-B0 + Coordinate Attention
 * Task: Binary Classification (Benign vs Malignant)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const logger = require('../utils/logger');
const featureExtractor = require('../services/featureExtractor');
const encryptionService = require('../services/encryption');
const patientService = require('../services/patient');
const blobStorage = require('../services/blobStorage');

// Configure multer for in-memory file uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.tif', '.tiff'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files (jpg, jpeg, png, tif, tiff) are allowed for histopathology.'));
    }
  }
});

/**
 * @swagger
 * /api/patients/upload:
 *   post:
 *     summary: Upload histopathology image for a patient
 */
router.post('/upload', upload.single('histopathology'), async (req, res) => {
  try {
    logger.info('Processing new histopathology image upload');
    
    const { patient_metadata } = req.body;
    const file = req.file;
    
    if (!patient_metadata) {
      return res.status(400).json({ error: 'Patient metadata required' });
    }
    
    if (!file) {
      return res.status(400).json({ error: 'Histopathology image required' });
    }
    
    const metadata = JSON.parse(patient_metadata);
    
    // Generate unique patient ID
    const patientId = crypto.randomUUID();
    
    // Process the histopathology image
    const processedData = await processHistopathologyFile(file, metadata, patientId);
    
    // Save patient data
    const savedPatient = await patientService.createPatient({
      id: patientId,
      metadata: metadata,
      files: { histopathology: [processedData.file] },
      features: processedData.features,
      hospital_id: process.env.HOSPITAL_ID
    });
    
    // Format response
    const response = {
      success: true,
      patient_id: patientId,
      metadata: metadata,
      histopathology: {
        url: processedData.file.blob_storage?.url,
        encrypted: processedData.file.encrypted || false,
        size: processedData.file.size,
        checksum: processedData.file.checksum
      },
      prediction: processedData.prediction,
      model_info: {
        architecture: 'EfficientNet-B0 + CoordinateAttention',
        task: 'Binary Classification (Benign/Malignant)',
        input_size: '160×160'
      },
      message: 'Histopathology image uploaded and processed successfully'
    };
    
    res.status(201).json(response);
    
  } catch (error) {
    logger.error('Error processing histopathology upload:', error);
    res.status(500).json({
      error: 'Failed to process histopathology upload',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/patients/list:
 *   get:
 *     summary: Get list of patients with histopathology data
 */
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const patients = await patientService.getPatients({
      page: parseInt(page),
      limit: parseInt(limit),
      hospital_id: process.env.HOSPITAL_ID
    });
    
    res.json({
      success: true,
      patients: patients.data,
      pagination: {
        current_page: patients.page,
        total_pages: patients.totalPages,
        total_patients: patients.total,
        limit: patients.limit
      }
    });
    
  } catch (error) {
    logger.error('Error fetching patients:', error);
    res.status(500).json({
      error: 'Failed to fetch patients',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/patients/:patientId:
 *   get:
 *     summary: Get specific patient data
 */
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { include_features = false } = req.query;
    
    const patient = await patientService.getPatient(patientId, {
      include_features: include_features === 'true',
      hospital_id: process.env.HOSPITAL_ID
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Format response
    const formattedPatient = {
      patient_id: patient.id,
      metadata: patient.metadata,
      histopathology: null,
      prediction: patient.prediction,
      features: include_features === 'true' ? patient.features : undefined,
      hospital_id: patient.hospital_id,
      created_at: patient.created_at,
      updated_at: patient.updated_at
    };
    
    // Extract histopathology file info
    if (patient.files?.histopathology?.[0]) {
      const file = patient.files.histopathology[0];
      formattedPatient.histopathology = {
        url: file.blob_storage?.url,
        encrypted: file.encrypted || false,
        size: file.size,
        checksum: file.checksum
      };
    }
    
    res.json({
      success: true,
      patient: formattedPatient
    });
    
  } catch (error) {
    logger.error('Error fetching patient:', error);
    res.status(500).json({
      error: 'Failed to fetch patient data',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/patients/:patientId/classify:
 *   post:
 *     summary: Run classification on patient's histopathology image
 */
router.post('/:patientId/classify', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    logger.info(`Running histopathology classification for patient ${patientId}`);
    
    const patient = await patientService.getPatient(patientId, {
      hospital_id: process.env.HOSPITAL_ID
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Extract features and classify
    const result = await featureExtractor.extractPatientFeatures(patient);
    
    // Update patient with prediction
    await patientService.updatePatient(patientId, {
      prediction: result.prediction,
      features: result.features,
      classification_timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      patient_id: patientId,
      prediction: result.prediction,
      model: result.model,
      processing_time_ms: result.processing_time_ms
    });
    
  } catch (error) {
    logger.error('Error classifying patient:', error);
    res.status(500).json({
      error: 'Failed to classify histopathology image',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/patients/:patientId:
 *   delete:
 *     summary: Delete patient data
 */
router.delete('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const result = await patientService.deletePatient(patientId, {
      hospital_id: process.env.HOSPITAL_ID
    });
    
    if (!result.deleted) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({
      success: true,
      message: 'Patient data deleted successfully'
    });
    
  } catch (error) {
    logger.error('Error deleting patient:', error);
    res.status(500).json({
      error: 'Failed to delete patient data',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/patients/batch/classify:
 *   post:
 *     summary: Batch classify multiple patients
 */
router.post('/batch/classify', async (req, res) => {
  try {
    const { patient_ids } = req.body;
    
    if (!patient_ids || !Array.isArray(patient_ids)) {
      return res.status(400).json({ error: 'patient_ids array required' });
    }
    
    logger.info(`Batch classifying ${patient_ids.length} patients`);
    
    const results = [];
    
    for (const patientId of patient_ids) {
      try {
        const patient = await patientService.getPatient(patientId, {
          hospital_id: process.env.HOSPITAL_ID
        });
        
        if (!patient) {
          results.push({ patient_id: patientId, error: 'Not found' });
          continue;
        }
        
        const result = await featureExtractor.extractPatientFeatures(patient);
        
        await patientService.updatePatient(patientId, {
          prediction: result.prediction,
          features: result.features
        });
        
        results.push({
          patient_id: patientId,
          prediction: result.prediction,
          success: true
        });
        
      } catch (error) {
        results.push({
          patient_id: patientId,
          error: error.message,
          success: false
        });
      }
    }
    
    res.json({
      success: true,
      total: patient_ids.length,
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
    
  } catch (error) {
    logger.error('Error in batch classification:', error);
    res.status(500).json({
      error: 'Batch classification failed',
      message: error.message
    });
  }
});

/**
 * Process histopathology file upload
 */
async function processHistopathologyFile(file, metadata, patientId) {
  const checksum = calculateBufferChecksum(file.buffer);
  
  const processedFile = {
    original_name: file.originalname,
    filename: `histopathology-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`,
    size: file.size,
    upload_date: new Date().toISOString(),
    checksum: checksum
  };
  
  let prediction = null;
  let features = null;
  
  // Encrypt and upload to blob storage
  if (process.env.ENCRYPT_FILES === 'true') {
    try {
      const encryptedData = await encryptionService.encryptBuffer(file.buffer);
      
      processedFile.encrypted = true;
      processedFile.encrypted_info = {
        original_size: file.size,
        encrypted_size: encryptedData.encryptedBuffer.length,
        checksum: encryptedData.checksum
      };
      
      // Upload encrypted buffer to blob storage
      const blobPath = `patients/${patientId}/histopathology-${Date.now()}.encrypted`;
      const blobResult = await blobStorage.uploadBuffer(
        encryptedData.encryptedBuffer,
        blobPath
      );
      
      processedFile.blob_storage = {
        url: blobResult.url,
        downloadUrl: blobResult.downloadUrl,
        pathname: blobResult.pathname,
        size: blobResult.size,
        uploadedAt: blobResult.uploadedAt
      };
      
      logger.info(`✓ Uploaded encrypted histopathology to blob: ${blobResult.url}`);
      
    } catch (error) {
      logger.error('Failed to encrypt/upload histopathology:', error.message);
      throw error;
    }
  } else {
    // Upload unencrypted
    try {
      const blobPath = `patients/${patientId}/histopathology-${Date.now()}${path.extname(file.originalname)}`;
      const blobResult = await blobStorage.uploadBuffer(file.buffer, blobPath);
      
      processedFile.blob_storage = {
        url: blobResult.url,
        downloadUrl: blobResult.downloadUrl,
        pathname: blobResult.pathname,
        size: blobResult.size,
        uploadedAt: blobResult.uploadedAt
      };
      
      logger.info(`✓ Uploaded histopathology to blob: ${blobResult.url}`);
      
    } catch (error) {
      logger.error('Failed to upload histopathology:', error.message);
      throw error;
    }
  }
  
  // Run inference on the uploaded image
  try {
    // Save temp file for inference
    const tempPath = path.join('/tmp', `histo_${Date.now()}.png`);
    await fs.writeFile(tempPath, file.buffer);
    
    const inferenceResult = await featureExtractor.extractFromFile(tempPath);
    
    prediction = inferenceResult.prediction;
    features = inferenceResult.features;
    
    // Clean up
    await fs.unlink(tempPath).catch(() => {});
    
    logger.info(`✓ Classification result: ${prediction?.label} (${(prediction?.confidence * 100).toFixed(1)}%)`);
    
  } catch (error) {
    logger.warn('Feature extraction failed:', error.message);
  }
  
  return {
    file: processedFile,
    prediction,
    features
  };
}

/**
 * Calculate buffer checksum
 */
function calculateBufferChecksum(buffer) {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(buffer);
  return hashSum.digest('hex');
}

module.exports = router;
