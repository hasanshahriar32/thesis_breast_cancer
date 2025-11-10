const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const featureExtractor = require('../services/featureExtractor');

// Extract features from uploaded images
router.post('/extract', async (req, res) => {
  try {
    const { patient_id, modalities = ['xray', 'histopathology', 'ultrasound'] } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'Patient ID required' });
    }

    logger.info(`Extracting features for patient: ${patient_id}`);

    // Get patient data
    const patientService = require('../services/patient');
    const patient = await patientService.getPatient(patient_id, {
      hospital_id: process.env.HOSPITAL_ID
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Extract features for requested modalities
    const extractedFeatures = await featureExtractor.extractPatientFeatures(patient, modalities);

    res.json({
      success: true,
      patient_id: patient_id,
      features: extractedFeatures,
      extraction_timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error extracting features:', error);
    res.status(500).json({
      error: 'Feature extraction failed',
      message: error.message
    });
  }
});

// Get feature extraction status
router.get('/status', async (req, res) => {
  try {
    const status = {
      models_loaded: featureExtractor.isInitialized,
      available_modalities: ['xray', 'histopathology', 'ultrasound'],
      feature_dimensions: {
        xray: 1280,
        histopathology: 1280,
        ultrasound: 1280,
        total_combined: 3840
      },
      extraction_capabilities: {
        batch_processing: true,
        real_time: true,
        encryption_support: true
      }
    };

    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting feature extraction status:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
});

// Get interpretable feature categories
router.get('/categories', (req, res) => {
  try {
    const categories = {
      tissue_characteristics: [
        'tissue_density',
        'cellular_morphology',
        'nuclear_features',
        'stromal_characteristics'
      ],
      lesion_analysis: [
        'lesion_morphology',
        'mass_characteristics',
        'boundary_definition',
        'architectural_distortion'
      ],
      vascular_imaging: [
        'vascular_patterns',
        'doppler_flow',
        'perfusion_metrics'
      ],
      pathological_markers: [
        'calcification_patterns',
        'necrosis_areas',
        'inflammatory_markers',
        'mitotic_activity'
      ],
      molecular_features: [
        'hormone_receptors',
        'proliferation_index',
        'molecular_subtypes',
        'genomic_instability'
      ],
      texture_analysis: [
        'echo_texture',
        'surface_irregularity',
        'homogeneity_measures'
      ]
    };

    res.json({
      success: true,
      feature_categories: categories,
      total_categories: Object.values(categories).flat().length,
      description: 'Interpretable feature categories for breast cancer analysis'
    });

  } catch (error) {
    logger.error('Error getting feature categories:', error);
    res.status(500).json({
      error: 'Failed to get feature categories',
      message: error.message
    });
  }
});

module.exports = router;