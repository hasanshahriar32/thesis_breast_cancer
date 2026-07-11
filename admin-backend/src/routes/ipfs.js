/**
 * IPFS Routes
 * 
 * API endpoints for IPFS operations.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ipfsService = require('../services/ipfsService');
const logger = require('../utils/logger');

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../temp/uploads'),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

/**
 * @swagger
 * /api/ipfs/status:
 *   get:
 *     summary: Test IPFS connection
 *     tags: [IPFS]
 *     responses:
 *       200:
 *         description: IPFS connection status
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = await ipfsService.testConnection();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ipfs/upload:
 *   post:
 *     summary: Upload file to IPFS
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upload result
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const metadata = {
      name: req.body.name || req.file.originalname,
      type: req.body.type || 'general'
    };
    
    const result = await ipfsService.uploadFile(req.file.path, metadata);
    
    // Clean up temp file
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/ipfs/upload-json:
 *   post:
 *     summary: Upload JSON to IPFS
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upload result
 */
router.post('/upload-json', async (req, res, next) => {
  try {
    const { data, name } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'data is required' });
    }
    
    const result = await ipfsService.uploadJSON(data, name);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ipfs/{cid}:
 *   get:
 *     summary: Get content from IPFS
 *     tags: [IPFS]
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: string
 *         description: IPFS CID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [json, file]
 *         description: Content type (default json)
 *     responses:
 *       200:
 *         description: Content from IPFS
 */
router.get('/:cid', async (req, res, next) => {
  try {
    const { cid } = req.params;
    const type = req.query.type || 'json';
    
    if (type === 'json') {
      const data = await ipfsService.getJSON(cid);
      res.json(data);
    } else {
      const buffer = await ipfsService.getFileBuffer(cid);
      res.set('Content-Type', 'application/octet-stream');
      res.send(buffer);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ipfs/{cid}/download:
 *   get:
 *     summary: Download file from IPFS
 *     tags: [IPFS]
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: filename
 *         schema:
 *           type: string
 *         description: Download filename
 *     responses:
 *       200:
 *         description: File download
 */
router.get('/:cid/download', async (req, res, next) => {
  try {
    const { cid } = req.params;
    const filename = req.query.filename || `${cid}.bin`;
    
    const buffer = await ipfsService.getFileBuffer(cid);
    
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ipfs/pins:
 *   get:
 *     summary: List pinned files
 *     tags: [IPFS]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Max results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of pinned files
 */
router.get('/pins', async (req, res, next) => {
  try {
    const filters = {
      status: 'pinned',
      pageLimit: req.query.limit || 10,
      pageOffset: req.query.offset || 0
    };
    
    const result = await ipfsService.listPins(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ipfs/{cid}:
 *   delete:
 *     summary: Unpin file from IPFS
 *     tags: [IPFS]
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File unpinned
 */
router.delete('/:cid', async (req, res, next) => {
  try {
    const result = await ipfsService.unpin(req.params.cid);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/ipfs/hash:
 *   post:
 *     summary: Calculate file hash
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File hash
 */
router.post('/hash', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const hash = ipfsService.calculateFileHash(req.file.path);
    const stats = fs.statSync(req.file.path);
    
    // Clean up
    fs.unlinkSync(req.file.path);
    
    res.json({
      hash,
      size: stats.size,
      filename: req.file.originalname
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/ipfs/gateway/{cid}:
 *   get:
 *     summary: Get gateway URL for CID
 *     tags: [IPFS]
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gateway URL
 */
router.get('/gateway/:cid', async (req, res, next) => {
  try {
    const url = ipfsService.getGatewayUrl(req.params.cid);
    res.json({ cid: req.params.cid, url });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
