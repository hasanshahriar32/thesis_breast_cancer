#!/usr/bin/env python3
"""
FedProx Aggregation Implementation
Server-side weighted averaging for the FedProx federated learning algorithm.

In FedProx (Li et al., "Federated Optimization in Heterogeneous Networks",
MLSys 2020), the client-side training includes a proximal regularization term
that constrains local updates to stay close to the global model:

    min_w F_k(w) + (mu/2) * ||w - w^t||^2

The SERVER-SIDE aggregation is identical to FedAvg — a weighted average of
model parameters proportional to each hospital's training sample count:

    w_global = Σ (n_k / n) * w_k

The key innovation of FedProx over FedAvg is entirely on the client side
(hospital local training), where the proximal term mitigates client drift
caused by non-IID data distributions across hospitals.

Model Architecture: EfficientNet-B0 + Coordinate Attention
Task: Binary Classification (Benign vs Malignant)
Framework: PyTorch

References:
    - Li, T., Sahu, A. K., Zaheer, M., Sanjabi, M., Talwalkar, A., & Smith, V.
      (2020). Federated Optimization in Heterogeneous Networks.
      Proceedings of Machine Learning and Systems (MLSys), 2, 429-450.
    - McMahan, B., Moore, E., Ramage, D., Hampson, S., & y Arcas, B. A.
      (2017). Communication-efficient learning of deep networks from
      decentralized data. AISTATS, 1273-1282.
"""

import sys
import json
import torch
from collections import OrderedDict


def fedprox_aggregate(models_info):
    """
    Perform FedProx server-side aggregation (weighted averaging) on model weights.

    This is the server-side component of FedProx. The aggregation formula is
    identical to FedAvg — the differentiation comes from the client-side
    proximal term applied during local training at each hospital.

    The weighted average is computed as:
        w_global = Σ (n_k / N) * w_k
    where:
        n_k = number of training samples at hospital k
        N   = total samples across all hospitals
        w_k = model weights from hospital k (trained with proximal term)

    Args:
        models_info: List of dicts with:
            - 'path' (str): Path to the model weights file (.pth)
            - 'samples' (int): Number of training samples at this hospital
            - 'hospital' (str, optional): Hospital identifier

    Returns:
        OrderedDict: Aggregated state dict (global model weights)
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

    # Perform weighted averaging (server-side aggregation)
    # Note: In FedProx, each hospital's local weights were trained with a
    # proximal term (mu/2 * ||w - w_global||^2) that constrains drift.
    # The server simply averages these better-behaved updates.
    aggregated = OrderedDict()

    for key in state_dicts[0].keys():
        # Stack tensors and compute weighted average
        stacked = torch.stack([sd[key].float() for sd in state_dicts])
        weight_tensor = torch.tensor(weights).view(-1, *([1] * (stacked.dim() - 1)))
        aggregated[key] = (stacked * weight_tensor).sum(dim=0)

    return aggregated


def main():
    if len(sys.argv) < 2:
        print("Usage: python fedprox_aggregation.py <input_json>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]

    with open(input_path, 'r') as f:
        config = json.load(f)

    models = config['models']
    output_path = config['output_path']

    print(f"\nFedProx Server-Side Aggregation")
    print(f"================================")
    print(f"Algorithm: FedProx (Li et al., MLSys 2020)")
    print(f"Server aggregation: Weighted average (same as FedAvg)")
    print(f"Client training: Proximal regularization (mu/2 * ||w - w_global||^2)")
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
            'hospitals': [m.get('hospital', 'unknown') for m in models],
            'reference': 'Li et al., Federated Optimization in Heterogeneous Networks, MLSys 2020'
        }
    }, output_path)

    print(f"\nAggregated model saved to: {output_path}")
    print("FedProx aggregation complete!")


if __name__ == '__main__':
    main()
