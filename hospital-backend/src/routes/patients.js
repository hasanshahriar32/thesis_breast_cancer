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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/patients');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.dcm', '.dicom'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only medical images allowed.'));
    }
  }
});

// Upload and process patient data
router.post('/upload', upload.fields([
  { name: 'xray', maxCount: 5 },
  { name: 'histopathology', maxCount: 5 },
  { name: 'ultrasound', maxCount: 5 }
]), async (req, res) => {
  try {
    logger.info('Processing new patient upload');
    
    const { patient_metadata } = req.body;
    const files = req.files;
    
    if (!patient_metadata) {
      return res.status(400).json({ error: 'Patient metadata required' });
    }
    
    const metadata = JSON.parse(patient_metadata);
    
    // Generate unique patient ID
    const patientId = crypto.randomUUID();
    
    // Process uploaded files and extract features
    const processedData = await processPatientFiles(files, metadata, patientId);
    
    // Save patient data securely
    const savedPatient = await patientService.createPatient({
      id: patientId,
      metadata: metadata,
      files: processedData.files,
      features: processedData.features,
      hospital_id: process.env.HOSPITAL_ID
    });
    
    res.status(201).json({
      success: true,
      patient_id: patientId,
      processed_files: Object.keys(processedData.files).length,
      features_extracted: processedData.features ? Object.keys(processedData.features).length : 0,
      message: 'Patient data uploaded and processed successfully'
    });
    
  } catch (error) {
    logger.error('Error processing patient upload:', error);
    res.status(500).json({
      error: 'Failed to process patient upload',
      message: error.message
    });
  }
});

// Get patient list
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 50, encrypted = false } = req.query;
    
    const patients = await patientService.getPatients({
      page: parseInt(page),
      limit: parseInt(limit),
      hospital_id: process.env.HOSPITAL_ID,
      include_encrypted: encrypted === 'true'
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

// Get specific patient data
router.get('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { include_features = false, decrypt = false } = req.query;
    
    const patient = await patientService.getPatient(patientId, {
      include_features: include_features === 'true',
      decrypt: decrypt === 'true',
      hospital_id: process.env.HOSPITAL_ID
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({
      success: true,
      patient
    });
    
  } catch (error) {
    logger.error('Error fetching patient:', error);
    res.status(500).json({
      error: 'Failed to fetch patient data',
      message: error.message
    });
  }
});

// Extract features for specific patient
router.post('/:patientId/extract-features', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { modalities = ['xray', 'histopathology', 'ultrasound'] } = req.body;
    
    logger.info(`Extracting features for patient ${patientId}`);
    
    const patient = await patientService.getPatient(patientId, {
      hospital_id: process.env.HOSPITAL_ID
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const features = await featureExtractor.extractPatientFeatures(patient, modalities);
    
    // Update patient with extracted features
    await patientService.updatePatientFeatures(patientId, features);
    
    res.json({
      success: true,
      patient_id: patientId,
      features_extracted: Object.keys(features).length,
      modalities_processed: modalities,
      features
    });
    
  } catch (error) {
    logger.error('Error extracting features:', error);
    res.status(500).json({
      error: 'Failed to extract features',
      message: error.message
    });
  }
});

// Delete patient data
router.delete('/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { secure_delete = true } = req.query;
    
    const result = await patientService.deletePatient(patientId, {
      hospital_id: process.env.HOSPITAL_ID,
      secure_delete: secure_delete === 'true'
    });
    
    if (!result.deleted) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({
      success: true,
      message: 'Patient data deleted successfully',
      files_removed: result.files_removed
    });
    
  } catch (error) {
    logger.error('Error deleting patient:', error);
    res.status(500).json({
      error: 'Failed to delete patient data',
      message: error.message
    });
  }
});

// Helper function to process uploaded files
async function processPatientFiles(files, metadata, patientId) {
  const processedFiles = {};
  const extractedFeatures = {};
  
  // Process each modality
  for (const [modality, fileList] of Object.entries(files)) {
    if (!fileList || fileList.length === 0) continue;
    
    processedFiles[modality] = [];
    
    for (const file of fileList) {
      const processedFile = {
        original_name: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        upload_date: new Date().toISOString(),
        checksum: await calculateFileChecksum(file.path)
      };
      
      // Encrypt sensitive file if required
      if (process.env.ENCRYPT_FILES === 'true') {
        const encryptedPath = await encryptionService.encryptFile(file.path);
        processedFile.encrypted_path = encryptedPath;
        processedFile.encrypted = true;
      }
      
      processedFiles[modality].push(processedFile);
    }
    
    // Extract features for this modality
    try {
      const features = await featureExtractor.extractModalityFeatures(fileList, modality);
      extractedFeatures[modality] = features;
    } catch (error) {
      logger.warn(`Failed to extract features for ${modality}:`, error.message);
    }
  }
  
  return {
    files: processedFiles,
    features: extractedFeatures
  };
}

// Helper function to calculate file checksum
async function calculateFileChecksum(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

module.exports = router;