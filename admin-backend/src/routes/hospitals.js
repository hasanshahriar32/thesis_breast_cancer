/**
 * Hospital Management Routes
 * 
 * API endpoints for registering and managing hospital participants.
 */

const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/hospitals:
 *   get:
 *     summary: Get all registered hospitals
 *     tags: [Hospitals]
 *     responses:
 *       200:
 *         description: List of all registered hospitals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hospitals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hospital'
 *                 count:
 *                   type: integer
 */
router.get('/', async (req, res, next) => {
  try {
    const hospitals = await blockchainService.getAllHospitals();
    res.json({
      hospitals,
      count: hospitals.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hospitals/{address}:
 *   get:
 *     summary: Get hospital by address
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Ethereum address of the hospital
 *     responses:
 *       200:
 *         description: Hospital information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hospital'
 */
router.get('/:address', async (req, res, next) => {
  try {
    const hospital = await blockchainService.getHospitalInfo(req.params.address);
    res.json(hospital);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hospitals/register:
 *   post:
 *     summary: Register a new hospital
 *     tags: [Hospitals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - name
 *               - region
 *             properties:
 *               address:
 *                 type: string
 *                 description: Ethereum address
 *                 example: "0x1234..."
 *               name:
 *                 type: string
 *                 description: Hospital name
 *                 example: "Boston General Hospital"
 *               region:
 *                 type: string
 *                 description: Geographic region
 *                 example: "North America"
 *     responses:
 *       200:
 *         description: Hospital registered successfully
 *       400:
 *         description: Invalid input
 */
router.post('/register', async (req, res, next) => {
  try {
    const { address, name, region } = req.body;
    
    if (!address || !name || !region) {
      return res.status(400).json({ error: 'address, name, and region are required' });
    }
    
    const result = await blockchainService.registerHospital(address, name, region);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hospitals/{address}:
 *   put:
 *     summary: Update hospital information
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - region
 *             properties:
 *               name:
 *                 type: string
 *               region:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hospital updated successfully
 */
router.put('/:address', async (req, res, next) => {
  try {
    const { name, region } = req.body;
    
    if (!name || !region) {
      return res.status(400).json({ error: 'name and region are required' });
    }
    
    const result = await blockchainService.updateHospitalInfo(req.params.address, name, region);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hospitals/{address}/status:
 *   patch:
 *     summary: Set hospital active/inactive status
 *     tags: [Hospitals]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Hospital status updated
 */
router.patch('/:address/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive (boolean) is required' });
    }
    
    const result = await blockchainService.setHospitalStatus(req.params.address, isActive);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
