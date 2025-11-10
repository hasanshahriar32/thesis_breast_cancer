const { create } = require('ipfs-http-client');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const encryptionService = require('./encryption');

class IPFSService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = {
      host: process.env.IPFS_HOST || 'localhost',
      port: process.env.IPFS_PORT || 5001,
      protocol: process.env.IPFS_PROTOCOL || 'http'
    };
  }

  async connect() {
    if (this.isConnected) return;

    try {
      logger.info(`Connecting to IPFS: ${this.config.protocol}://${this.config.host}:${this.config.port}`);
      
      this.client = create({
        host: this.config.host,
        port: this.config.port,
        protocol: this.config.protocol,
        timeout: 60000 // 60 second timeout
      });

      // Test connection
      const version = await this.client.version();
      logger.info(`✓ Connected to IPFS node version: ${version.version}`);
      
      this.isConnected = true;

    } catch (error) {
      logger.error('Failed to connect to IPFS:', error);
      
      // Fall back to mock mode for development
      if (process.env.NODE_ENV === 'development') {
        logger.warn('IPFS unavailable, using mock mode');
        this.client = this.createMockClient();
        this.isConnected = true;
      } else {
        throw new Error(`IPFS connection failed: ${error.message}`);
      }
    }
  }

  createMockClient() {
    // Mock IPFS client for development/testing
    return {
      add: async (data) => {
        const hash = `Qm${Math.random().toString(36).substr(2, 44)}`;
        logger.info(`Mock IPFS: Added data with hash ${hash}`);
        return { cid: hash, size: JSON.stringify(data).length };
      },
      cat: async (hash) => {
        logger.info(`Mock IPFS: Retrieved data for hash ${hash}`);
        return Buffer.from(JSON.stringify({ mock: true, hash }));
      },
      pin: {
        add: async (hash) => {
          logger.info(`Mock IPFS: Pinned ${hash}`);
          return { pins: [hash] };
        }
      },
      version: async () => ({ version: 'mock-0.1.0' })
    };
  }

  async uploadModelWeights(modelWeights) {
    await this.connect();

    try {
      logger.info(`Uploading model weights to IPFS: ${modelWeights.model_id}`);

      // Prepare metadata
      const metadata = {
        model_id: modelWeights.model_id,
        hospital_id: process.env.HOSPITAL_ID,
        upload_timestamp: new Date().toISOString(),
        version: '1.0',
        encrypted: modelWeights.encrypted || false
      };

      // Create upload package
      const uploadPackage = {
        metadata: metadata,
        weights: modelWeights.weights,
        architecture: modelWeights.architecture,
        dimensions: modelWeights.dimensions,
        total_parameters: modelWeights.total_parameters
      };

      // Add encryption info if encrypted
      if (modelWeights.encrypted) {
        uploadPackage.encryption_info = modelWeights.encryption_info;
      }

      // Convert to buffer
      const dataBuffer = Buffer.from(JSON.stringify(uploadPackage));

      // Upload to IPFS
      const result = await this.client.add(dataBuffer, {
        pin: true, // Pin the content
        wrapWithDirectory: false
      });

      // Pin the content for persistence
      await this.client.pin.add(result.cid.toString());

      logger.info(`✓ Model weights uploaded to IPFS: ${result.cid}`);

      return {
        hash: result.cid.toString(),
        size: result.size || dataBuffer.length,
        model_id: modelWeights.model_id,
        upload_timestamp: metadata.upload_timestamp,
        pinned: true
      };

    } catch (error) {
      logger.error('Failed to upload model weights to IPFS:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  async downloadModelWeights(ipfsHash, encryptionKey = null) {
    await this.connect();

    try {
      logger.info(`Downloading model weights from IPFS: ${ipfsHash}`);

      // Retrieve data from IPFS
      const chunks = [];
      for await (const chunk of this.client.cat(ipfsHash)) {
        chunks.push(chunk);
      }

      const dataBuffer = Buffer.concat(chunks);
      const uploadPackage = JSON.parse(dataBuffer.toString());

      // Decrypt weights if they are encrypted
      if (uploadPackage.encrypted && encryptionKey) {
        logger.info('Decrypting model weights...');
        
        const decryptedWeights = await encryptionService.decryptModelWeights(
          uploadPackage.weights,
          encryptionKey
        );
        
        uploadPackage.weights = decryptedWeights;
        uploadPackage.decrypted = true;
      }

      logger.info(`✓ Model weights downloaded from IPFS: ${ipfsHash}`);

      return {
        ...uploadPackage,
        download_timestamp: new Date().toISOString(),
        ipfs_hash: ipfsHash
      };

    } catch (error) {
      logger.error(`Failed to download model weights from IPFS ${ipfsHash}:`, error);
      throw new Error(`IPFS download failed: ${error.message}`);
    }
  }

  async uploadPatientData(patientData) {
    await this.connect();

    try {
      logger.info(`Uploading patient data to IPFS: ${patientData.patient_id}`);

      // Create secure upload package
      const uploadPackage = {
        patient_id: patientData.patient_id,
        hospital_id: process.env.HOSPITAL_ID,
        features: patientData.features,
        metadata_hash: encryptionService.calculateChecksum(
          Buffer.from(JSON.stringify(patientData.metadata))
        ),
        upload_timestamp: new Date().toISOString(),
        privacy_level: 'anonymized'
      };

      // Don't include raw metadata for privacy
      if (patientData.include_metadata === true) {
        uploadPackage.encrypted_metadata = encryptionService.encryptObject(patientData.metadata);
      }

      const dataBuffer = Buffer.from(JSON.stringify(uploadPackage));

      // Upload to IPFS
      const result = await this.client.add(dataBuffer, {
        pin: true,
        wrapWithDirectory: false
      });

      await this.client.pin.add(result.cid.toString());

      logger.info(`✓ Patient data uploaded to IPFS: ${result.cid}`);

      return {
        hash: result.cid.toString(),
        size: result.size || dataBuffer.length,
        patient_id: patientData.patient_id,
        upload_timestamp: uploadPackage.upload_timestamp
      };

    } catch (error) {
      logger.error('Failed to upload patient data to IPFS:', error);
      throw new Error(`Patient data IPFS upload failed: ${error.message}`);
    }
  }

  async uploadFile(filePath, options = {}) {
    await this.connect();

    try {
      logger.info(`Uploading file to IPFS: ${filePath}`);

      // Read file
      const fileBuffer = await fs.readFile(filePath);
      
      // Create metadata
      const metadata = {
        filename: path.basename(filePath),
        size: fileBuffer.length,
        checksum: encryptionService.calculateChecksum(fileBuffer),
        upload_timestamp: new Date().toISOString(),
        hospital_id: process.env.HOSPITAL_ID,
        ...options.metadata
      };

      // Encrypt file if requested
      let uploadBuffer = fileBuffer;
      let encryptionInfo = null;

      if (options.encrypt) {
        logger.info('Encrypting file before upload...');
        const encrypted = await encryptionService.encryptModelWeights(fileBuffer.toString('base64'));
        uploadBuffer = Buffer.from(encrypted.encrypted_weights, 'base64');
        encryptionInfo = {
          encrypted: true,
          algorithm: encrypted.algorithm,
          checksum: encrypted.checksum
        };
      }

      // Create upload package
      const uploadPackage = {
        metadata: { ...metadata, ...encryptionInfo },
        data: uploadBuffer.toString('base64')
      };

      const packageBuffer = Buffer.from(JSON.stringify(uploadPackage));

      // Upload to IPFS
      const result = await this.client.add(packageBuffer, {
        pin: options.pin !== false,
        wrapWithDirectory: false
      });

      if (options.pin !== false) {
        await this.client.pin.add(result.cid.toString());
      }

      logger.info(`✓ File uploaded to IPFS: ${result.cid}`);

      return {
        hash: result.cid.toString(),
        size: result.size || packageBuffer.length,
        filename: metadata.filename,
        encrypted: !!encryptionInfo,
        upload_timestamp: metadata.upload_timestamp
      };

    } catch (error) {
      logger.error(`Failed to upload file ${filePath} to IPFS:`, error);
      throw new Error(`File IPFS upload failed: ${error.message}`);
    }
  }

  async downloadFile(ipfsHash, outputPath = null, decryptionKey = null) {
    await this.connect();

    try {
      logger.info(`Downloading file from IPFS: ${ipfsHash}`);

      // Retrieve data from IPFS
      const chunks = [];
      for await (const chunk of this.client.cat(ipfsHash)) {
        chunks.push(chunk);
      }

      const dataBuffer = Buffer.concat(chunks);
      const uploadPackage = JSON.parse(dataBuffer.toString());

      // Decode file data
      let fileBuffer = Buffer.from(uploadPackage.data, 'base64');

      // Decrypt if needed
      if (uploadPackage.metadata.encrypted && decryptionKey) {
        logger.info('Decrypting downloaded file...');
        const decryptedData = await encryptionService.decryptModelWeights(
          fileBuffer.toString('base64'),
          decryptionKey
        );
        fileBuffer = Buffer.from(decryptedData, 'base64');
      }

      // Save to file if output path provided
      if (outputPath) {
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, fileBuffer);
        logger.info(`✓ File saved to: ${outputPath}`);
      }

      return {
        buffer: fileBuffer,
        metadata: uploadPackage.metadata,
        download_timestamp: new Date().toISOString(),
        saved_to: outputPath
      };

    } catch (error) {
      logger.error(`Failed to download file from IPFS ${ipfsHash}:`, error);
      throw new Error(`File IPFS download failed: ${error.message}`);
    }
  }

  async listPinnedContent() {
    await this.connect();

    try {
      const pinnedContent = [];
      
      for await (const pin of this.client.pin.ls()) {
        pinnedContent.push({
          hash: pin.cid.toString(),
          type: pin.type
        });
      }

      return pinnedContent;

    } catch (error) {
      logger.error('Failed to list pinned content:', error);
      return [];
    }
  }

  async unpinContent(ipfsHash) {
    await this.connect();

    try {
      logger.info(`Unpinning content from IPFS: ${ipfsHash}`);
      
      await this.client.pin.rm(ipfsHash);
      
      logger.info(`✓ Content unpinned: ${ipfsHash}`);
      return true;

    } catch (error) {
      logger.error(`Failed to unpin content ${ipfsHash}:`, error);
      return false;
    }
  }

  async getNodeInfo() {
    await this.connect();

    try {
      const [version, id] = await Promise.all([
        this.client.version(),
        this.client.id()
      ]);

      return {
        version: version.version,
        node_id: id.id,
        addresses: id.addresses,
        connected: this.isConnected,
        config: this.config
      };

    } catch (error) {
      logger.error('Failed to get IPFS node info:', error);
      throw new Error(`Failed to get node info: ${error.message}`);
    }
  }

  async close() {
    if (this.client && this.client.stop) {
      await this.client.stop();
    }
    this.isConnected = false;
    logger.info('✓ IPFS connection closed');
  }
}

// Export singleton instance
const ipfsService = new IPFSService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await ipfsService.close();
});

process.on('SIGINT', async () => {
  await ipfsService.close();
});

module.exports = ipfsService;