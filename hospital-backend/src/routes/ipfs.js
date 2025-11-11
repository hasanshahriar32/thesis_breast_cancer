const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const ipfsService = require('../services/ipfs');
const encryptionService = require('../services/encryption');
const patientService = require('../services/patient');
const fs = require('fs').promises;
const axios = require('axios');

// Upload patient encrypted images to IPFS
router.post('/upload-patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    logger.info(`Starting IPFS upload for patient: ${patientId}`);

    // 1. Connect to database and find patient directly
    const patientServiceInstance = require('../services/patient');
    
    const patient = await patientServiceInstance.collection.findOne({ 
      id: patientId  // Use the generated UUID instead of metadata.patientId
    });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: `Patient ${patientId} not found`
      });
    }

    // 2. Check if files have Vercel Blob Storage URLs
    if (!patient.files?.xray?.[0]?.blob_storage?.url || 
        !patient.files?.histopathology?.[0]?.blob_storage?.url || 
        !patient.files?.ultrasound?.[0]?.blob_storage?.url) {
      return res.status(400).json({
        success: false,
        error: 'Patient files must be uploaded to Vercel Blob Storage first'
      });
    }

    // 3. Upload each encrypted file from Vercel Blob to IPFS/Pinata
    await ipfsService.connect();
    const ipfsCids = {};
    const ipfsGatewayUrls = {};
    
    // Helper function to download from Vercel Blob and upload to Pinata
    const uploadToIPFS = async (blobUrl, filename) => {
      logger.info(`Downloading from Vercel Blob: ${blobUrl}`);
      const response = await axios.get(blobUrl, { responseType: 'arraybuffer' });
      const fileData = Buffer.from(response.data);
      
      if (ipfsService.usePinata) {
        const result = await ipfsService.uploadToPinata(fileData, filename);
        return result.cid;
      } else {
        const result = await ipfsService.client.add(fileData, { pin: true });
        return result.cid.toString();
      }
    };
    
    // Upload X-Ray
    ipfsCids.xray = await uploadToIPFS(
      patient.files.xray[0].blob_storage.url,
      `xray-${patientId}.enc`
    );
    ipfsGatewayUrls.xray = `${process.env.IPFS_GATEWAY}${ipfsCids.xray}`;
    logger.info(`✓ X-Ray uploaded to IPFS: ${ipfsCids.xray}`);
    
    // Upload Histopathology
    ipfsCids.histopathology = await uploadToIPFS(
      patient.files.histopathology[0].blob_storage.url,
      `histo-${patientId}.enc`
    );
    ipfsGatewayUrls.histopathology = `${process.env.IPFS_GATEWAY}${ipfsCids.histopathology}`;
    logger.info(`✓ Histopathology uploaded to IPFS: ${ipfsCids.histopathology}`);
    
    // Upload Ultrasound
    ipfsCids.ultrasound = await uploadToIPFS(
      patient.files.ultrasound[0].blob_storage.url,
      `ultra-${patientId}.enc`
    );
    ipfsGatewayUrls.ultrasound = `${process.env.IPFS_GATEWAY}${ipfsCids.ultrasound}`;
    logger.info(`✓ Ultrasound uploaded to IPFS: ${ipfsCids.ultrasound}`);

    // 4. Update patient record with IPFS CIDs
    await patientServiceInstance.collection.updateOne(
      { id: patientId },  // Use the UUID instead of metadata.patientId
      {
        $set: {
          'files.xray.0.ipfs_cid': ipfsCids.xray,
          'files.histopathology.0.ipfs_cid': ipfsCids.histopathology,
          'files.ultrasound.0.ipfs_cid': ipfsCids.ultrasound,
          'files.xray.0.ipfs_upload_date': new Date().toISOString(),
          'files.histopathology.0.ipfs_upload_date': new Date().toISOString(),
          'files.ultrasound.0.ipfs_upload_date': new Date().toISOString(),
          updated_at: new Date()
        }
      }
    );

    logger.info(`✅ Successfully uploaded patient ${patientId} to IPFS`);

    res.json({
      success: true,
      message: 'Patient images uploaded to IPFS successfully',
      patientId,
      ipfsCids,
      ipfsGatewayUrls
    });

  } catch (error) {
    logger.error(`Error uploading patient to IPFS: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload data to IPFS
router.post('/upload', async (req, res) => {
  try {
    const { data, encrypt = false, pin = true, metadata = {} } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Data required for upload' });
    }

    logger.info('Uploading data to IPFS...');

    let uploadData = data;
    let encryptionKey = null;

    // Encrypt data if requested
    if (encrypt) {
      const encrypted = await encryptionService.encryptModelWeights(data);
      uploadData = encrypted.encrypted_weights;
      encryptionKey = encrypted.encryption_key;
      
      metadata.encrypted = true;
      metadata.encryption_algorithm = encrypted.algorithm;
      metadata.checksum = encrypted.checksum;
    }

    // Create upload package
    const uploadPackage = {
      data: uploadData,
      metadata: {
        ...metadata,
        hospital_id: process.env.HOSPITAL_ID,
        upload_timestamp: new Date().toISOString()
      }
    };

    const dataBuffer = Buffer.from(JSON.stringify(uploadPackage));

    // Upload to IPFS
    const result = await ipfsService.client.add(dataBuffer, { pin });

    if (pin) {
      await ipfsService.client.pin.add(result.cid.toString());
    }

    res.json({
      success: true,
      ipfs_hash: result.cid.toString(),
      size: result.size || dataBuffer.length,
      encrypted: encrypt,
      encryption_key: encryptionKey,
      pinned: pin,
      upload_timestamp: uploadPackage.metadata.upload_timestamp
    });

  } catch (error) {
    logger.error('Error uploading to IPFS:', error);
    res.status(500).json({
      error: 'IPFS upload failed',
      message: error.message
    });
  }
});

// Download data from IPFS
router.get('/download/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { decrypt = false, encryption_key } = req.query;

    if (!hash) {
      return res.status(400).json({ error: 'IPFS hash required' });
    }

    logger.info(`Downloading from IPFS: ${hash}`);

    // Download from IPFS
    const downloadResult = await ipfsService.downloadModelWeights(hash, encryption_key);

    // If decryption was requested but no key provided
    if (decrypt && !encryption_key && downloadResult.encrypted) {
      return res.status(400).json({ 
        error: 'Encryption key required for encrypted content',
        encrypted: true 
      });
    }

    res.json({
      success: true,
      ipfs_hash: hash,
      data: downloadResult,
      download_timestamp: new Date().toISOString(),
      decrypted: decrypt && downloadResult.decrypted
    });

  } catch (error) {
    logger.error('Error downloading from IPFS:', error);
    res.status(500).json({
      error: 'IPFS download failed',
      message: error.message
    });
  }
});

// Upload model weights
router.post('/upload-model', async (req, res) => {
  try {
    const { model_weights, encrypt = true } = req.body;

    if (!model_weights) {
      return res.status(400).json({ error: 'Model weights required' });
    }

    logger.info('Uploading model weights to IPFS...');

    const result = await ipfsService.uploadModelWeights({
      ...model_weights,
      encrypted: encrypt
    });

    res.json({
      success: true,
      upload_result: result,
      message: 'Model weights uploaded successfully'
    });

  } catch (error) {
    logger.error('Error uploading model weights:', error);
    res.status(500).json({
      error: 'Model weight upload failed',
      message: error.message
    });
  }
});

// Upload patient data (anonymized)
router.post('/upload-patient', async (req, res) => {
  try {
    const { patient_data, include_metadata = false } = req.body;

    if (!patient_data) {
      return res.status(400).json({ error: 'Patient data required' });
    }

    logger.info('Uploading anonymized patient data to IPFS...');

    const result = await ipfsService.uploadPatientData({
      ...patient_data,
      include_metadata
    });

    res.json({
      success: true,
      upload_result: result,
      message: 'Patient data uploaded successfully'
    });

  } catch (error) {
    logger.error('Error uploading patient data:', error);
    res.status(500).json({
      error: 'Patient data upload failed',
      message: error.message
    });
  }
});

// Get IPFS node information
router.get('/node-info', async (req, res) => {
  try {
    const nodeInfo = await ipfsService.getNodeInfo();

    res.json({
      success: true,
      node_info: nodeInfo
    });

  } catch (error) {
    logger.error('Error getting IPFS node info:', error);
    res.status(500).json({
      error: 'Failed to get node info',
      message: error.message
    });
  }
});

// List pinned content
router.get('/pinned', async (req, res) => {
  try {
    const pinnedContent = await ipfsService.listPinnedContent();

    res.json({
      success: true,
      pinned_content: pinnedContent,
      total_pinned: pinnedContent.length
    });

  } catch (error) {
    logger.error('Error listing pinned content:', error);
    res.status(500).json({
      error: 'Failed to list pinned content',
      message: error.message
    });
  }
});

// Pin content
router.post('/pin/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash) {
      return res.status(400).json({ error: 'IPFS hash required' });
    }

    await ipfsService.client.pin.add(hash);

    res.json({
      success: true,
      ipfs_hash: hash,
      pinned: true,
      message: 'Content pinned successfully'
    });

  } catch (error) {
    logger.error('Error pinning content:', error);
    res.status(500).json({
      error: 'Failed to pin content',
      message: error.message
    });
  }
});

// Unpin content
router.delete('/pin/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash) {
      return res.status(400).json({ error: 'IPFS hash required' });
    }

    const result = await ipfsService.unpinContent(hash);

    res.json({
      success: result,
      ipfs_hash: hash,
      unpinned: result,
      message: result ? 'Content unpinned successfully' : 'Failed to unpin content'
    });

  } catch (error) {
    logger.error('Error unpinning content:', error);
    res.status(500).json({
      error: 'Failed to unpin content',
      message: error.message
    });
  }
});

// Check if hash exists and is accessible
router.head('/check/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    // Try to get just the first byte to check accessibility
    const chunks = [];
    let count = 0;
    for await (const chunk of ipfsService.client.cat(hash, { length: 1 })) {
      chunks.push(chunk);
      count++;
      if (count >= 1) break; // Just check first chunk
    }

    if (chunks.length > 0) {
      res.status(200).json({
        accessible: true,
        hash: hash
      });
    } else {
      res.status(404).json({
        accessible: false,
        hash: hash
      });
    }

  } catch (error) {
    res.status(404).json({
      accessible: false,
      hash: req.params.hash,
      error: error.message
    });
  }
});

// Get content metadata without downloading full content
router.get('/metadata/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    // Try to read just the beginning to get metadata
    const chunks = [];
    let totalSize = 0;
    const maxMetadataSize = 1024; // First 1KB should contain metadata

    for await (const chunk of ipfsService.client.cat(hash, { length: maxMetadataSize })) {
      chunks.push(chunk);
      totalSize += chunk.length;
      if (totalSize >= maxMetadataSize) break;
    }

    const dataBuffer = Buffer.concat(chunks);
    
    try {
      const content = JSON.parse(dataBuffer.toString());
      
      res.json({
        success: true,
        hash: hash,
        metadata: content.metadata || {},
        has_data: !!content.data,
        encrypted: content.metadata?.encrypted || false,
        size_checked: totalSize
      });
      
    } catch (parseError) {
      // If not JSON, try to extract basic info
      res.json({
        success: true,
        hash: hash,
        metadata: {
          type: 'binary',
          size_checked: totalSize
        },
        raw_content: true
      });
    }

  } catch (error) {
    logger.error('Error getting content metadata:', error);
    res.status(500).json({
      error: 'Failed to get content metadata',
      message: error.message
    });
  }
});

module.exports = router;