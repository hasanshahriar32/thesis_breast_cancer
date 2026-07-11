# Suggested Paper Sections: FedProx Aggregation

Use and adapt these sections for your journal paper. LaTeX formatting is included.

---

## III-B. Federated Aggregation Strategy

In our initial implementation, we employed Federated Averaging (FedAvg) \cite{mcmahan2017fedavg} for model aggregation, where the global model is computed as a weighted average of local model parameters proportional to each hospital's training sample count. While FedAvg is the foundational algorithm for federated learning, it is known to suffer from "client drift" in heterogeneous data environments \cite{li2020fedprox}, where local models trained on non-identically distributed (non-IID) data diverge significantly during local training before being averaged. This divergence can lead to slower convergence and suboptimal global model performance.

To address this limitation, we adopt FedProx \cite{li2020fedprox}, which introduces a proximal regularization term to the local objective function at each participating hospital. The modified local optimization objective for hospital $k$ at communication round $t$ is:

$$\min_{w} F_k(w) + \frac{\mu}{2} \| w - w^t \|^2$$

where $F_k(w)$ is the local empirical loss (cross-entropy for binary classification), $w^t$ represents the global model parameters received from the admin server at the start of round $t$, and $\mu \geq 0$ is the proximal hyperparameter that controls the strength of the regularization. When $\mu = 0$, FedProx reduces to standard FedAvg, providing a natural baseline for comparison.

The proximal term $\frac{\mu}{2} \| w - w^t \|^2$ constrains local model updates to remain within a bounded distance of the global model, effectively mitigating the impact of data heterogeneity across hospitals. This is particularly relevant in our setting, where the three participating hospitals (Boston Medical Center, London General Hospital, and Tokyo University Hospital) exhibit inherent variations in disease prevalence, imaging equipment, staining protocols, and patient demographics — all contributing to non-IID data distributions.

The server-side aggregation remains a weighted average of model parameters:

$$w^{t+1} = \sum_{k=1}^{K} \frac{n_k}{N} w_k^{t+1}$$

where $n_k$ is the number of training samples at hospital $k$, $N = \sum_{k=1}^{K} n_k$ is the total number of samples across all hospitals, and $w_k^{t+1}$ are the locally updated parameters. This aggregation is performed off-chain by the oracle service and the resulting global model is published to the blockchain via the smart contract, maintaining full transparency and auditability while benefiting from the improved local training procedure.

---

## III-C. FedProx Implementation in the System Architecture

A key advantage of FedProx for our blockchain-based architecture is that the server-side aggregation is mathematically identical to FedAvg. This means our existing infrastructure — including the Ethereum smart contract for coordination, IPFS for model weight storage, and the oracle service for aggregation — requires no modification to support FedProx. The innovation is entirely on the client side (hospital local training), where the proximal term is added to the loss function before backpropagation.

The implementation flow is:
1. Each hospital downloads the current global model weights from IPFS
2. Local training is performed with the modified loss function incorporating the proximal term
3. Updated local weights are uploaded to IPFS and registered on the blockchain
4. The oracle service performs weighted averaging (identical to FedAvg) and publishes the new global model

---

## IV-D. Aggregation Strategy Comparison

To evaluate the effectiveness of FedProx over FedAvg, we conduct experiments across 15 communication rounds with 5 local training epochs per round. We test FedProx with proximal parameters $\mu \in \{0.001, 0.01, 0.1, 0.5, 1.0\}$ and compare against FedAvg ($\mu = 0$) as the baseline. The non-IID data distribution across hospitals is characterized by the following class ratios:

- **Boston Medical Center**: 25% benign / 75% malignant (cancer research specialty)
- **London General Hospital**: 50% benign / 50% malignant (balanced general population)
- **Tokyo University Hospital**: 75% benign / 25% malignant (screening center)


[INSERT Table from tables/comparison_table.tex HERE]

[INSERT Figure convergence_accuracy.png HERE with caption: "Accuracy convergence comparison between FedAvg and FedProx with different proximal parameters $\mu$ across 15 communication rounds on non-IID histopathology data."]

[INSERT Figure mu_sensitivity.png HERE with caption: "Effect of the proximal parameter $\mu$ on classification performance metrics. Horizontal dashed lines indicate FedAvg baseline performance."]

---

## V-B. Discussion: Aggregation Strategy

Our experimental results demonstrate that FedProx provides more stable convergence compared to FedAvg in the non-IID setting inherent to our multi-hospital breast cancer classification task. While FedAvg is susceptible to accuracy oscillations caused by client drift — where locally trained models diverge due to heterogeneous data distributions — FedProx's proximal regularization effectively constrains this divergence.

The sensitivity analysis of the proximal parameter $\mu$ reveals that moderate values ($\mu = 0.01$ to $\mu = 0.1$) provide the best balance between regularization strength and learning flexibility. Very small values ($\mu = 0.001$) provide insufficient regularization and behave similarly to FedAvg, while large values ($\mu \geq 0.5$) over-constrain local updates and can slow convergence.

From a systems perspective, the transition from FedAvg to FedProx is particularly well-suited for our blockchain-based architecture because the server-side aggregation remains unchanged. The smart contract, IPFS storage, and oracle service operate identically under both algorithms — only the hospital-side training procedure is modified. This minimizes architectural risk while providing measurable improvements in convergence stability, a critical consideration for clinical deployment where consistent model performance is paramount.

---

## LaTeX Versions

### Proximal Term Equation
```latex
\min_{w} F_k(w) + \frac{\mu}{2} \| w - w^t \|^2
```

### Aggregation Equation
```latex
w^{t+1} = \sum_{k=1}^{K} \frac{n_k}{N} w_k^{t+1}
```

### Total Local Loss
```latex
\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{CE}}(w) + \frac{\mu}{2} \| w - w^t \|^2
```
