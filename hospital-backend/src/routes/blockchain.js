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
      // Connect to Ethereum network (Sepolia testnet)
      const rpcUrl = process.env.ETHEREUM_RPC_URL;
      
      if (!rpcUrl || rpcUrl === 'mock') {
        logger.warn('No RPC URL configured, using mock blockchain service');
        this.isConnected = true;
        return;
      }

      logger.info(`Connecting to Ethereum network: ${rpcUrl}`);
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

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
      const balance = await this.wallet.getBalance();
      logger.info(`✓ Wallet address: ${this.wallet.address}`);
      logger.info(`✓ Wallet balance: ${ethers.utils.formatEther(balance)} ETH`);

      // Load contract
      const contractAddress = process.env.CONTRACT_ADDRESS;
      const contractABI = this.getContractABI();

      if (contractAddress && contractAddress !== 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE' && contractAddress !== 'mock') {
        this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
        logger.info(`✓ Contract loaded at: ${contractAddress}`);
      } else {
        logger.warn('No contract address configured, contract interactions will not work');
      }

      this.isConnected = true;

    } catch (error) {
      logger.error('Failed to connect to blockchain:', error);
      throw error;
    }
  }

  getContractABI() {
    // Simplified ABI for the FederatedModelRegistry contract
    return [
      "function registerHospital(string memory name, string memory region, address hospitalAddress) external",
      "function submitModelWeights(string memory fusionCID, string memory xrayCID, string memory histoCID, string memory ultraCID, bytes32 modelHash, string memory performanceMetrics) external",
      "function getHospitalInfo(uint256 hospitalId) external view returns (string memory, string memory, address, bool, uint256)",
      "function getLatestModel() external view returns (uint256, string memory, string memory, string memory, string memory, bytes32)",
      "function getModelLineage(uint256 modelId) external view returns (uint256[] memory)",
      "event HospitalRegistered(uint256 indexed hospitalId, string name, address hospitalAddress)",
      "event ModelSubmitted(uint256 indexed modelId, uint256 indexed hospitalId, string fusionCID, bytes32 modelHash)"
    ];
  }

  async mockTransaction(method, params) {
    // Mock transaction for development
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    logger.info(`Mock blockchain transaction: ${method}(${JSON.stringify(params)})`);
    
    return {
      hash: txHash,
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: ethers.BigNumber.from(Math.floor(Math.random() * 100000)),
      status: 1,
      mock: true
    };
  }
}

const blockchainService = new BlockchainService();

// Register hospital on blockchain
router.post('/register-hospital', async (req, res) => {
  try {
    await blockchainService.connect();

    const {
      hospital_name = process.env.HOSPITAL_NAME,
      hospital_region = process.env.HOSPITAL_REGION
    } = req.body;

    logger.info('Registering hospital on blockchain...');

    let result;

    if (blockchainService.contract) {
      // Real blockchain transaction
      const tx = await blockchainService.contract.registerHospital(
        hospital_name,
        hospital_region,
        blockchainService.wallet.address
      );
      
      result = await tx.wait();
    } else {
      // Mock transaction
      result = await blockchainService.mockTransaction('registerHospital', {
        hospital_name,
        hospital_region,
        address: blockchainService.wallet.address
      });
    }

    res.json({
      success: true,
      transaction_hash: result.hash,
      block_number: result.blockNumber,
      gas_used: result.gasUsed?.toString() || '50000',
      hospital_registered: {
        name: hospital_name,
        region: hospital_region,
        address: blockchainService.wallet.address
      },
      registration_timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error registering hospital:', error);
    res.status(500).json({
      error: 'Hospital registration failed',
      message: error.message
    });
  }
});

// Submit model weights to blockchain
router.post('/submit-model', async (req, res) => {
  try {
    await blockchainService.connect();

    const {
      fusion_cid,
      xray_cid,
      histopathology_cid,
      ultrasound_cid,
      model_hash,
      performance_metrics
    } = req.body;

    if (!fusion_cid || !model_hash) {
      return res.status(400).json({
        error: 'Fusion CID and model hash are required'
      });
    }

    logger.info('Submitting model weights to blockchain...');

    let result;

    if (blockchainService.contract) {
      // Real blockchain transaction
      const tx = await blockchainService.contract.submitModelWeights(
        fusion_cid,
        xray_cid || '',
        histopathology_cid || '',
        ultrasound_cid || '',
        model_hash,
        performance_metrics || ''
      );
      
      result = await tx.wait();
    } else {
      // Mock transaction
      result = await blockchainService.mockTransaction('submitModelWeights', {
        fusion_cid,
        xray_cid,
        histopathology_cid,
        ultrasound_cid,
        model_hash,
        performance_metrics
      });
    }

    res.json({
      success: true,
      transaction_hash: result.hash,
      block_number: result.blockNumber,
      gas_used: result.gasUsed?.toString() || '80000',
      model_submission: {
        fusion_cid,
        extractor_cids: {
          xray: xray_cid,
          histopathology: histopathology_cid,
          ultrasound: ultrasound_cid
        },
        model_hash,
        performance_metrics
      },
      submission_timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error submitting model to blockchain:', error);
    res.status(500).json({
      error: 'Model submission failed',
      message: error.message
    });
  }
});

// Get latest model from blockchain
router.get('/latest-model', async (req, res) => {
  try {
    await blockchainService.connect();

    logger.info('Fetching latest model from blockchain...');

    let modelData;

    if (blockchainService.contract) {
      // Real blockchain query
      const result = await blockchainService.contract.getLatestModel();
      modelData = {
        model_id: result[0].toString(),
        fusion_cid: result[1],
        xray_cid: result[2],
        histopathology_cid: result[3],
        ultrasound_cid: result[4],
        model_hash: result[5]
      };
    } else {
      // Mock data
      modelData = {
        model_id: '1',
        fusion_cid: 'QmMockFusion123...',
        xray_cid: 'QmMockXray123...',
        histopathology_cid: 'QmMockHisto123...',
        ultrasound_cid: 'QmMockUltra123...',
        model_hash: '0x' + Math.random().toString(16).substr(2, 64)
      };
    }

    res.json({
      success: true,
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

// Get hospital information from blockchain
router.get('/hospital-info/:hospitalId', async (req, res) => {
  try {
    await blockchainService.connect();

    const { hospitalId } = req.params;

    logger.info(`Fetching hospital info from blockchain: ${hospitalId}`);

    let hospitalInfo;

    if (blockchainService.contract) {
      // Real blockchain query
      const result = await blockchainService.contract.getHospitalInfo(hospitalId);
      hospitalInfo = {
        name: result[0],
        region: result[1],
        address: result[2],
        active: result[3],
        models_submitted: result[4].toString()
      };
    } else {
      // Mock data
      hospitalInfo = {
        name: 'Mock Hospital',
        region: 'Mock Region',
        address: blockchainService.wallet.address,
        active: true,
        models_submitted: '3'
      };
    }

    res.json({
      success: true,
      hospital_id: hospitalId,
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

// Get blockchain network status
router.get('/network-status', async (req, res) => {
  try {
    await blockchainService.connect();

    let networkInfo = {};

    if (blockchainService.provider) {
      try {
        const network = await blockchainService.provider.getNetwork();
        const blockNumber = await blockchainService.provider.getBlockNumber();
        const gasPrice = await blockchainService.provider.getGasPrice();

        networkInfo = {
          network_name: network.name,
          chain_id: network.chainId,
          current_block: blockNumber,
          gas_price: gasPrice.toString(),
          connected: true
        };
      } catch (error) {
        networkInfo = {
          connected: false,
          error: error.message,
          mock_mode: true
        };
      }
    } else {
      networkInfo = {
        connected: false,
        mock_mode: true,
        message: 'Using mock blockchain service'
      };
    }

    res.json({
      success: true,
      network_status: networkInfo,
      wallet_address: blockchainService.wallet.address,
      contract_address: process.env.CONTRACT_ADDRESS || 'mock_contract',
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

// Estimate gas for operations
router.post('/estimate-gas', async (req, res) => {
  try {
    await blockchainService.connect();

    const { operation, parameters = {} } = req.body;

    let gasEstimate;

    if (blockchainService.contract) {
      // Real gas estimation
      try {
        switch (operation) {
          case 'registerHospital':
            gasEstimate = await blockchainService.contract.estimateGas.registerHospital(
              parameters.name || 'Hospital',
              parameters.region || 'Region',
              parameters.address || blockchainService.wallet.address
            );
            break;
          case 'submitModelWeights':
            gasEstimate = await blockchainService.contract.estimateGas.submitModelWeights(
              parameters.fusion_cid || 'QmTest',
              parameters.xray_cid || '',
              parameters.histopathology_cid || '',
              parameters.ultrasound_cid || '',
              parameters.model_hash || '0x0000',
              parameters.performance_metrics || ''
            );
            break;
          default:
            gasEstimate = ethers.BigNumber.from('50000'); // Default estimate
        }
      } catch (error) {
        gasEstimate = ethers.BigNumber.from('100000'); // Fallback estimate
      }
    } else {
      // Mock gas estimates
      const mockEstimates = {
        registerHospital: '45000',
        submitModelWeights: '85000'
      };
      gasEstimate = ethers.BigNumber.from(mockEstimates[operation] || '50000');
    }

    res.json({
      success: true,
      operation: operation,
      gas_estimate: gasEstimate.toString(),
      estimated_cost_eth: ethers.utils.formatEther(gasEstimate.mul('20000000000')), // 20 Gwei
      parameters: parameters,
      estimation_timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error estimating gas:', error);
    res.status(500).json({
      error: 'Gas estimation failed',
      message: error.message
    });
  }
});

module.exports = router;