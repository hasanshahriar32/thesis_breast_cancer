## Cover

# Breast Cancer Federated Learning Thesis

## Structure, evidence base, and FedProx debugging plan

Hasan Shahriar · Research progress review

## Slide 1

# The thesis addresses a real clinical data-sharing constraint

- Histopathology classification benefits from multi-site data, but raw medical images cannot be casually centralized.
- Federated learning keeps training data at participating institutions while combining locally computed updates.
- The thesis combines privacy-preserving collaboration, non-IID hospital data, and breast-cancer image classification.

Source: McMahan et al. (2017); Rehman et al. (2023).

## Slide 2

# A five-chapter structure separates claims from evidence

- **Introduction:** clinical context, privacy motivation, objectives, and research questions.
- **Literature review:** centralized deep learning, medical-imaging FL, non-IID challenges, FedAvg, FedProx, and blockchain governance.
- **Methodology:** datasets, preprocessing, EfficientNet-B0 plus Coordinate Attention, hospital partitioning, FedAvg/FedProx, and evaluation protocol.
- **Results and discussion:** only validated experiments, error analysis, limitations, and reproducibility evidence.

## Slide 3

# Evidence is organized chronologically in Notion

- **Source register:** datasets, papers, repository paths, drafts, and presentations.
- **Experiment log:** seed, partitions, hyperparameters, round-level metrics, model artifacts, and outcome status.
- **Debugging journal:** hypothesis, code change, unit test, experiment result, decision, and next action.
- **Thesis outline:** chapter-ready prose is kept separate from preliminary or invalidated results.

## Slide 4

# The current FedProx result is not thesis-ready

- Global accuracy is approximately 63–64%, below standalone site baselines of approximately 71–79%.
- Sensitivity remains near 95.2% while specificity is near 30–33%, consistent with a classifier biased toward the malignant class.
- The reported μ sweep from 0 to 0.5 is nearly flat, so it does not demonstrate a meaningful FedProx effect.
- The abstract and conclusions must not claim FedProx superiority until this behavior is resolved.

## Slide 5

# Code review identifies the key aggregation risk

- `fedprox_aggregation.py` aggregates every `state_dict` tensor using weighted float averaging.
- This is unsafe for integer buffers such as `num_batches_tracked` and needs explicit BatchNorm-buffer handling in the production vision model.
- The separate simulation script uses a three-layer MLP without BatchNorm; its result cannot validate the EfficientNet-based production pipeline.
- FedProx and FedAvg use the same server aggregation; FedProx’s distinction must be verified in client-side proximal-loss training.

## Slide 6

# Local epochs require a controlled sensitivity study

- Current configuration cited in the review uses `local_epochs = 3` and learning rate `0.001`.
- Run two-site tests at 1, 3, 5, and 10 local epochs with fixed split, seed, optimizer, and class-weighting policy.
- Record local loss, local accuracy, global loss, sensitivity, specificity, AUROC, F1, and confusion matrices every round.
- Diagnose before scaling: a specificity plateau across settings points to pipeline or evaluation failure rather than tuning.

## Slide 7

# The debugging sequence restores a defensible baseline

- **A — Reproducibility:** seed all RNGs; save exact configurations, dataset indices, and per-round checkpoints.
- **B — Aggregation:** validate weighted averages, preserve integer buffers, and decide/document a BatchNorm strategy.
- **C — Evaluation:** verify class-label mapping, confusion-matrix orientation, test-set independence, and threshold use.
- **D — Sanity checks:** compare centralized, standalone, one-client FL, and two-client FL before full three-client FedAvg/FedProx.

## Slide 8

# FedProx is a hypothesis, not a guaranteed improvement

- FedAvg iteratively aggregates local updates while training data remain decentralized.
- FedProx adds a proximal term intended to control divergence from the received global model under systems and statistical heterogeneity.
- The literature reports more stable convergence in some heterogeneous settings; it does not justify claiming universal superiority.
- The thesis should report the chosen μ, its sensitivity analysis, and the observed trade-off without overclaiming.

Sources: McMahan et al. (2017); Li et al. (2020).

## Slide 9

# Success criteria determine when results enter the thesis

- Every aggregation test passes, including model-key, shape, dtype, and sample-weight checks.
- A one-client FL round equals direct local training from the same initialization.
- Two-client/global models no longer show persistent majority-class behavior.
- FedAvg and FedProx are compared on the same partitions; performance, calibration, and site-level variation are reported with uncertainty.

## Slide 10

# Immediate next actions

- Build aggregation unit tests and a manifest-based experiment runner.
- Audit label encoding, class balance, and evaluation thresholding.
- Complete the 1/3/5/10 local-epoch two-site matrix before any μ sweep.
- Update the Notion log and thesis results chapter only with re-run, reproducible evidence.

## Closing

# Protect the thesis by protecting the evidence

## Validate the pipeline first; write the claim second.

## References

1. McMahan, B. et al. (2017). Communication-Efficient Learning of Deep Networks from Decentralized Data. AISTATS 2017. https://proceedings.mlr.press/v54/mcmahan17a.html
2. Li, T. et al. (2020). Federated Optimization in Heterogeneous Networks. MLSys 2020. https://proceedings.mlsys.org/paper/2020/hash/1f5fe83998a09396ebe6477d9475ba0c-Abstract.html
3. Rehman, M. H. U. et al. (2023). Federated learning for medical imaging radiology. British Journal of Radiology, 96(1150), 20220890. https://pmc.ncbi.nlm.nih.gov/articles/PMC10546441/
4. Uploaded project literature: cited_journal.pdf; BreastcancerLiteratureReview(1).docx; SOTA.docx; review_of_Fedprox.docx.

