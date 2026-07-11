#!/usr/bin/env python3
"""
Federated Averaging (FedAvg) Implementation
Aggregates model weights from multiple hospitals using weighted average.

Model Architecture: EfficientNet-B0 + Coordinate Attention
Task: Binary Classification (Benign vs Malignant)
Framework: PyTorch
"""

import sys
import json
import torch
from collections import OrderedDict


def fedavg(models_info):
    """
    Perform Federated Averaging on model weights.
    
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
            state_dict = torch.load(
                model_info['path'], 
                map_location='cpu',
                weights_only=False
            )
            # Handle different save formats
            if 'model_state_dict' in state_dict:
                state_dict = state_dict['model_state_dict']
            elif 'state_dict' in state_dict:
                state_dict = state_dict['state_dict']
            
            state_dicts.append(state_dict)
            weights.append(model_info['samples'] / total_samples)
            print(f"Loaded model from {model_info.get('hospital', 'unknown')}: "
                  f"{model_info['samples']} samples (weight: {weights[-1]:.4f})")
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
    
    print(f"\nFederated Averaging")
    print(f"==================")
    print(f"Models to aggregate: {len(models)}")
    print(f"Output path: {output_path}")
    print()
    
    # Perform aggregation
    aggregated_state = fedavg(models)
    
    # Save aggregated model
    torch.save({
        'model_state_dict': aggregated_state,
        'aggregation_info': {
            'model_count': len(models),
            'total_samples': sum(m['samples'] for m in models),
            'hospitals': [m.get('hospital', 'unknown') for m in models]
        }
    }, output_path)
    
    print(f"\nAggregated model saved to: {output_path}")
    print("Aggregation complete!")


if __name__ == '__main__':
    main()
