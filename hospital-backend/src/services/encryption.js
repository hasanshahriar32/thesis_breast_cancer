const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;  // 128 bits
    this.tagLength = 16; // 128 bits
    this.secretKey = this.getOrCreateSecretKey();
  }

  getOrCreateSecretKey() {
    // In production, this should come from secure key management
    const keyFromEnv = process.env.ENCRYPTION_KEY;
    
    if (keyFromEnv) {
      return Buffer.from(keyFromEnv, 'hex');
    }
    
    // Generate a new key (for development only)
    logger.warn('No encryption key found in environment, generating new key');
    const newKey = crypto.randomBytes(this.keyLength);
    logger.info(`Generated encryption key: ${newKey.toString('hex')}`);
    return newKey;
  }

  async encryptFile(filePath) {
    try {
      logger.info(`Encrypting file: ${filePath}`);
      
      // Read the file
      const data = await fs.readFile(filePath);
      
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      
      // Encrypt the data
      const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final()
      ]);
      
      // Get the authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine IV + tag + encrypted data
      const encryptedData = Buffer.concat([iv, tag, encrypted]);
      
      // Save encrypted file
      const encryptedPath = filePath + '.encrypted';
      await fs.writeFile(encryptedPath, encryptedData);
      
      // Calculate checksum
      const checksum = this.calculateChecksum(encryptedData);
      
      logger.info(`File encrypted successfully: ${encryptedPath}`);
      
      return {
        encrypted_path: encryptedPath,
        original_size: data.length,
        encrypted_size: encryptedData.length,
        checksum: checksum,
        encryption_timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Failed to encrypt file ${filePath}:`, error);
      throw new Error(`File encryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt a buffer directly (no file I/O)
   * @param {Buffer} buffer - Buffer to encrypt
   * @returns {Object} - Encrypted buffer and metadata
   */
  async encryptBuffer(buffer) {
    try {
      logger.info(`Encrypting buffer of size: ${buffer.length} bytes`);
      
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      
      // Encrypt the data
      const encrypted = Buffer.concat([
        cipher.update(buffer),
        cipher.final()
      ]);
      
      // Get the authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine IV + tag + encrypted data
      const encryptedBuffer = Buffer.concat([iv, tag, encrypted]);
      
      // Calculate checksum
      const checksum = this.calculateChecksum(encryptedBuffer);
      
      logger.info(`Buffer encrypted successfully`);
      
      return {
        encryptedBuffer: encryptedBuffer,
        original_size: buffer.length,
        encrypted_size: encryptedBuffer.length,
        checksum: checksum,
        encryption_timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Failed to encrypt buffer:`, error);
      throw new Error(`Buffer encryption failed: ${error.message}`);
    }
  }

  async decryptFile(encryptedPath) {
    try {
      logger.info(`Decrypting file: ${encryptedPath}`);
      
      // Read encrypted data
      const encryptedData = await fs.readFile(encryptedPath);
      
      // Extract IV, tag, and encrypted content
      const iv = encryptedData.slice(0, this.ivLength);
      const tag = encryptedData.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = encryptedData.slice(this.ivLength + this.tagLength);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt the data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      logger.info(`File decrypted successfully`);
      
      return {
        data: decrypted,
        size: decrypted.length,
        decryption_timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Failed to decrypt file ${encryptedPath}:`, error);
      throw new Error(`File decryption failed: ${error.message}`);
    }
  }

  encryptText(text) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.secretKey, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(Buffer.from(text, 'utf8')),
        cipher.final()
      ]);
      
      const tag = cipher.getAuthTag();
      const result = Buffer.concat([iv, tag, encrypted]);
      
      return result.toString('base64');
      
    } catch (error) {
      logger.error('Failed to encrypt text:', error);
      throw new Error(`Text encryption failed: ${error.message}`);
    }
  }

  decryptText(encryptedText) {
    try {
      const encryptedData = Buffer.from(encryptedText, 'base64');
      
      const iv = encryptedData.slice(0, this.ivLength);
      const tag = encryptedData.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = encryptedData.slice(this.ivLength + this.tagLength);
      
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey, iv);
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
      
    } catch (error) {
      logger.error('Failed to decrypt text:', error);
      throw new Error(`Text decryption failed: ${error.message}`);
    }
  }

  encryptObject(obj) {
    const jsonString = JSON.stringify(obj);
    return this.encryptText(jsonString);
  }

  decryptObject(encryptedText) {
    const jsonString = this.decryptText(encryptedText);
    return JSON.parse(jsonString);
  }

  calculateChecksum(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateSecureHash(data) {
    // Use a more secure hashing function for sensitive data
    const salt = crypto.randomBytes(32);
    const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: salt.toString('hex')
    };
  }

  verifySecureHash(data, storedHash, salt) {
    const hash = crypto.pbkdf2Sync(data, Buffer.from(salt, 'hex'), 100000, 64, 'sha512');
    return hash.toString('hex') === storedHash;
  }

  async secureDelete(filePath) {
    try {
      // Overwrite file with random data multiple times before deletion
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;
      
      for (let i = 0; i < 3; i++) {
        const randomData = crypto.randomBytes(fileSize);
        await fs.writeFile(filePath, randomData);
      }
      
      // Finally delete the file
      await fs.unlink(filePath);
      
      logger.info(`Securely deleted file: ${filePath}`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to securely delete file ${filePath}:`, error);
      throw new Error(`Secure deletion failed: ${error.message}`);
    }
  }

  // Generate encryption keys for model weights
  generateModelEncryptionKey() {
    return {
      key: crypto.randomBytes(this.keyLength).toString('hex'),
      created_at: new Date().toISOString(),
      algorithm: this.algorithm
    };
  }

  // Encrypt model weights for IPFS storage
  async encryptModelWeights(weights, modelKey = null) {
    try {
      const key = modelKey || this.generateModelEncryptionKey();
      const keyBuffer = Buffer.from(key.key || key, 'hex');
      
      // Serialize weights to JSON
      const weightsJson = JSON.stringify(weights);
      const weightsBuffer = Buffer.from(weightsJson, 'utf8');
      
      // Encrypt with model-specific key
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, keyBuffer, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(weightsBuffer),
        cipher.final()
      ]);
      
      const tag = cipher.getAuthTag();
      const encryptedWeights = Buffer.concat([iv, tag, encrypted]);
      
      return {
        encrypted_weights: encryptedWeights.toString('base64'),
        encryption_key: typeof key === 'string' ? key : key.key,
        algorithm: this.algorithm,
        size: {
          original: weightsBuffer.length,
          encrypted: encryptedWeights.length
        },
        checksum: this.calculateChecksum(encryptedWeights),
        encrypted_at: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Failed to encrypt model weights:', error);
      throw new Error(`Model weight encryption failed: ${error.message}`);
    }
  }

  async decryptModelWeights(encryptedData, encryptionKey) {
    try {
      const keyBuffer = Buffer.from(encryptionKey, 'hex');
      const encryptedBuffer = Buffer.from(encryptedData, 'base64');
      
      // Extract IV, tag, and encrypted content
      const iv = encryptedBuffer.slice(0, this.ivLength);
      const tag = encryptedBuffer.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = encryptedBuffer.slice(this.ivLength + this.tagLength);
      
      // Decrypt
      const decipher = crypto.createDecipher(this.algorithm, keyBuffer, iv);
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      // Parse JSON weights
      const weightsJson = decrypted.toString('utf8');
      const weights = JSON.parse(weightsJson);
      
      return weights;
      
    } catch (error) {
      logger.error('Failed to decrypt model weights:', error);
      throw new Error(`Model weight decryption failed: ${error.message}`);
    }
  }
}

// Export singleton instance
const encryptionService = new EncryptionService();
module.exports = encryptionService;