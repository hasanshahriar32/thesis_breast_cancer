/**
 * Blockchain Service
 * 
 * Handles all interactions with the FederatedModelRegistry smart contract.
 * Provides admin functions for hospital management, model aggregation, and network control.
 */

const { ethers } = require('ethers');
const logger = require('../utils/logger');
const contractABI = require('../config/contractABI.json');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this._connected = false;
  }

  /**
   * Lazy initialization — connects to blockchain on first call
   */
  async connect() {
    if (this._connected) return;

    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    if (!rpcUrl) throw new Error('ETHEREUM_RPC_URL not set');

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      this.contractAddress,
      contractABI,
      this.wallet
    );
    this._connected = true;
    logger.info(`BlockchainService connected to ${this.contractAddress}`);
  }

  /**
   * Ensure connection before any contract call
   */
  async _ensureConnected() {
    if (!this._connected) await this.connect();
  }

  // ============================================================
  // HOSPITAL MANAGEMENT
  // ============================================================

  /**
   * Register a new hospital participant
   */
  async registerHospital(address, name, region) {
    try {
      await this._ensureConnected();
      logger.info(`Registering hospital: ${name} (${address})`);
      const tx = await this.contract.registerParticipant(address, name, region);
      const receipt = await tx.wait();
      
      logger.info(`Hospital registered. TX: ${tx.hash}`);
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        hospital: { address, name, region }
      };
    } catch (error) {
      logger.error(`Failed to register hospital: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update hospital information
   */
  async updateHospitalInfo(address, name, region) {
    try {
      await this._ensureConnected();
      const tx = await this.contract.updateHospitalInfo(address, name, region);
      await tx.wait();
      return { success: true, transactionHash: tx.hash };
    } catch (error) {
      logger.error(`Failed to update hospital: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set hospital active/inactive status
   */
  async setHospitalStatus(address, isActive) {
    try {
      await this._ensureConnected();
      const tx = await this.contract.setHospitalStatus(address, isActive);
      await tx.wait();
      return { success: true, transactionHash: tx.hash, isActive };
    } catch (error) {
      logger.error(`Failed to set hospital status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get hospital information
   */
  async getHospitalInfo(address) {
    try {
      await this._ensureConnected();
      const info = await this.contract.hospitalInfo(address);
      const isRegistered = await this.contract.isParticipant(address);
      
      return {
        address,
        isRegistered,
        name: info.name,
        region: info.region,
        registrationTime: new Date(Number(info.registrationTime) * 1000).toISOString(),
        totalContributions: Number(info.totalContributions),
        totalSamplesContributed: Number(info.totalSamplesContributed),
        isActive: info.isActive
      };
    } catch (error) {
      logger.error(`Failed to get hospital info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all registered hospitals
   */
  async getAllHospitals() {
    try {
      await this._ensureConnected();
      const participants = await this.contract.getParticipants();
      const hospitals = [];
      
      for (const address of participants) {
        const info = await this.getHospitalInfo(address);
        hospitals.push(info);
      }
      
      return hospitals;
    } catch (error) {
      logger.error(`Failed to get hospitals: ${error.message}`);
      throw error;
    }
  }

  // ============================================================
  // MODEL AGGREGATION (Oracle Functions)
  // ============================================================

  /**
   * Publish a new aggregated global model
   */
  async publishGlobalModel(modelCID, modelHash, accuracy, aucScore, sensitivity, specificity) {
    try {
      await this._ensureConnected();
      logger.info(`Publishing global model: ${modelCID}`);
      
      // Convert to contract format (all metrics * 10000 for precision)
      const tx = await this.contract.publishNewGlobalModel(
        modelCID,
        modelHash,
        Math.round(accuracy * 100),      // e.g., 95.50% -> 9550 (percentage * 100)
        Math.round(aucScore * 10000),    // e.g., 0.92 -> 9200
        Math.round(sensitivity * 10000), // e.g., 0.87 -> 8700 (* 10000)
        Math.round(specificity * 10000)  // e.g., 0.83 -> 8300 (* 10000)
      );
      
      const receipt = await tx.wait();
      
      logger.info(`Global model published. TX: ${tx.hash}`);
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        modelCID
      };
    } catch (error) {
      logger.error(`Failed to publish model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Store weight metadata for a model version
   */
  async storeWeightMetadata(version, totalParams, modelSize, inputSize, framework, frameworkVersion, architecture) {
    try {
      await this._ensureConnected();
      const tx = await this.contract.storeWeightMetadata(
        version,
        totalParams,
        modelSize,
        inputSize,
        framework,
        frameworkVersion,
        architecture
      );
      await tx.wait();
      return { success: true, transactionHash: tx.hash };
    } catch (error) {
      logger.error(`Failed to store metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pending model updates for current round
   */
  async getPendingUpdates() {
    try {
      await this._ensureConnected();
      const currentRound = await this.contract.currentRound();
      const updates = await this.contract.getUpdatesForRound(currentRound);
      
      return updates.map(update => ({
        hospital: update.contributor,
        modelWeightsCID: update.modelWeightsCID,
        modelHash: update.modelHash,
        dataSampleCount: Number(update.dataSampleCount),
        accuracy: Number(update.localAccuracy) / 100,
        auc: Number(update.localAUC) / 10000,
        sensitivity: Number(update.localSensitivity) / 10000,
        specificity: Number(update.localSpecificity) / 10000,
        round: Number(update.round),
        timestamp: new Date(Number(update.submissionTime) * 1000).toISOString(),
        trainingDuration: Number(update.trainingDuration)
      }));
    } catch (error) {
      logger.error(`Failed to get pending updates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pending updates count
   */
  async getPendingUpdatesCount() {
    try {
      await this._ensureConnected();
      const count = await this.contract.getCurrentRoundSubmissions();
      return Number(count);
    } catch (error) {
      logger.error(`Failed to get pending count: ${error.message}`);
      throw error;
    }
  }

  // ============================================================
  // NETWORK MANAGEMENT
  // ============================================================

  /**
   * Get network status
   */
  async getNetworkStatus() {
    try {
      await this._ensureConnected();
      const [
        currentRound,
        modelCount,
        participants,
        pendingCount,
        requiredSubmissions,
        minSamples,
        isPaused,
        oracle,
        owner
      ] = await Promise.all([
        this.contract.currentRound(),
        this.contract.getModelCount(),
        this.contract.getParticipants(),
        this.contract.getCurrentRoundSubmissions(),
        this.contract.requiredSubmissions(),
        this.contract.minSamplesPerUpdate(),
        this.contract.paused(),
        this.contract.oracle(),
        this.contract.owner()
      ]);

      return {
        contractAddress: this.contractAddress,
        network: 'sepolia',
        currentRound: Number(currentRound),
        totalModels: Number(modelCount),
        registeredHospitals: participants.length,
        pendingUpdates: Number(pendingCount),
        requiredSubmissions: Number(requiredSubmissions),
        minSamplesPerUpdate: Number(minSamples),
        isPaused,
        oracle,
        owner,
        readyForAggregation: Number(pendingCount) >= Number(requiredSubmissions)
      };
    } catch (error) {
      logger.error(`Failed to get network status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set oracle address
   */
  async setOracle(address) {
    try {
      await this._ensureConnected();
      const tx = await this.contract.setOracleAddress(address);
      await tx.wait();
      return { success: true, transactionHash: tx.hash, oracle: address };
    } catch (error) {
      logger.error(`Failed to set oracle: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set required submissions count
   */
  async setRequiredSubmissions(count) {
    try {
      await this._ensureConnected();
      const tx = await this.contract.setRequiredSubmissions(count);
      await tx.wait();
      return { success: true, transactionHash: tx.hash, requiredSubmissions: count };
    } catch (error) {
      logger.error(`Failed to set required submissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set minimum samples per update
   */
  async setMinSamples(count) {
    try {
      await this._ensureConnected();
      const tx = await this.contract.setMinSamplesPerUpdate(count);
      await tx.wait();
      return { success: true, transactionHash: tx.hash, minSamples: count };
    } catch (error) {
      logger.error(`Failed to set min samples: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pause the contract
   */
  async pause() {
    try {
      await this._ensureConnected();
      const tx = await this.contract.pause();
      await tx.wait();
      return { success: true, transactionHash: tx.hash, paused: true };
    } catch (error) {
      logger.error(`Failed to pause: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unpause the contract
   */
  async unpause() {
    try {
      await this._ensureConnected();
      const tx = await this.contract.unpause();
      await tx.wait();
      return { success: true, transactionHash: tx.hash, paused: false };
    } catch (error) {
      logger.error(`Failed to unpause: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize genesis model
   */
  async initializeGenesis(modelCID, modelHash) {
    try {
      await this._ensureConnected();
      const tx = await this.contract.initializeGenesisModel(modelCID, modelHash);
      await tx.wait();
      return { success: true, transactionHash: tx.hash, modelCID };
    } catch (error) {
      logger.error(`Failed to initialize genesis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update genesis model CID (emergency fix)
   */
  async updateGenesisCID(modelCID, modelHash) {
    try {
      await this._ensureConnected();
      const tx = await this.contract.updateGenesisModelCID(modelCID, modelHash);
      await tx.wait();
      return { success: true, transactionHash: tx.hash, modelCID };
    } catch (error) {
      logger.error(`Failed to update genesis: ${error.message}`);
      throw error;
    }
  }

  // ============================================================
  // MODEL QUERIES
  // ============================================================

  /**
   * Get latest global model
   */
  async getLatestModel() {
    try {
      await this._ensureConnected();
      const model = await this.contract.getLatestGlobalModel();
      return this.formatGlobalModel(model);
    } catch (error) {
      logger.error(`Failed to get latest model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get model by version
   */
  async getModelByVersion(version) {
    try {
      await this._ensureConnected();
      const model = await this.contract.getGlobalModelByVersion(version);
      return this.formatGlobalModel(model);
    } catch (error) {
      logger.error(`Failed to get model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all models
   */
  async getAllModels() {
    try {
      await this._ensureConnected();
      const count = await this.contract.getModelCount();
      const models = [];
      
      for (let i = 0; i < count; i++) {
        const model = await this.contract.getGlobalModelByVersion(i);
        models.push(this.formatGlobalModel(model));
      }
      
      return models;
    } catch (error) {
      logger.error(`Failed to get all models: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get weight metadata for a version
   */
  async getWeightMetadata(version) {
    try {
      await this._ensureConnected();
      const metadata = await this.contract.modelMetadata(version);
      return {
        totalParameters: Number(metadata.totalParameters),
        modelSize: Number(metadata.modelSize),
        inputSize: Number(metadata.inputSize),
        framework: metadata.framework,
        version: metadata.version,
        architecture: metadata.architecture
      };
    } catch (error) {
      logger.error(`Failed to get metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format global model from contract response
   */
  formatGlobalModel(model) {
    return {
      version: Number(model.version),
      modelWeightsCID: model.modelWeightsCID,
      modelHash: model.modelHash,
      timestamp: new Date(Number(model.timestamp) * 1000).toISOString(),
      totalSamples: Number(model.totalSamples),
      accuracy: Number(model.accuracy) / 100,
      aucScore: Number(model.aucScore) / 10000,
      sensitivity: Number(model.sensitivity) / 10000,
      specificity: Number(model.specificity) / 10000,
      contributorCount: Number(model.contributorCount),
      parentVersion: Number(model.parentVersion),
      ipfsUrl: `${process.env.PINATA_GATEWAY}/${model.modelWeightsCID}`
    };
  }

  /**
   * Get wallet address
   */
  getWalletAddress() {
    return this.wallet?.address;
  }

  /**
   * Get wallet balance
   */
  async getBalance() {
    await this._ensureConnected();
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }
}

// Export singleton instance
module.exports = new BlockchainService();
