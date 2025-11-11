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

// Configure multer for in-memory file uploads (no local storage)
const storage = multer.memoryStorage();

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
    
    // Format response with Vercel Blob URLs prominently
    const fileUrls = {};
    for (const [modality, files] of Object.entries(processedData.files)) {
      if (files && files.length > 0 && files[0].blob_storage) {
        fileUrls[modality] = {
          url: files[0].blob_storage.url,
          downloadUrl: files[0].blob_storage.downloadUrl,
          encrypted: files[0].encrypted || false,
          size: files[0].size,
          checksum: files[0].checksum
        };
      }
    }
    
    res.status(201).json({
      success: true,
      patient_id: patientId,
      metadata: metadata,
      file_urls: fileUrls,
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
    
    // Format response with clean Vercel Blob URLs
    const formattedPatient = {
      patient_id: patient.id,
      metadata: patient.metadata,
      file_urls: {},
      features: include_features === 'true' ? patient.features : undefined,
      hospital_id: patient.hospital_id,
      created_at: patient.created_at,
      updated_at: patient.updated_at,
      status: patient.status
    };
    
    // Extract clean Vercel Blob URLs
    if (patient.files) {
      for (const [modality, files] of Object.entries(patient.files)) {
        if (files && files.length > 0 && files[0].blob_storage) {
          formattedPatient.file_urls[modality] = {
            url: files[0].blob_storage.url,
            downloadUrl: files[0].blob_storage.downloadUrl,
            encrypted: files[0].encrypted || false,
            size: files[0].size,
            checksum: files[0].checksum
          };
        }
      }
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

// Helper function to process uploaded files (in-memory, no local storage)
async function processPatientFiles(files, metadata, patientId) {
  const processedFiles = {};
  const extractedFeatures = {};
  
  // Process each modality
  for (const [modality, fileList] of Object.entries(files)) {
    if (!fileList || fileList.length === 0) continue;
    
    processedFiles[modality] = [];
    
    for (const file of fileList) {
      // Calculate checksum from buffer
      const checksum = calculateBufferChecksum(file.buffer);
      
      const processedFile = {
        original_name: file.originalname,
        filename: `${modality}-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`,
        size: file.size,
        upload_date: new Date().toISOString(),
        checksum: checksum
      };
      
      // Encrypt and upload to Vercel Blob Storage
      if (process.env.ENCRYPT_FILES === 'true') {
        try {
          // Encrypt the file buffer
          const encryptedData = await encryptionService.encryptBuffer(file.buffer);
          
          processedFile.encrypted_path = {
            original_size: file.size,
            encrypted_size: encryptedData.encryptedBuffer.length,
            checksum: encryptedData.checksum,
            encryption_timestamp: new Date().toISOString()
          };
          processedFile.encrypted = true;
          
          // Upload encrypted buffer directly to Vercel Blob Storage
          const blobPath = `patients/${patientId}/${modality}-${Date.now()}.encrypted`;
          const blobResult = await blobStorage.uploadBuffer(
            encryptedData.encryptedBuffer,
            blobPath
          );
          
          // Store Vercel Blob URL (primary storage)
          processedFile.blob_storage = {
            url: blobResult.url,
            downloadUrl: blobResult.downloadUrl,
            pathname: blobResult.pathname,
            size: blobResult.size,
            uploadedAt: blobResult.uploadedAt
          };
          
          logger.info(`✓ Uploaded encrypted ${modality} to Vercel Blob: ${blobResult.url}`);
        } catch (error) {
          logger.error(`Failed to encrypt/upload ${modality} to Vercel Blob:`, error.message);
          throw error; // Fail if blob storage fails - it's the primary storage now
        }
      } else {
        // Upload unencrypted file directly to Vercel Blob Storage
        try {
          const blobPath = `patients/${patientId}/${modality}-${Date.now()}${path.extname(file.originalname)}`;
          const blobResult = await blobStorage.uploadBuffer(
            file.buffer,
            blobPath
          );
          
          processedFile.blob_storage = {
            url: blobResult.url,
            downloadUrl: blobResult.downloadUrl,
            pathname: blobResult.pathname,
            size: blobResult.size,
            uploadedAt: blobResult.uploadedAt
          };
          
          logger.info(`✓ Uploaded ${modality} to Vercel Blob: ${blobResult.url}`);
        } catch (error) {
          logger.error(`Failed to upload ${modality} to Vercel Blob:`, error.message);
          throw error;
        }
      }
      
      processedFiles[modality].push(processedFile);
    }
    
    // Extract features for this modality using in-memory buffers
    try {
      const features = await featureExtractor.extractModalityFeaturesFromBuffers(fileList, modality);
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

// Helper function to calculate buffer checksum
function calculateBufferChecksum(buffer) {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(buffer);
  return hashSum.digest('hex');
}

module.exports = router;