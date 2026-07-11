/**
 * Models Routes
 * 
 * API endpoints for global model management and history.
 */

const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/models:
 *   get:
 *     summary: Get all global models
 *     tags: [Models]
 *     responses:
 *       200:
 *         description: List of all global models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 models:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GlobalModel'
 *                 count:
 *                   type: integer
 */
router.get('/', async (req, res, next) => {
  try {
    const models = await blockchainService.getAllModels();
    res.json({
      models,
      count: models.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/models/latest:
 *   get:
 *     summary: Get latest global model
 *     tags: [Models]
 *     responses:
 *       200:
 *         description: Latest global model
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GlobalModel'
 */
router.get('/latest', async (req, res, next) => {
  try {
    const model = await blockchainService.getLatestModel();
    res.json(model);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/models/history:
 *   get:
 *     summary: Get model training history with metrics
 *     tags: [Models]
 *     responses:
 *       200:
 *         description: Training history
 */
router.get('/history', async (req, res, next) => {
  try {
    const models = await blockchainService.getAllModels();
    
    // Format as training history
    const history = models.map(model => ({
      round: model.version,
      timestamp: model.timestamp,
      accuracy: model.accuracy,
      aucScore: model.aucScore,
      sensitivity: model.sensitivity,
      specificity: model.specificity,
      contributors: model.contributorCount,
      totalSamples: model.totalSamples,
      modelCID: model.modelWeightsCID
    }));
    
    res.json({
      history,
      totalRounds: models.length,
      latestAccuracy: models.length > 0 ? models[models.length - 1].accuracy : null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/models/{version}:
 *   get:
 *     summary: Get model by version
 *     tags: [Models]
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *         description: Model version number
 *     responses:
 *       200:
 *         description: Model information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GlobalModel'
 */
router.get('/:version', async (req, res, next) => {
  try {
    const version = parseInt(req.params.version);
    if (isNaN(version)) {
      return res.status(400).json({ error: 'version must be a number' });
    }
    const model = await blockchainService.getModelByVersion(version);
    res.json(model);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/models/{version}/metadata:
 *   get:
 *     summary: Get model weight metadata
 *     tags: [Models]
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Model weight metadata
 */
router.get('/:version/metadata', async (req, res, next) => {
  try {
    const version = parseInt(req.params.version);
    const metadata = await blockchainService.getWeightMetadata(version);
    res.json(metadata);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/models/{version}/metadata:
 *   post:
 *     summary: Store model weight metadata
 *     tags: [Models]
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totalParams
 *               - modelSize
 *               - inputSize
 *               - framework
 *               - frameworkVersion
 *               - architecture
 *             properties:
 *               totalParams:
 *                 type: integer
 *                 description: Total model parameters
 *                 example: 5900000
 *               modelSize:
 *                 type: integer
 *                 description: Model file size in bytes
 *                 example: 24000000
 *               inputSize:
 *                 type: integer
 *                 description: Input image size
 *                 example: 160
 *               framework:
 *                 type: string
 *                 example: "PyTorch"
 *               frameworkVersion:
 *                 type: string
 *                 example: "2.0.0"
 *               architecture:
 *                 type: string
 *                 example: "EfficientNet-B0 + CoordinateAttention"
 *     responses:
 *       200:
 *         description: Metadata stored
 */
router.post('/:version/metadata', async (req, res, next) => {
  try {
    const version = parseInt(req.params.version);
    const { totalParams, modelSize, inputSize, framework, frameworkVersion, architecture } = req.body;
    
    const result = await blockchainService.storeWeightMetadata(
      version,
      totalParams,
      modelSize,
      inputSize,
      framework,
      frameworkVersion,
      architecture
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
      totalRounds: models.length,
      latestAccuracy: models.length > 0 ? models[models.length - 1].accuracy : null
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
