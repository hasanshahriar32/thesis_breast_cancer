/**
 * Aggregation Service
 * 
 * Implements the server-side component of FedProx (Li et al., MLSys 2020) for combining
 * model updates from multiple hospitals. In FedProx, the server-side aggregation is a
 * weighted average (identical to FedAvg), while the client-side training includes a
 * proximal regularization term to mitigate client drift on non-IID data.
 * 
 * Server aggregation formula: w_global = Σ (n_k / N) * w_k
 * Client training objective:  min_w F_k(w) + (μ/2) * ||w - w^t||²
 * 
 * References:
 *   Li, T., et al. "Federated Optimization in Heterogeneous Networks." MLSys 2020.
 *   McMahan, B., et al. "Communication-efficient learning of deep networks." AISTATS 2017.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../utils/logger');
const blockchainService = require('./blockchainService');
const ipfsService = require('./ipfsService');

class AggregationService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Check if aggregation is ready (enough submissions)
   */
  async isAggregationReady() {
    const status = await blockchainService.getNetworkStatus();
    return {
      ready: status.readyForAggregation,
      pendingUpdates: status.pendingUpdates,
      requiredSubmissions: status.requiredSubmissions,
      currentRound: status.currentRound
    };
  }

  /**
   * Get all pending updates with their details
   */
  async getPendingUpdatesDetails() {
    const updates = await blockchainService.getPendingUpdates();
    
    // Enrich with hospital info
    const enrichedUpdates = await Promise.all(updates.map(async (update) => {
      try {
        const hospitalInfo = await blockchainService.getHospitalInfo(update.hospital);
        return {
          ...update,
          hospitalName: hospitalInfo.name,
          hospitalRegion: hospitalInfo.region
        };
      } catch {
        return update;
      }
    }));

    return enrichedUpdates;
  }

  /**
   * Download model weights from all pending updates
   */
  async downloadPendingModels() {
    const updates = await blockchainService.getPendingUpdates();
    const downloadedModels = [];

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      const outputPath = path.join(this.tempDir, `model_update_${i}_${update.hospital.slice(0, 8)}.pth`);
      
      try {
        logger.info(`Downloading model from ${update.hospital}: ${update.modelWeightsCID}`);
        await ipfsService.downloadFile(update.modelWeightsCID, outputPath);
        
        downloadedModels.push({
          path: outputPath,
          hospital: update.hospital,
          samples: update.dataSampleCount,
          accuracy: update.accuracy,
          auc: update.auc,
          sensitivity: update.sensitivity,
          specificity: update.specificity,
          cid: update.modelWeightsCID
        });
      } catch (error) {
        logger.error(`Failed to download model from ${update.hospital}: ${error.message}`);
      }
    }

    return downloadedModels;
  }

  /**
   * Perform FedProx server-side aggregation using Python script.
   * The server-side aggregation is a weighted average (same math as FedAvg).
   * The FedProx innovation is on the client side (proximal term in local training).
   * Returns path to aggregated model.
   */
  async performFedProxAggregation(models) {
    return new Promise((resolve, reject) => {
      const aggregatedPath = path.join(this.tempDir, `aggregated_model_${Date.now()}.pth`);
      
      // Prepare input data for Python script
      const inputData = {
        models: models.map(m => ({
          path: m.path,
          samples: m.samples,
          hospital: m.hospital
        })),
        output_path: aggregatedPath
      };

      const inputPath = path.join(this.tempDir, 'fedprox_input.json');
      fs.writeFileSync(inputPath, JSON.stringify(inputData, null, 2));

      // Run Python FedProx server-side aggregation script
      // Tries fedprox_aggregation.py first, falls back to fedavg.py for backwards compatibility
      let pythonScript = path.join(__dirname, '../python/fedprox_aggregation.py');
      
      if (!fs.existsSync(pythonScript)) {
        // Fallback to legacy fedavg.py (same server-side math)
        pythonScript = path.join(__dirname, '../python/fedavg.py');
        if (!fs.existsSync(pythonScript)) {
          this.createFedProxScript(pythonScript);
        }
      }

      const python = spawn('python3', [pythonScript, inputPath]);
      
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
        logger.debug(`FedProx aggregation stdout: ${data}`);
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.warn(`FedProx aggregation stderr: ${data}`);
      });

      python.on('close', (code) => {
        if (code === 0 && fs.existsSync(aggregatedPath)) {
          logger.info(`FedProx server-side aggregation complete: ${aggregatedPath}`);
          resolve({
            path: aggregatedPath,
            modelCount: models.length,
            totalSamples: models.reduce((sum, m) => sum + m.samples, 0)
          });
        } else {
          reject(new Error(`FedProx aggregation failed with code ${code}: ${stderr}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to run FedProx aggregation: ${error.message}`));
      });
    });
  }

  /**
   * Create FedProx aggregation Python script if it doesn't exist.
   * Server-side aggregation is identical to FedAvg (weighted average).
   */
  createFedProxScript(scriptPath) {
    const scriptDir = path.dirname(scriptPath);
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }

    const script = `#!/usr/bin/env python3
"""
FedProx Server-Side Aggregation
Aggregates model weights from multiple hospitals using weighted average.
Server-side aggregation is identical to FedAvg; the FedProx innovation
is the proximal term applied during client-side (hospital) training.
"""

import sys
import json
import torch
from collections import OrderedDict

def fedprox_aggregate(models_info):
    """
    Perform FedProx server-side aggregation (weighted averaging) on model weights.
    
    Args:
        models_info: List of dicts with 'path' (model file) and 'samples' (weight)
    
    Returns:
        Aggregated state dict
    """
    total_samples = sum(m['samples'] for m in models_info)
    
    # Load all models
    state_dicts = []
    weights = []
    
    for model_info in models_info:
        try:
            state_dict = torch.load(model_info['path'], map_location='cpu')
            # Handle different save formats
            if 'model_state_dict' in state_dict:
                state_dict = state_dict['model_state_dict']
            elif 'state_dict' in state_dict:
                state_dict = state_dict['state_dict']
            
            state_dicts.append(state_dict)
            weights.append(model_info['samples'] / total_samples)
            print(f"Loaded model from {model_info.get('hospital', 'unknown')}: {model_info['samples']} samples (weight: {weights[-1]:.4f})")
        except Exception as e:
            print(f"Error loading {model_info['path']}: {e}", file=sys.stderr)
            continue
    
    if len(state_dicts) == 0:
        raise ValueError("No models loaded successfully")
    
    # Perform weighted averaging
    aggregated = OrderedDict()
    
    for key in state_dicts[0].keys():
        # Stack tensors and compute weighted average
        stacked = torch.stack([sd[key].float() for sd in state_dicts])
        weight_tensor = torch.tensor(weights).view(-1, *([1] * (stacked.dim() - 1)))
        aggregated[key] = (stacked * weight_tensor).sum(dim=0)
    
    return aggregated

def main():
    if len(sys.argv) < 2:
        print("Usage: python fedavg.py <input_json>", file=sys.stderr)
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    with open(input_path, 'r') as f:
        config = json.load(f)
    
    models = config['models']
    output_path = config['output_path']
    
    print(f"\\nFedProx Server-Side Aggregation")
    print(f"================================")
    print(f"Models to aggregate: {len(models)}")
    print(f"Output path: {output_path}")
    print()
    
    # Perform aggregation
    aggregated_state = fedprox_aggregate(models)
    
    # Save aggregated model
    torch.save({
        'model_state_dict': aggregated_state,
        'aggregation_info': {
            'algorithm': 'FedProx',
            'server_aggregation': 'weighted_average',
            'model_count': len(models),
            'total_samples': sum(m['samples'] for m in models),
            'hospitals': [m.get('hospital', 'unknown') for m in models]
        }
    }, output_path)
    
    print(f"\\nAggregated model saved to: {output_path}")
    print("FedProx aggregation complete!")

if __name__ == '__main__':
    main()
`;

    fs.writeFileSync(scriptPath, script);
    fs.chmodSync(scriptPath, '755');
    logger.info(`Created FedProx aggregation script: ${scriptPath}`);
  }

  /**
   * Full aggregation workflow
   */
  async runAggregation() {
    logger.info('Starting aggregation workflow...');

    // 1. Check if ready
    const readyStatus = await this.isAggregationReady();
    if (!readyStatus.ready) {
      return {
        success: false,
        error: `Not ready for aggregation. Have ${readyStatus.pendingUpdates}/${readyStatus.requiredSubmissions} submissions.`
      };
    }

    // 2. Get pending updates
    const updates = await this.getPendingUpdatesDetails();
    logger.info(`Found ${updates.length} pending updates`);

    // 3. Download models
    const downloadedModels = await this.downloadPendingModels();
    if (downloadedModels.length < readyStatus.requiredSubmissions) {
      return {
        success: false,
        error: `Only downloaded ${downloadedModels.length}/${readyStatus.requiredSubmissions} models`
      };
    }

    // 4. Perform FedProx server-side aggregation (weighted average)
    const aggregationResult = await this.performFedProxAggregation(downloadedModels);

    // 5. Upload aggregated model to IPFS
    const uploadResult = await ipfsService.uploadFile(aggregationResult.path, {
      name: `global_model_round_${readyStatus.currentRound + 1}.pth`,
      type: 'aggregated_model',
      keyvalues: {
        round: readyStatus.currentRound + 1,
        contributors: downloadedModels.length,
        totalSamples: aggregationResult.totalSamples
      }
    });

    // 6. Calculate model hash
    const modelHash = ipfsService.calculateFileHash(aggregationResult.path);

    // 7. Calculate aggregate metrics (weighted average by sample count)
    const totalSamples = aggregationResult.totalSamples;
    const weightedAccuracy = downloadedModels.reduce((sum, m) => 
      sum + (m.accuracy * m.samples / totalSamples), 0);
    const weightedAUC = downloadedModels.reduce((sum, m) => 
      sum + ((m.auc || 0) * m.samples / totalSamples), 0);
    const weightedSensitivity = downloadedModels.reduce((sum, m) => 
      sum + ((m.sensitivity || 0) * m.samples / totalSamples), 0);
    const weightedSpecificity = downloadedModels.reduce((sum, m) => 
      sum + ((m.specificity || 0) * m.samples / totalSamples), 0);

    return {
      success: true,
      aggregatedModel: {
        cid: uploadResult.cid,
        hash: modelHash,
        url: uploadResult.url,
        size: uploadResult.size
      },
      metrics: {
        round: readyStatus.currentRound + 1,
        contributors: downloadedModels.length,
        totalSamples,
        weightedAccuracy,
        weightedAUC,
        weightedSensitivity,
        weightedSpecificity,
        hospitals: downloadedModels.map(m => m.hospital)
      },
      // For publishing to blockchain
      // publishGlobalModel expects: accuracy as percentage (e.g. 95.5),
      // aucScore/sensitivity/specificity as decimals (e.g. 0.87)
      publishData: {
        modelCID: uploadResult.cid,
        modelHash,
        accuracy: weightedAccuracy,
        aucScore: weightedAUC,
        sensitivity: weightedSensitivity,
        specificity: weightedSpecificity
      }
    };
  }

  /**
   * Publish aggregated model to blockchain
   */
  async publishAggregatedModel(aggregationResult, metrics = {}) {
    const { modelCID, modelHash, accuracy, aucScore, sensitivity, specificity } = 
      aggregationResult.publishData;

    // publishGlobalModel expects: accuracy as percentage (e.g. 95.5),
    // aucScore/sensitivity/specificity as decimals (e.g. 0.87)
    return await blockchainService.publishGlobalModel(
      modelCID,
      modelHash,
      metrics.accuracy || accuracy,
      metrics.aucScore || aucScore,
      metrics.sensitivity || sensitivity,
      metrics.specificity || specificity
    );
  }

  /**
   * Clean up temporary files
   */
  cleanup() {
    try {
      const files = fs.readdirSync(this.tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.tempDir, file));
      }
      logger.info('Cleaned up temporary files');
    } catch (error) {
      logger.warn(`Cleanup failed: ${error.message}`);
    }
  }
}

module.exports = new AggregationService();
