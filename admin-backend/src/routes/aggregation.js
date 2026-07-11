/**
 * Model Aggregation Routes
 * 
 * API endpoints for FedProx aggregation and model publishing.
 * Server-side aggregation uses weighted averaging (same as FedAvg);
 * the FedProx innovation is on the client side (proximal term in local training).
 */

const express = require('express');
const router = express.Router();
const aggregationService = require('../services/aggregationService');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/aggregation/status:
 *   get:
 *     summary: Check if aggregation is ready
 *     tags: [Aggregation]
 *     responses:
 *       200:
 *         description: Aggregation readiness status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ready:
 *                   type: boolean
 *                 pendingUpdates:
 *                   type: integer
 *                 requiredSubmissions:
 *                   type: integer
 *                 currentRound:
 *                   type: integer
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = await aggregationService.isAggregationReady();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/aggregation/pending:
 *   get:
 *     summary: Get all pending model updates
 *     tags: [Aggregation]
 *     responses:
 *       200:
 *         description: List of pending updates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ModelUpdate'
 *                 count:
 *                   type: integer
 */
router.get('/pending', async (req, res, next) => {
  try {
    const updates = await aggregationService.getPendingUpdatesDetails();
    res.json({
      updates,
      count: updates.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/aggregation/run:
 *   post:
 *     summary: Run FedProx server-side aggregation
 *     description: Downloads pending models, performs weighted averaging (FedProx server-side), uploads result to IPFS
 *     tags: [Aggregation]
 *     responses:
 *       200:
 *         description: Aggregation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 aggregatedModel:
 *                   type: object
 *                   properties:
 *                     cid:
 *                       type: string
 *                     hash:
 *                       type: string
 *                     url:
 *                       type: string
 *                 metrics:
 *                   type: object
 *       400:
 *         description: Not ready for aggregation
 */
router.post('/run', async (req, res, next) => {
  try {
    logger.info('API: Starting FedProx aggregation...');
    const result = await aggregationService.runAggregation();
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/aggregation/publish:
 *   post:
 *     summary: Publish aggregated model to blockchain
 *     description: After running aggregation, publish the new global model on-chain
 *     tags: [Aggregation]
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
 *                 description: IPFS CID of aggregated model
 *               modelHash:
 *                 type: string
 *                 description: SHA-256 hash of model file
 *               accuracy:
 *                 type: number
 *                 description: Model accuracy (0-100)
 *               aucScore:
 *                 type: number
 *                 description: AUC-ROC score (0-1)
 *               sensitivity:
 *                 type: number
 *                 description: Sensitivity (0-100)
 *               specificity:
 *                 type: number
 *                 description: Specificity (0-100)
 *     responses:
 *       200:
 *         description: Model published successfully
 */
router.post('/publish', async (req, res, next) => {
  try {
    const { modelCID, modelHash, accuracy, aucScore, sensitivity, specificity } = req.body;
    
    if (!modelCID || !modelHash) {
      return res.status(400).json({ error: 'modelCID and modelHash are required' });
    }
    
    const result = await blockchainService.publishGlobalModel(
      modelCID,
      modelHash,
      accuracy || 85,
      aucScore || 0.85,
      sensitivity || 87,
      specificity || 83
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/aggregation/run-and-publish:
 *   post:
 *     summary: Run aggregation and publish in one step
 *     description: Complete workflow - aggregate pending updates and publish new global model
 *     tags: [Aggregation]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accuracy:
 *                 type: number
 *               aucScore:
 *                 type: number
 *               sensitivity:
 *                 type: number
 *               specificity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Aggregation and publishing complete
 */
router.post('/run-and-publish', async (req, res, next) => {
  try {
    logger.info('API: Running full FedProx aggregation workflow...');
    
    // Step 1: Run aggregation
    const aggregationResult = await aggregationService.runAggregation();
    
    if (!aggregationResult.success) {
      return res.status(400).json(aggregationResult);
    }
    
    // Step 2: Publish to blockchain with optional custom metrics
    const metrics = req.body || {};
    const publishResult = await aggregationService.publishAggregatedModel(
      aggregationResult,
      metrics
    );
    
    // Step 3: Clean up temp files
    aggregationService.cleanup();
    
    res.json({
      success: true,
      aggregation: aggregationResult,
      blockchain: publishResult
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/aggregation/cleanup:
 *   post:
 *     summary: Clean up temporary files
 *     tags: [Aggregation]
 *     responses:
 *       200:
 *         description: Cleanup complete
 */
router.post('/cleanup', async (req, res, next) => {
  try {
    aggregationService.cleanup();
    res.json({ success: true, message: 'Temporary files cleaned up' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
