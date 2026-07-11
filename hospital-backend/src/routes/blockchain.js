/**
 * Blockchain Routes for Federated Learning
 * 
 * Contract: FederatedModelRegistry
 * Network: Ethereum Sepolia Testnet
 * Model: EfficientNet-B0 + Coordinate Attention (Histopathology)
 */

const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.wallet = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      const rpcUrl = process.env.ETHEREUM_RPC_URL;
      
      if (!rpcUrl || rpcUrl === 'mock') {
        logger.warn('No RPC URL configured, using mock blockchain service');
        this.isConnected = true;
        return;
      }

      logger.info(`Connecting to Ethereum network: ${rpcUrl}`);
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Test connection
      const network = await this.provider.getNetwork();
      logger.info(`✓ Connected to network: ${network.name} (chainId: ${network.chainId})`);

      // Create wallet from private key
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey || privateKey === 'mock') {
        logger.warn('No private key provided, blockchain transactions will not work');
        this.isConnected = true;
        return;
      }

      this.wallet = new ethers.Wallet(privateKey, this.provider);
      const balance = await this.provider.getBalance(this.wallet.address);
      logger.info(`✓ Wallet address: ${this.wallet.address}`);
      logger.info(`✓ Wallet balance: ${ethers.formatEther(balance)} ETH`);

      // Load contract
      const contractAddress = process.env.CONTRACT_ADDRESS;

      if (contractAddress && contractAddress !== 'mock') {
        this.contract = new ethers.Contract(contractAddress, this.getContractABI(), this.wallet);
        logger.info(`✓ Contract loaded at: ${contractAddress}`);
      } else {
        logger.warn('No contract address configured');
      }

      this.isConnected = true;

    } catch (error) {
      logger.error('Failed to connect to blockchain:', error);
      throw error;
    }
  }

  /**
   * Updated ABI for single-modality FederatedModelRegistry contract
   * Matches deployed contract: 0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1
   */
  getContractABI() {
    return [
      // Hospital Registration
      "function registerParticipant(address _hospital, string memory _name, string memory _region) external",
      "function updateHospitalInfo(address _hospital, string memory _name, string memory _region) external",
      "function setHospitalStatus(address _hospital, bool _isActive) external",
      
      // Model Updates (single modality)
      "function submitUpdate(string memory _modelCID, bytes32 _modelHash, uint256 _sampleCount, uint256 _localAccuracy, uint256 _localAUC, uint256 _localSensitivity, uint256 _localSpecificity, uint256 _trainingDuration) external",
      "function initializeGenesisModel(string memory _modelCID, bytes32 _modelHash) external",
      
      // Oracle Functions
      "function setOracleAddress(address _oracle) external",
      "function publishNewGlobalModel(string memory _modelCID, bytes32 _modelHash, uint256 _accuracy, uint256 _aucScore, uint256 _sensitivity, uint256 _specificity) external",
      
      // Query Functions
      "function getLatestGlobalModel() external view returns (tuple(uint256 version, string modelWeightsCID, bytes32 modelHash, uint256 timestamp, uint256 totalSamples, uint256 accuracy, uint256 aucScore, uint256 sensitivity, uint256 specificity, uint256 contributorCount, uint256 parentVersion))",
      "function getHospitalInfo(address _hospital) external view returns (tuple(string name, string region, uint256 registrationTime, uint256 totalContributions, uint256 totalSamplesContributed, bool isActive))",
      "function isParticipant(address _addr) external view returns (bool)",
      "function getParticipants() external view returns (address[])",
      "function currentRound() external view returns (uint256)",
      "function getModelCount() external view returns (uint256)",
      "function getCurrentRoundSubmissions() external view returns (uint256)",
      "function getNetworkStatistics() external view returns (uint256 totalHospitals, uint256 activeHospitals, uint256 totalContributions, uint256 totalSamples, uint256 currentRoundNumber, uint256 modelsPublished)",
      
      // Events
      "event ParticipantRegistered(address indexed hospital, string name, string region)",
      "event UpdateSubmitted(address indexed contributor, uint256 indexed round, uint256 sampleCount, uint256 accuracy, uint256 auc)",
      "event NewGlobalModel(uint256 indexed version, string modelCID, uint256 accuracy, uint256 aucScore, uint256 contributorCount)"
    ];
  }

  async mockTransaction(method, params) {
    const txHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    logger.info(`Mock blockchain transaction: ${method}(${JSON.stringify(params)})`);
    
    return {
      hash: txHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 9800000,
      gasUsed: BigInt(Math.floor(Math.random() * 100000)),
      status: 1,
      mock: true
    };
  }
}

const blockchainService = new BlockchainService();

/**
 * @swagger
 * /api/blockchain/register-hospital:
 *   post:
 *     summary: Register hospital on blockchain
 */
router.post('/register-hospital', async (req, res) => {
  try {
    await blockchainService.connect();

    const {
      hospital_name = process.env.HOSPITAL_NAME,
      hospital_region = process.env.HOSPITAL_REGION,
      hospital_address = blockchainService.wallet?.address
    } = req.body;

    if (!hospital_name || !hospital_region) {
      return res.status(400).json({
        error: 'Hospital name and region are required'
      });
    }

    logger.info('Registering hospital on blockchain...');

    let result;

    if (blockchainService.contract) {
      const tx = await blockchainService.contract.registerParticipant(
        hospital_address,
        hospital_name,
        hospital_region
      );
      result = await tx.wait();
    } else {
      result = await blockchainService.mockTransaction('registerParticipant', {
        hospital_address,
        hospital_name,
        hospital_region
      });
    }

    res.json({
      success: true,
      transaction_hash: result.hash,
      block_number: result.blockNumber,
      hospital_registered: {
        name: hospital_name,
        region: hospital_region,
        address: hospital_address
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error registering hospital:', error);
    res.status(500).json({
      error: 'Hospital registration failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain/submit-model:
 *   post:
 *     summary: Submit model update to blockchain (single histopathology model)
 */
router.post('/submit-model', async (req, res) => {
  try {
    await blockchainService.connect();

    const {
      model_weights_cid,
      model_hash,
      local_samples,
      accuracy,        // Scaled by 100 (e.g., 94.5% = 9450)
      auc_score,       // Scaled by 10000 (e.g., 0.95 = 9500)
      sensitivity,     // Scaled by 100
      specificity,     // Scaled by 100
      training_time    // In seconds
    } = req.body;

    if (!model_weights_cid || !model_hash || !local_samples) {
      return res.status(400).json({
        error: 'model_weights_cid, model_hash, and local_samples are required'
      });
    }

    logger.info('Submitting histopathology model update to blockchain...');
    logger.info(`Model CID: ${model_weights_cid}`);
    logger.info(`Samples: ${local_samples}, Accuracy: ${accuracy / 100}%`);

    let result;

    if (blockchainService.contract) {
      const tx = await blockchainService.contract.submitUpdate(
        model_weights_cid,
        model_hash,
        local_samples,
        accuracy || 0,
        auc_score || 0,
        sensitivity || 0,
        specificity || 0,
        training_time || 0
      );
      result = await tx.wait();
    } else {
      result = await blockchainService.mockTransaction('submitUpdate', {
        model_weights_cid,
        model_hash,
        local_samples,
        accuracy,
        auc_score
      });
    }

    res.json({
      success: true,
      transaction_hash: result.hash,
      block_number: result.blockNumber,
      model_submission: {
        model_weights_cid,
        model_hash,
        local_samples,
        accuracy: accuracy / 100,
        auc_score: auc_score / 10000,
        model_type: 'EfficientNet-B0 + CoordinateAttention'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error submitting model to blockchain:', error);
    res.status(500).json({
      error: 'Model submission failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain/latest-model:
 *   get:
 *     summary: Get latest global histopathology model
 */
router.get('/latest-model', async (req, res) => {
  try {
    await blockchainService.connect();

    logger.info('Fetching latest global histopathology model...');

    let modelData;

    if (blockchainService.contract) {
      try {
        const result = await blockchainService.contract.getLatestGlobalModel();
        modelData = {
          model_weights_cid: result.modelWeightsCID,
          model_hash: result.modelHash,
          version: result.version.toString(),
          timestamp: new Date(Number(result.timestamp) * 1000).toISOString(),
          total_samples: result.totalSamples.toString(),
          accuracy: Number(result.accuracy) / 100,
          auc_score: Number(result.aucScore) / 10000,
          sensitivity: Number(result.sensitivity) / 10000,
          specificity: Number(result.specificity) / 10000,
          contributor_count: result.contributorCount.toString(),
          parent_version: result.parentVersion.toString()
        };
      } catch (e) {
        // No models published yet
        modelData = null;
      }
    } else {
      modelData = {
        model_weights_cid: 'QmMockHistoModel...',
        model_hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        version: '0',
        timestamp: new Date().toISOString(),
        total_samples: '0',
        accuracy: 0,
        auc_score: 0,
        contributor_count: '0',
        mock: true
      };
    }

    res.json({
      success: true,
      model_type: 'EfficientNet-B0 + CoordinateAttention',
      task: 'Histopathology Binary Classification',
      latest_model: modelData,
      query_timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching latest model:', error);
    res.status(500).json({
      error: 'Failed to fetch latest model',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain/hospital-info:
 *   get:
 *     summary: Get hospital information
 */
router.get('/hospital-info', async (req, res) => {
  try {
    await blockchainService.connect();

    const hospitalAddress = req.query.address || blockchainService.wallet?.address;

    logger.info(`Fetching hospital info: ${hospitalAddress}`);

    let hospitalInfo;

    if (blockchainService.contract && hospitalAddress) {
      try {
        const result = await blockchainService.contract.getHospitalInfo(hospitalAddress);
        hospitalInfo = {
          name: result.name,
          region: result.region,
          address: hospitalAddress,
          is_active: result.isActive,
          registration_time: result.registrationTime > 0
            ? new Date(Number(result.registrationTime) * 1000).toISOString()
            : null,
          total_contributions: result.totalContributions.toString(),
          total_samples: result.totalSamplesContributed.toString()
        };
      } catch (e) {
        hospitalInfo = null;
      }
    } else {
      hospitalInfo = {
        name: process.env.HOSPITAL_NAME || 'Mock Hospital',
        region: process.env.HOSPITAL_REGION || 'Mock Region',
        address: hospitalAddress,
        is_active: true,
        total_contributions: '0',
        total_samples: '0',
        mock: true
      };
    }

    res.json({
      success: true,
      hospital_info: hospitalInfo,
      query_timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching hospital info:', error);
    res.status(500).json({
      error: 'Failed to fetch hospital information',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain/network-status:
 *   get:
 *     summary: Get blockchain network status
 */
router.get('/network-status', async (req, res) => {
  try {
    await blockchainService.connect();

    let networkInfo = {};
    let contractInfo = {};

    if (blockchainService.provider) {
      try {
        const network = await blockchainService.provider.getNetwork();
        const blockNumber = await blockchainService.provider.getBlockNumber();
        const feeData = await blockchainService.provider.getFeeData();

        networkInfo = {
          network_name: network.name,
          chain_id: network.chainId.toString(),
          current_block: blockNumber,
          gas_price: feeData.gasPrice?.toString() || '0',
          connected: true
        };
      } catch (error) {
        networkInfo = {
          connected: false,
          error: error.message
        };
      }
    } else {
      networkInfo = {
        connected: false,
        mock_mode: true
      };
    }

    if (blockchainService.contract) {
      try {
        const stats = await blockchainService.contract.getNetworkStatistics();
        contractInfo = {
          total_hospitals: stats.totalHospitals.toString(),
          active_hospitals: stats.activeHospitals.toString(),
          total_contributions: stats.totalContributions.toString(),
          total_samples: stats.totalSamples.toString(),
          current_round: stats.currentRoundNumber.toString(),
          models_published: stats.modelsPublished.toString()
        };
      } catch (e) {
        contractInfo = { error: 'Failed to fetch contract stats' };
      }
    }

    res.json({
      success: true,
      network: networkInfo,
      contract: {
        address: process.env.CONTRACT_ADDRESS || 'mock',
        ...contractInfo
      },
      wallet_address: blockchainService.wallet?.address || 'not configured',
      model_type: 'EfficientNet-B0 + CoordinateAttention (Histopathology)',
      query_timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting network status:', error);
    res.status(500).json({
      error: 'Failed to get network status',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/blockchain/initialize-genesis:
 *   post:
 *     summary: Initialize genesis model (owner only)
 */
router.post('/initialize-genesis', async (req, res) => {
  try {
    await blockchainService.connect();

    const { model_cid, model_hash } = req.body;

    if (!model_cid || !model_hash) {
      return res.status(400).json({
        error: 'model_cid and model_hash are required'
      });
    }

    logger.info('Initializing genesis histopathology model...');

    let result;

    if (blockchainService.contract) {
      const tx = await blockchainService.contract.initializeGenesisModel(model_cid, model_hash);
      result = await tx.wait();
    } else {
      result = await blockchainService.mockTransaction('initializeGenesisModel', {
        model_cid,
        model_hash
      });
    }

    res.json({
      success: true,
      transaction_hash: result.hash,
      block_number: result.blockNumber,
      genesis_model: {
        model_cid,
        model_hash,
        model_type: 'EfficientNet-B0 + CoordinateAttention'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error initializing genesis model:', error);
    res.status(500).json({
      error: 'Genesis model initialization failed',
      message: error.message
    });
  }
});

module.exports = router;
