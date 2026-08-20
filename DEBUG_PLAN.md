# FedProx Debugging & Experiment Plan

## 1. Issue Summary
The federated learning pipeline currently exhibits a performance degradation where the global aggregated model (~63% accuracy) performs worse than standalone local models (71-79%). Furthermore, a $\mu$ sweep for FedProx yields flat results, indicating that the proximal regularization term is not meaningfully affecting the training trajectory, and the global model is stuck in a degenerate state (predicting the majority class).

## 2. Root Cause Hypotheses
- **BatchNorm Statistics Aggregation**: `FedAvg` and `FedProx` server-side aggregation in `fedprox_aggregation.py` is averaging all `state_dict` keys. BatchNorm layers (`running_mean`, `running_var`, `num_batches_tracked`) should not always be naively averaged, as this can destroy the learned normalization statistics, especially in non-IID settings.
- **Local Epochs & Learning Rate**: The current setting of `local_epochs=3` and `lr=0.001` might be insufficient for local convergence, or conversely, might cause too much client drift before aggregation.
- **Degenerate Classifier**: The model is defaulting to high sensitivity (95.2%) and low specificity (~30%), meaning it is simply predicting "malignant" for most samples. This points to severe class imbalance handling issues or broken weight aggregation.

## 3. Auditable Experiment Plan

### Phase A: Small-Scale Sanity Check
1. **Reduce Scope**: Run the simulation with 2 hospital sites instead of 3.
2. **Increase Local Epochs**: Test `local_epochs=5` and `local_epochs=10` to ensure local models are actually learning before aggregation.
3. **Monitor Specificity**: If specificity remains pinned at ~30%, the bug is definitively in the aggregation loop, not the hyperparameters.

### Phase B: Fix Aggregation Logic
1. **Exclude `num_batches_tracked`**: Ensure `num_batches_tracked` is not averaged as a float.
2. **BatchNorm Handling**: Implement a flag to either average `running_mean` and `running_var` correctly or freeze them during local training (a common FL CV strategy).
3. **Verify Proximal Term**: Check the gradient calculation in `fedprox_train.py` to ensure `mu/2 * ||w - w_global||^2` is correctly added to the loss and backpropagated.

### Phase C: Re-run Full Simulation
1. Run the full 3-site simulation with the fixed aggregation script.
2. Perform the $\mu$ sweep again. Expect to see accuracy and specificity shift as $\mu$ increases.
3. Validate that Federated Performance $\ge$ Worst Standalone Site, and approaches Centralized Performance.
