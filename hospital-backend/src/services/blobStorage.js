const { put } = require('@vercel/blob');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class BlobStorageService {
  constructor() {
    // Don't cache the token - read it dynamically from environment
  }

  getToken() {
    return process.env.BLOB_READ_WRITE_TOKEN;
  }

  /**
   * Upload a file to Vercel Blob Storage
   * @param {string} filePath - Local file path to upload
   * @param {string} blobPath - Path in blob storage (e.g., 'patients/xray-123.png')
   * @returns {Promise<Object>} - Blob metadata including URL
   */
  async uploadFile(filePath, blobPath) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Vercel Blob token not configured');
      }

      logger.info(`Uploading file to Vercel Blob: ${blobPath}`);

      // Read the file
      const fileBuffer = await fs.readFile(filePath);

      // Upload to Vercel Blob
      const blob = await put(blobPath, fileBuffer, {
        access: 'public',
        token: token,
        addRandomSuffix: true, // Ensures unique URLs and prevents overwrites
      });

      logger.info(`✓ File uploaded to Vercel Blob: ${blob.url}`);

      return {
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      };

    } catch (error) {
      logger.error(`Failed to upload file to Vercel Blob: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload a buffer directly to Vercel Blob Storage (no local file needed)
   * @param {Buffer} buffer - Buffer to upload
   * @param {string} blobPath - Path in blob storage (e.g., 'patients/xray-123.png')
   * @returns {Promise<Object>} - Blob metadata including URL
   */
  async uploadBuffer(buffer, blobPath) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Vercel Blob token not configured');
      }

      logger.info(`Uploading buffer to Vercel Blob: ${blobPath}`);

      // Upload buffer directly to Vercel Blob
      const blob = await put(blobPath, buffer, {
        access: 'public',
        token: token,
        addRandomSuffix: true, // Ensures unique URLs and prevents overwrites
      });

      logger.info(`✓ Buffer uploaded to Vercel Blob: ${blob.url}`);

      return {
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      };

    } catch (error) {
      logger.error(`Failed to upload buffer to Vercel Blob: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload multiple files to Vercel Blob Storage
   * @param {Array<{filePath: string, blobPath: string}>} files - Array of file upload configs
   * @returns {Promise<Array<Object>>} - Array of blob metadata
   */
  async uploadFiles(files) {
    try {
      const uploadPromises = files.map(({ filePath, blobPath }) =>
        this.uploadFile(filePath, blobPath)
      );

      const results = await Promise.all(uploadPromises);
      logger.info(`✓ Uploaded ${results.length} files to Vercel Blob`);
      
      return results;

    } catch (error) {
      logger.error(`Failed to upload files to Vercel Blob: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload patient images to Vercel Blob Storage
   * @param {Object} patient - Patient record with file information
   * @returns {Promise<Object>} - URLs for all uploaded images
   */
  async uploadPatientImages(patient) {
    try {
      const uploadTasks = [];
      const results = {
        xray: null,
        histopathology: null,
        ultrasound: null
      };

      // Upload X-Ray if available
      if (patient.files?.xray?.[0]?.encrypted_path?.encrypted_path) {
        const xrayPath = patient.files.xray[0].encrypted_path.encrypted_path;
        const blobPath = `patients/${patient.metadata.patientId}/xray-${Date.now()}.encrypted`;
        uploadTasks.push(
          this.uploadFile(xrayPath, blobPath).then(blob => {
            results.xray = blob;
          })
        );
      }

      // Upload Histopathology if available
      if (patient.files?.histopathology?.[0]?.encrypted_path?.encrypted_path) {
        const histoPath = patient.files.histopathology[0].encrypted_path.encrypted_path;
        const blobPath = `patients/${patient.metadata.patientId}/histopathology-${Date.now()}.encrypted`;
        uploadTasks.push(
          this.uploadFile(histoPath, blobPath).then(blob => {
            results.histopathology = blob;
          })
        );
      }

      // Upload Ultrasound if available
      if (patient.files?.ultrasound?.[0]?.encrypted_path?.encrypted_path) {
        const ultraPath = patient.files.ultrasound[0].encrypted_path.encrypted_path;
        const blobPath = `patients/${patient.metadata.patientId}/ultrasound-${Date.now()}.encrypted`;
        uploadTasks.push(
          this.uploadFile(ultraPath, blobPath).then(blob => {
            results.ultrasound = blob;
          })
        );
      }

      await Promise.all(uploadTasks);
      
      logger.info(`✓ Uploaded patient images to Vercel Blob: ${patient.metadata.patientId}`);
      
      return results;

    } catch (error) {
      logger.error(`Failed to upload patient images: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new BlobStorageService();
