const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Storage Service with Local Filesystem fallback
 * 
 * Uses Vercel Blob Storage when BLOB_READ_WRITE_TOKEN is set,
 * otherwise falls back to local filesystem (uploads/ directory).
 * Single-modality: histopathology only.
 */
class BlobStorageService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads/patients');
    this.useVercel = false;
    this._putFn = null;
  }

  async initialize() {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      try {
        const { put } = require('@vercel/blob');
        this._putFn = put;
        this.useVercel = true;
        logger.info('✓ Storage: Using Vercel Blob Storage');
      } catch {
        logger.warn('⚠️ @vercel/blob not installed — falling back to local filesystem');
        this.useVercel = false;
      }
    } else {
      logger.info('✓ Storage: Using local filesystem (uploads/)');
      this.useVercel = false;
    }

    // Ensure local uploads directory exists
    if (!fsSync.existsSync(this.uploadsDir)) {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Upload a file to storage
   * @param {string} filePath - Local file path to upload
   * @param {string} storagePath - Path in storage (e.g., 'patients/histo-123.png')
   * @returns {Promise<Object>} - Storage metadata including URL
   */
  async uploadFile(filePath, storagePath) {
    if (this.useVercel) {
      return this._uploadToVercel(filePath, storagePath);
    }
    return this._uploadToLocal(filePath, storagePath);
  }

  /**
   * Upload a buffer to storage
   * @param {Buffer} buffer - Buffer to upload
   * @param {string} storagePath - Path in storage
   * @returns {Promise<Object>} - Storage metadata including URL
   */
  async uploadBuffer(buffer, storagePath) {
    if (this.useVercel) {
      return this._uploadBufferToVercel(buffer, storagePath);
    }
    return this._uploadBufferToLocal(buffer, storagePath);
  }

  /**
   * Upload patient histopathology image to storage
   * @param {Object} patient - Patient record with file information
   * @returns {Promise<Object>} - URL for uploaded image
   */
  async uploadPatientImages(patient) {
    try {
      const result = { histopathology: null };

      // Upload histopathology image if available
      const histoFile = patient.files?.histopathology?.[0];
      const histoPath = histoFile?.encrypted_path?.encrypted_path || histoFile?.path;

      if (histoPath) {
        const storagePath = `patients/${patient.metadata.patientId}/histopathology-${Date.now()}.encrypted`;
        result.histopathology = await this.uploadFile(histoPath, storagePath);
      }

      logger.info(`✓ Uploaded patient image: ${patient.metadata.patientId}`);
      return result;

    } catch (error) {
      logger.error(`Failed to upload patient images: ${error.message}`);
      throw error;
    }
  }

  // --- Private: Vercel Blob Storage ---

  async _uploadToVercel(filePath, storagePath) {
    const fileBuffer = await fs.readFile(filePath);
    return this._uploadBufferToVercel(fileBuffer, storagePath);
  }

  async _uploadBufferToVercel(buffer, storagePath) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const blob = await this._putFn(storagePath, buffer, {
      access: 'public',
      token,
      addRandomSuffix: true,
    });

    logger.info(`✓ Uploaded to Vercel Blob: ${blob.url}`);
    return {
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      storage: 'vercel'
    };
  }

  // --- Private: Local Filesystem ---

  async _uploadToLocal(filePath, storagePath) {
    const destPath = path.join(this.uploadsDir, storagePath);
    const destDir = path.dirname(destPath);

    if (!fsSync.existsSync(destDir)) {
      await fs.mkdir(destDir, { recursive: true });
    }

    await fs.copyFile(filePath, destPath);
    const stats = await fs.stat(destPath);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/uploads/patients/${storagePath}`;

    logger.info(`✓ Saved to local storage: ${destPath}`);
    return {
      url,
      downloadUrl: url,
      pathname: storagePath,
      size: stats.size,
      uploadedAt: new Date().toISOString(),
      localPath: destPath,
      storage: 'local'
    };
  }

  async _uploadBufferToLocal(buffer, storagePath) {
    const destPath = path.join(this.uploadsDir, storagePath);
    const destDir = path.dirname(destPath);

    if (!fsSync.existsSync(destDir)) {
      await fs.mkdir(destDir, { recursive: true });
    }

    await fs.writeFile(destPath, buffer);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/uploads/patients/${storagePath}`;

    logger.info(`✓ Saved buffer to local storage: ${destPath}`);
    return {
      url,
      downloadUrl: url,
      pathname: storagePath,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      localPath: destPath,
      storage: 'local'
    };
  }
}

const storageService = new BlobStorageService();
storageService.initialize().catch(err => {
  console.warn('Storage initialization warning:', err.message);
});

module.exports = storageService;
