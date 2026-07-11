# FedProx Aggregation Research — Complete Output

**Upgrade:** FedAvg → FedProx for Federated Learning Aggregation  
**System:** Blockchain-based Privacy-Preserving Breast Cancer Classification  
**Purpose:** Journal Publication Support

---

## 📓 Main Deliverable

### [`FedProx_Research_Complete.ipynb`](FedProx_Research_Complete.ipynb)

A single, self-contained Jupyter notebook (~2.9 MB) containing:

| Section | Contents |
|---------|----------|
| 1. Background | Why FedProx over FedAvg; method comparison table |
| 2. Algorithm | Mathematical formulations with equations |
| 3. Architecture | System diagram (hospitals → IPFS → blockchain) |
| 4. Experiment Setup | Full configuration table |
| 5. Code | Complete experiment + plot generator scripts |
| 6. Results | Per-round tables, statistics, key observations |
| 7. Figures | All 7 publication-quality plots **embedded** |
| 8. Paper Sections | Ready-to-paste methodology/experiments/discussion text |
| 9. LaTeX Table | Copy-paste comparison table |
| 10. References | Formatted citations + full BibTeX |

```bash
jupyter notebook FedProx_Research_Complete.ipynb
```

---

## 📁 Supporting Files

```
fedprox-result/
├── FedProx_Research_Complete.ipynb  ← MAIN DELIVERABLE (open this)
├── build_notebook.py                ← Regenerates the notebook from raw data
├── data/
│   └── experiment_results.json      ← Raw results (15 rounds × 6 configs)
├── experiments/
│   ├── fedprox_experiment.py        ← FL simulation (reproducible)
│   └── generate_plots.py            ← Plot generator
├── figures/                         ← 7 plots @ 300 DPI
│   ├── convergence_accuracy.png
│   ├── convergence_auc.png
│   ├── convergence_loss.png
│   ├── final_metrics_comparison.png
│   ├── mu_sensitivity.png
│   ├── hospital_performance.png
│   └── proximal_loss_analysis.png
├── tables/
│   └── comparison_table.tex         ← LaTeX table
├── references/
│   └── references.bib               ← 9 BibTeX entries
└── paper_sections/
    └── methodology.md               ← Suggested paper text
```

---

## 🔑 Key Finding

> **FedProx (μ=0.1)** achieves the highest peak accuracy (70%) and most stable AUC-ROC (~0.74–0.75) throughout training, compared to FedAvg which shows larger round-to-round oscillations due to client drift from non-IID hospital data distributions.

---

## ♻️ Reproduce Everything

```bash
# Re-run experiment
python3 experiments/fedprox_experiment.py

# Regenerate figures
python3 experiments/generate_plots.py

# Rebuild notebook
python3 build_notebook.py
```
