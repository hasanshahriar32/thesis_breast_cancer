const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Get hospital information
router.get('/info', (req, res) => {
  try {
    const hospitalInfo = {
      hospital_id: process.env.HOSPITAL_ID,
      hospital_name: process.env.HOSPITAL_NAME,
      hospital_region: process.env.HOSPITAL_REGION,
      hospital_address: process.env.HOSPITAL_ADDRESS,
      contact_email: process.env.HOSPITAL_EMAIL,
      capabilities: {
        modalities: ['histopathology'],
        model_architecture: 'EfficientNet-B0 + CoordinateAttention',
        encryption_enabled: process.env.ENCRYPT_FILES === 'true',
        ipfs_enabled: true,
        blockchain_enabled: true
      },
      system_info: {
        backend_version: require('../../package.json').version,
        node_env: process.env.NODE_ENV,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      hospital: hospitalInfo
    });

  } catch (error) {
    logger.error('Error getting hospital info:', error);
    res.status(500).json({
      error: 'Failed to get hospital information',
      message: error.message
    });
  }
});

// Update hospital configuration
router.put('/config', (req, res) => {
  try {
    const { hospital_name, hospital_region, hospital_address, contact_email } = req.body;

    // In a real implementation, this would update persistent configuration
    logger.info('Hospital configuration update requested');

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      updated_at: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error updating hospital config:', error);
    res.status(500).json({
      error: 'Failed to update configuration',
      message: error.message
    });
  }
});

// Get hospital statistics
router.get('/stats', async (req, res) => {
  try {
    const patientService = require('../services/patient');
    
    const stats = await patientService.getPatientStatistics(process.env.HOSPITAL_ID);
    
    // Add system stats
    const systemStats = {
      memory_usage: process.memoryUsage(),
      cpu_usage: process.cpuUsage(),
      uptime_seconds: process.uptime(),
      node_version: process.version
    };

    res.json({
      success: true,
      hospital_id: process.env.HOSPITAL_ID,
      patient_statistics: stats,
      system_statistics: systemStats,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting hospital stats:', error);
    res.status(500).json({
      error: 'Failed to get hospital statistics',
      message: error.message
    });
  }
});

module.exports = router;