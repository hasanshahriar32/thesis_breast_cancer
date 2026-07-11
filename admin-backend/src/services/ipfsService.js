/**
 * IPFS Service
 * 
 * Handles all IPFS operations via Pinata for model weight storage.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class IPFSService {
  constructor() {
    this.pinataJWT = process.env.PINATA_JWT;
    this.gateway = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
    this.pinataAPI = 'https://api.pinata.cloud';
  }

  /**
   * Upload a file to IPFS via Pinata
   */
  async uploadFile(filePath, metadata = {}) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      
      const pinataMetadata = JSON.stringify({
        name: metadata.name || path.basename(filePath),
        keyvalues: {
          type: metadata.type || 'model_weights',
          ...metadata.keyvalues
        }
      });
      formData.append('pinataMetadata', pinataMetadata);

      logger.info(`Uploading to IPFS: ${filePath}`);

      const response = await axios.post(
        `${this.pinataAPI}/pinning/pinFileToIPFS`,
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.pinataJWT}`
          }
        }
      );

      const result = {
        cid: response.data.IpfsHash,
        size: response.data.PinSize,
        timestamp: response.data.Timestamp,
        url: `${this.gateway}/${response.data.IpfsHash}`
      };

      logger.info(`Uploaded to IPFS: ${result.cid}`);
      return result;
    } catch (error) {
      logger.error(`IPFS upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data, name = 'data.json') {
    try {
      const response = await axios.post(
        `${this.pinataAPI}/pinning/pinJSONToIPFS`,
        {
          pinataContent: data,
          pinataMetadata: { name }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.pinataJWT}`
          }
        }
      );

      return {
        cid: response.data.IpfsHash,
        url: `${this.gateway}/${response.data.IpfsHash}`
      };
    } catch (error) {
      logger.error(`IPFS JSON upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Download file from IPFS
   */
  async downloadFile(cid, outputPath) {
    try {
      logger.info(`Downloading from IPFS: ${cid}`);
      
      const response = await axios.get(`${this.gateway}/${cid}`, {
        responseType: 'arraybuffer',
        timeout: 300000 // 5 min timeout for large files
      });

      fs.writeFileSync(outputPath, Buffer.from(response.data));
      
      const stats = fs.statSync(outputPath);
      logger.info(`Downloaded: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      
      return {
        path: outputPath,
        size: stats.size,
        cid
      };
    } catch (error) {
      logger.error(`IPFS download failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file content from IPFS as buffer
   */
  async getFileBuffer(cid) {
    try {
      const response = await axios.get(`${this.gateway}/${cid}`, {
        responseType: 'arraybuffer',
        timeout: 300000
      });
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`Failed to get file buffer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get JSON content from IPFS
   */
  async getJSON(cid) {
    try {
      const response = await axios.get(`${this.gateway}/${cid}`, {
        timeout: 60000
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get JSON: ${error.message}`);
      throw error;
    }
  }

  /**
   * List pinned files
   */
  async listPins(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.pageLimit) params.append('pageLimit', filters.pageLimit);
      if (filters.pageOffset) params.append('pageOffset', filters.pageOffset);

      const response = await axios.get(
        `${this.pinataAPI}/data/pinList?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${this.pinataJWT}`
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to list pins: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unpin a file from IPFS
   */
  async unpin(cid) {
    try {
      await axios.delete(`${this.pinataAPI}/pinning/unpin/${cid}`, {
        headers: {
          Authorization: `Bearer ${this.pinataJWT}`
        }
      });
      logger.info(`Unpinned: ${cid}`);
      return { success: true, cid };
    } catch (error) {
      logger.error(`Failed to unpin: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate SHA-256 hash of a file
   */
  calculateFileHash(filePath) {
    const buffer = fs.readFileSync(filePath);
    return '0x' + crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Calculate SHA-256 hash of a buffer
   */
  calculateBufferHash(buffer) {
    return '0x' + crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get gateway URL for a CID
   */
  getGatewayUrl(cid) {
    return `${this.gateway}/${cid}`;
  }

  /**
   * Test Pinata connection
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.pinataAPI}/data/testAuthentication`, {
        headers: {
          Authorization: `Bearer ${this.pinataJWT}`
        }
      });
      return { connected: true, message: response.data.message };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = new IPFSService();
