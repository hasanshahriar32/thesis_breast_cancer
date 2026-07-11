/**
 * Network Management Routes
 * 
 * API endpoints for network configuration and control.
 */

const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');
const ipfsService = require('../services/ipfsService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/network/status:
 *   get:
 *     summary: Get network status
 *     tags: [Network]
 *     responses:
 *       200:
 *         description: Current network status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NetworkStatus'
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = await blockchainService.getNetworkStatus();
    const balance = await blockchainService.getBalance();
    
    res.json({
      ...status,
      adminWallet: {
        address: blockchainService.getWalletAddress(),
        balance: `${balance} ETH`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/network/oracle:
 *   post:
 *     summary: Set oracle address
 *     tags: [Network]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: New oracle Ethereum address
 *     responses:
 *       200:
 *         description: Oracle updated
 */
router.post('/oracle', async (req, res, next) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    
    const result = await blockchainService.setOracle(address);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/network/config:
 *   patch:
 *     summary: Update network configuration
 *     tags: [Network]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requiredSubmissions:
 *                 type: integer
 *                 minimum: 3
 *                 description: Required submissions per round
 *               minSamplesPerUpdate:
 *                 type: integer
 *                 minimum: 100
 *                 description: Minimum samples per update
 *     responses:
 *       200:
 *         description: Configuration updated
 */
router.patch('/config', async (req, res, next) => {
  try {
    const { requiredSubmissions, minSamplesPerUpdate } = req.body;
    const results = {};
    
    if (requiredSubmissions !== undefined) {
      results.requiredSubmissions = await blockchainService.setRequiredSubmissions(requiredSubmissions);
    }
    
    if (minSamplesPerUpdate !== undefined) {
      results.minSamples = await blockchainService.setMinSamples(minSamplesPerUpdate);
    }
    
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/network/pause:
 *   post:
 *     summary: Pause the contract
 *     tags: [Network]
 *     responses:
 *       200:
 *         description: Contract paused
 */
router.post('/pause', async (req, res, next) => {
  try {
    const result = await blockchainService.pause();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/network/unpause:
 *   post:
 *     summary: Unpause the contract
 *     tags: [Network]
 *     responses:
 *       200:
 *         description: Contract unpaused
 */
router.post('/unpause', async (req, res, next) => {
  try {
    const result = await blockchainService.unpause();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/network/genesis:
 *   post:
 *     summary: Initialize genesis model
 *     tags: [Network]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelCID
 *               - modelHash
 *             properties:
 *               modelCID:
 *                 type: string
 *                 description: IPFS CID of genesis model
 *               modelHash:
 *                 type: string
 *                 description: SHA-256 hash of model
 *     responses:
 *       200:
 *         description: Genesis model initialized
 */
router.post('/genesis', async (req, res, next) => {
  try {
    const { modelCID, modelHash } = req.body;
    
    if (!modelCID || !modelHash) {
      return res.status(400).json({ error: 'modelCID and modelHash are required' });
    }
    
    const result = await blockchainService.initializeGenesis(modelCID, modelHash);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/network/genesis:
 *   put:
 *     summary: Update genesis model CID (emergency fix)
 *     tags: [Network]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelCID
 *               - modelHash
 *             properties:
 *               modelCID:
 *                 type: string
 *               modelHash:
 *                 type: string
 *     responses:
 *       200:
 *         description: Genesis CID updated
 */
router.put('/genesis', async (req, res, next) => {
  try {
    const { modelCID, modelHash } = req.body;
    
    if (!modelCID || !modelHash) {
      return res.status(400).json({ error: 'modelCID and modelHash are required' });
    }
    
    const result = await blockchainService.updateGenesisCID(modelCID, modelHash);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/network/connections:
 *   get:
 *     summary: Test all external connections
 *     tags: [Network]
 *     responses:
 *       200:
 *         description: Connection status
 */
router.get('/connections', async (req, res, next) => {
  try {
    // Test blockchain connection
    let blockchain = { connected: false };
    try {
      const status = await blockchainService.getNetworkStatus();
      blockchain = { 
        connected: true, 
        contract: status.contractAddress,
        network: status.network
      };
    } catch (error) {
      blockchain = { connected: false, error: error.message };
    }
    
    // Test IPFS connection
    const ipfs = await ipfsService.testConnection();
    
    res.json({
      blockchain,
      ipfs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
