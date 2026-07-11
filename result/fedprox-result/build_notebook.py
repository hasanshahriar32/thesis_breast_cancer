#!/usr/bin/env python3
"""Build the comprehensive FedProx research notebook."""

import json
import base64
import os

def img_b64(path):
    try:
        with open(path, 'rb') as f:
            return base64.b64encode(f.read()).decode()
    except:
        return ""

def md(src):
    return {"cell_type":"markdown","metadata":{},"source":src if isinstance(src,list) else [src]}

def code(src_lines, outputs=None):
    """Create a runnable code cell. src_lines is a list of lines WITHOUT newlines."""
    # Re-add newlines to each line except the last
    lines_with_nl = []
    for i, line in enumerate(src_lines):
        lines_with_nl.append(line + ("\n" if i < len(src_lines) - 1 else ""))
    return {
        "cell_type":"code","execution_count":None,"metadata":{},
        "outputs": outputs or [],
        "source": lines_with_nl
    }

def code_display(src_str, lang="python"):
    """Display source code as a markdown fenced block (not runnable)."""
    lines = [f"```{lang}\n"] + [l + "\n" for l in src_str.split("\n")] + ["```\n"]
    return md(lines)

def img_cell(path, caption=""):
    b = img_b64(path)
    if not b:
        return md(f"*[Figure not found: {path}]*")
    return {
        "cell_type":"markdown","metadata":{},
        "source":[
            f"<img src='data:image/png;base64,{b}' style='max-width:100%'/>\n",
            f"<p><em>{caption}</em></p>\n" if caption else ""
        ]
    }

BASE = "/home/hs32/Desktop/thesis/result/fedprox-result"
FIGS = BASE + "/figures"

# Load results
with open(BASE + "/data/experiment_results.json") as f:
    results = json.load(f)

with open(BASE + "/references/references.bib") as f:
    bib = f.read()

with open(BASE + "/paper_sections/methodology.md") as f:
    paper = f.read()

with open(BASE + "/tables/comparison_table.tex") as f:
    tex = f.read()

exp_src = open(BASE + "/experiments/fedprox_experiment.py").read()
plot_src = open(BASE + "/experiments/generate_plots.py").read()

cells = []

# ── TITLE ──
cells.append(md([
    "# FedProx vs FedAvg: Federated Learning Aggregation Research\n",
    "## Breast Cancer Histopathology Classification — Journal Publication\n\n",
    "---\n",
    "**Model:** EfficientNet-B0 + Coordinate Attention (~5.9M params)  \n",
    "**Task:** Binary Classification (Benign vs Malignant)  \n",
    "**Hospitals:** 3 nodes (Boston, London, Tokyo) — Non-IID data  \n",
    "**Infrastructure:** Ethereum Smart Contract + IPFS  \n",
    "**Key Upgrade:** FedAvg → FedProx (Li et al., MLSys 2020)\n\n",
    "---\n",
    "### Table of Contents\n",
    "1. [Background & Motivation](#background)\n",
    "2. [Algorithm: FedProx vs FedAvg](#algorithm)\n",
    "3. [System Architecture](#architecture)\n",
    "4. [Experiment Setup](#setup)\n",
    "5. [FL Simulation Code](#code)\n",
    "6. [Results & Analysis](#results)\n",
    "7. [Figures](#figures)\n",
    "8. [Paper Sections (Ready to Use)](#paper)\n",
    "9. [LaTeX Table](#table)\n",
    "10. [References & BibTeX](#references)\n",
]))

# ── 1. BACKGROUND ──
cells.append(md([
    "<a id='background'></a>\n",
    "## 1. Background & Motivation\n\n",
    "### Why Replace FedAvg?\n\n",
    "FedAvg (McMahan et al., 2017) is the foundational federated learning algorithm. However, it suffers from a known issue called **client drift** in heterogeneous (non-IID) data settings:\n\n",
    "- Each hospital's local data has a **different class distribution** (e.g., cancer specialty vs. screening center)\n",
    "- During local training, each hospital's model drifts toward its own local optimum\n",
    "- Simple averaging of drifted models produces a **suboptimal global model**\n\n",
    "### Hospital Data Distribution in This System\n\n",
    "| Hospital | Role | Benign % | Malignant % |\n",
    "|----------|------|----------|-------------|\n",
    "| Boston Medical Center | Cancer Research | 25% | 75% |\n",
    "| London General Hospital | General Hospital | 50% | 50% |\n",
    "| Tokyo University Hospital | Screening Center | 75% | 25% |\n\n",
    "This extreme label skew (25% vs 75% malignant) creates significant non-IID conditions where **FedProx provides measurable stability improvements**.\n\n",
    "### Why FedProx?\n\n",
    "After evaluating 5 modern aggregation methods:\n\n",
    "| Method | Rationale | Selected? |\n",
    "|--------|-----------|----------|\n",
    "| FedProx | Client-side proximal term; server unchanged; no infra changes | ✅ **YES** |\n",
    "| SCAFFOLD | 2× communication overhead; incompatible with IPFS | ❌ |\n",
    "| FedNova | Minimal gain for 3-hospital setup | ❌ |\n",
    "| FedOpt | Stateful server optimizer conflicts with blockchain transparency | ❌ |\n",
    "| Personalized FL | Doesn't produce a single global model for deployment | ❌ |\n",
]))

# ── 2. ALGORITHM ──
cells.append(md([
    "<a id='algorithm'></a>\n",
    "## 2. Algorithm: FedProx vs FedAvg\n\n",
    "### FedAvg Local Objective (Standard)\n",
    "$$\\min_{w} F_k(w) = \\min_{w} \\mathcal{L}_{CE}(w; \\mathcal{D}_k)$$\n\n",
    "### FedProx Local Objective (Modified)\n",
    "$$\\min_{w} F_k(w) + \\frac{\\mu}{2} \\| w - w^t \\|^2$$\n\n",
    "where:\n",
    "- $F_k(w)$ = cross-entropy loss at hospital $k$\n",
    "- $w^t$ = global model weights received at round $t$\n",
    "- $\\mu \\geq 0$ = proximal hyperparameter (0 → reduces to FedAvg)\n\n",
    "### Server-Side Aggregation (Identical for Both)\n",
    "$$w^{t+1} = \\sum_{k=1}^{K} \\frac{n_k}{N} w_k^{t+1}$$\n\n",
    "> **Key insight:** The server-side aggregation is mathematically identical in FedProx and FedAvg.\n",
    "> Only the hospital-side training loop changes — meaning **no blockchain or IPFS modifications are needed**.\n",
]))

# ── 3. ARCHITECTURE ──
cells.append(md([
    "<a id='architecture'></a>\n",
    "## 3. System Architecture\n\n",
    "```\n",
    "Hospital A (Boston)          Hospital B (London)          Hospital C (Tokyo)\n",
    "┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐\n",
    "│ Local Data       │         │ Local Data       │         │ Local Data       │\n",
    "│ (75% malignant)  │         │ (50/50 balanced) │         │ (75% benign)     │\n",
    "│                  │         │                  │         │                  │\n",
    "│ FedProx Training │         │ FedProx Training │         │ FedProx Training │\n",
    "│ L = CE + μ/2‖Δw‖²│         │ L = CE + μ/2‖Δw‖²│         │ L = CE + μ/2‖Δw‖²│\n",
    "│                  │         │                  │         │                  │\n",
    "│ IPFS Upload      │         │ IPFS Upload      │         │ IPFS Upload      │\n",
    "│ ETH Register     │         │ ETH Register     │         │ ETH Register     │\n",
    "└────────┬─────────┘         └────────┬─────────┘         └────────┬─────────┘\n",
    "         │                           │                           │\n",
    "         └──────────────┬────────────┘                           │\n",
    "                        │          ◄────────────────────────────┘\n",
    "               ┌────────▼─────────┐\n",
    "               │  Admin Oracle    │\n",
    "               │  FedProx Server  │\n",
    "               │  w = Σ(nk/N)wk  │  ← Weighted Average (unchanged)\n",
    "               │  IPFS Publish    │\n",
    "               │  ETH Commit      │\n",
    "               └──────────────────┘\n",
    "```\n",
]))

# ── 4. EXPERIMENT SETUP ──
cells.append(md([
    "<a id='setup'></a>\n",
    "## 4. Experiment Setup\n\n",
    "### Configuration\n\n",
    "| Parameter | Value |\n",
    "|-----------|-------|\n",
    "| Communication Rounds | 15 |\n",
    "| Local Epochs per Round | 5 |\n",
    "| Learning Rate | 0.01 (SGD + momentum=0.9) |\n",
    "| Batch Size | 32 |\n",
    "| μ Values Tested | {0, 0.001, 0.01, 0.1, 0.5, 1.0} |\n",
    "| Feature Dimensions | 1,280 (EfficientNet-B0 output) |\n",
    "| Training Samples | 1,150 total (450 + 380 + 320) |\n",
    "| Test Samples | 300 (balanced) |\n",
    "| Random Seed | 42 |\n\n",
    "### Non-IID Data Generation\n",
    "The experiment simulates realistic multi-hospital FL using:\n",
    "- **Label skew**: Different benign/malignant ratios per hospital\n",
    "- **Domain shift**: Per-hospital feature distribution offsets (scanner/population differences)\n",
    "- **Label noise**: 4–8% label noise per hospital (mimics annotation disagreements)\n",
    "- **Hard classification**: Only 40/1280 features are discriminative (noise >> signal)\n",
]))

# ── 5. CODE ──
cells.append(md(["<a id='code'></a>\n", "## 5. FL Simulation Code\n"]))
cells.append(md(["### 5.1 Experiment Script (`fedprox_experiment.py`)\n"]))
cells.append(code_display(exp_src))
cells.append(md(["### 5.2 Plot Generator (`generate_plots.py`)\n"]))
cells.append(code_display(plot_src))

# ── 6. RESULTS ──
cells.append(md(["<a id='results'></a>\n", "## 6. Results & Analysis\n"]))

# Runnable setup cell
cells.append({
    "cell_type":"code","execution_count":None,"metadata":{},"outputs":[],
    "source":[
        "import json, os, sys\n",
        "import pandas as pd\n",
        "import matplotlib.pyplot as plt\n",
        "import numpy as np\n",
        "\n",
        "# Load experiment results - works from any working directory\n",
        "_nb_dir = os.path.dirname(os.path.abspath('FedProx_Research_Complete.ipynb'))\n",
        "_data_path = os.path.join(_nb_dir, 'data', 'experiment_results.json')\n",
        "with open(_data_path) as f:\n",
        "    results = json.load(f)\n",
        "print(f'Loaded results for: {list(results.keys())}')\n",
    ]
})

# Runnable summary table cell
cells.append({
    "cell_type":"code","execution_count":None,"metadata":{},"outputs":[],
    "source":[
        "### 6.1 Final Performance Summary\n",
        "rows = []\n",
        "for k, v in results.items():\n",
        "    fm = v['final_metrics']\n",
        "    rows.append({'Method': v['algorithm'],\n",
        "                 'Accuracy (%)': round(fm['accuracy'], 2),\n",
        "                 'AUC-ROC': round(fm['auc_roc'], 4),\n",
        "                 'Sensitivity': round(fm['sensitivity'], 4),\n",
        "                 'Specificity': round(fm['specificity'], 4),\n",
        "                 'F1-Score': round(fm['f1_score'], 4),\n",
        "                 'Precision': round(fm['precision'], 4)})\n",
        "df = pd.DataFrame(rows).set_index('Method')\n",
        "display(df.style.highlight_max(axis=0, color='#d4edda').format(precision=4))\n",
    ]
})

# Runnable convergence plot cell
cells.append({
    "cell_type":"code","execution_count":None,"metadata":{},"outputs":[],
    "source":[
        "fig, axes = plt.subplots(1, 2, figsize=(14, 5))\n",
        "colors = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#e67e22','#1abc9c']\n",
        "for ax, metric, label in zip(axes, ['global_accuracy','global_auc'], ['Accuracy (%)','AUC-ROC']):\n",
        "    for (k, v), color in zip(results.items(), colors):\n",
        "        vals = [r[metric] for r in v['rounds']]\n",
        "        ls = '--' if k == 'FedAvg' else '-'\n",
        "        ax.plot(range(1, len(vals)+1), vals, ls=ls, color=color, marker='o', ms=4, label=v['algorithm'])\n",
        "    ax.set_xlabel('Communication Round'); ax.set_ylabel(label)\n",
        "    ax.set_title(f'FedProx vs FedAvg: {label} Convergence'); ax.legend(fontsize=8); ax.grid(alpha=0.3)\n",
        "plt.tight_layout(); plt.show()\n",
    ]
})

# Static markdown tables
rows = ["| Method | Accuracy (%) | AUC-ROC | Sensitivity | Specificity | F1-Score | Precision |\n",
        "|--------|-------------|---------|-------------|-------------|----------|-----------|\n"]
for k, v in results.items():
    fm = v['final_metrics']
    name = v['algorithm']
    rows.append(f"| {name} | {fm['accuracy']:.2f}% | {fm['auc_roc']:.4f} | "
                f"{fm['sensitivity']:.4f} | {fm['specificity']:.4f} | "
                f"{fm['f1_score']:.4f} | {fm['precision']:.4f} |\n")

cells.append(md(["### 6.1 Final Performance Summary\n\n"] + rows))

# Round-by-round accuracy table
cells.append(md(["### 6.2 Round-by-Round Accuracy\n"]))
rnd_rows = ["| Round | FedAvg | FedProx μ=0.001 | FedProx μ=0.01 | FedProx μ=0.1 | FedProx μ=0.5 | FedProx μ=1.0 |\n",
            "|-------|--------|-----------------|----------------|---------------|---------------|---------------|\n"]
keys = list(results.keys())
n_rounds = len(results[keys[0]]['rounds'])
for i in range(n_rounds):
    row = f"| {i+1} |"
    for k in keys:
        acc = results[k]['rounds'][i]['global_accuracy']
        row += f" {acc:.2f}% |"
    rnd_rows.append(row + "\n")
cells.append(md(rnd_rows))

# AUC table
cells.append(md(["### 6.3 Round-by-Round AUC-ROC\n"]))
auc_rows = ["| Round | FedAvg | FedProx μ=0.001 | FedProx μ=0.01 | FedProx μ=0.1 | FedProx μ=0.5 | FedProx μ=1.0 |\n",
            "|-------|--------|-----------------|----------------|---------------|---------------|---------------|\n"]
for i in range(n_rounds):
    row = f"| {i+1} |"
    for k in keys:
        auc = results[k]['rounds'][i]['global_auc']
        row += f" {auc:.4f} |"
    auc_rows.append(row + "\n")
cells.append(md(auc_rows))

# Analysis
fedavg = results['FedAvg']
accs_by_method = {k: [r['global_accuracy'] for r in v['rounds']] for k,v in results.items()}
cells.append(md([
    "### 6.4 Statistical Analysis\n\n",
    "#### Accuracy Statistics Across Rounds\n\n",
    "| Method | Mean Acc | Std Dev | Min | Max |\n",
    "|--------|----------|---------|-----|-----|\n",
] + [
    f"| {results[k]['algorithm']} | {sum(accs_by_method[k])/len(accs_by_method[k]):.2f}% "
    f"| ±{(sum((x-sum(accs_by_method[k])/len(accs_by_method[k]))**2 for x in accs_by_method[k])/len(accs_by_method[k]))**0.5:.2f}% "
    f"| {min(accs_by_method[k]):.2f}% | {max(accs_by_method[k]):.2f}% |\n"
    for k in keys
] + [
    "\n#### Key Observations\n\n",
    "1. **FedProx (μ=0.1) achieves the highest peak accuracy** (70.00%) across all rounds\n",
    "2. **FedProx (μ=0.1) maintains the highest sustained AUC-ROC** (~0.74–0.75) throughout training\n",
    "3. **FedAvg shows higher variance** — visible in the oscillating accuracy convergence curve\n",
    "4. **Large μ values (0.5, 1.0) slow early convergence** but produce smoother learning curves\n",
    "5. **μ = 0.01–0.1 optimal range**: balances regularization strength with learning flexibility\n",
]))

# ── 7. FIGURES ──
cells.append(md(["<a id='figures'></a>\n", "## 7. Figures\n\n",
                 "> All figures are 300 DPI, publication-ready. Located in `figures/`\n"]))

figure_info = [
    ("convergence_accuracy.png", "Fig. 1: Accuracy convergence curves for FedAvg and FedProx across 15 communication rounds. FedProx (μ=0.1) achieves the highest accuracy peaks."),
    ("convergence_auc.png", "Fig. 2: AUC-ROC convergence. FedProx (μ=0.1) maintains the highest and most stable discriminative performance throughout training."),
    ("convergence_loss.png", "Fig. 3: Training loss convergence. Note: loss values for FedProx include the proximal term; CE loss trends are comparable across methods."),
    ("final_metrics_comparison.png", "Fig. 4: Final-round comparison of all metrics across all methods. FedAvg and FedProx (μ=0.5) achieve the best sensitivity; FedProx (μ=0.001) achieves highest specificity."),
    ("mu_sensitivity.png", "Fig. 5: Sensitivity analysis of the proximal hyperparameter μ. Dashed lines show FedAvg baselines. Moderate μ (0.01–0.1) gives the best balance."),
    ("hospital_performance.png", "Fig. 6: Per-hospital local training accuracy in the final round. FedProx (μ=0.01) shows more uniform hospital performance than FedAvg."),
    ("proximal_loss_analysis.png", "Fig. 7: Loss decomposition for FedProx configurations showing CE loss vs proximal term contribution across rounds."),
]

for fname, caption in figure_info:
    cells.append(md([f"### {fname.replace('_', ' ').replace('.png', '').title()}\n"]))
    cells.append(img_cell(f"{FIGS}/{fname}", caption))

# ── 8. PAPER SECTIONS ──
cells.append(md(["<a id='paper'></a>\n", "## 8. Paper Sections (Ready to Use)\n\n",
                 "> Copy these sections directly into your journal paper. LaTeX equations are included.\n\n"]))
cells.append(md([paper]))

# ── 9. LATEX TABLE ──
cells.append(md([
    "<a id='table'></a>\n",
    "## 9. LaTeX Table\n\n",
    "Copy this directly into your paper:\n\n",
    "```latex\n",
    tex,
    "\n```\n",
]))

# ── 10. REFERENCES ──
cells.append(md([
    "<a id='references'></a>\n",
    "## 10. References & BibTeX\n\n",
    "### Formatted References\n\n",
    "1. **Li, T., Sahu, A. K., Zaheer, M., Sanjabi, M., Talwalkar, A., & Smith, V.** (2020). Federated Optimization in Heterogeneous Networks. *Proceedings of Machine Learning and Systems (MLSys)*, 2, 429–450.\n\n",
    "2. **McMahan, B., Moore, E., Ramage, D., Hampson, S., & y Arcas, B. A.** (2017). Communication-Efficient Learning of Deep Networks from Decentralized Data. *AISTATS*, 1273–1282.\n\n",
    "3. **Karimireddy, S. P., et al.** (2020). SCAFFOLD: Stochastic Controlled Averaging for Federated Learning. *ICML*, 5132–5143.\n\n",
    "4. **Wang, J., et al.** (2020). Tackling the Objective Inconsistency Problem in Heterogeneous Federated Optimization. *NeurIPS*, 33, 7611–7623.\n\n",
    "5. **Reddi, S., et al.** (2021). Adaptive Federated Optimization. *ICLR*.\n\n",
    "6. **Tan, M., & Le, Q.** (2019). EfficientNet: Rethinking Model Scaling for CNNs. *ICML*, 6105–6114.\n\n",
    "7. **Hou, Q., Zhou, D., & Feng, J.** (2021). Coordinate Attention for Efficient Mobile Network Design. *CVPR*, 13713–13722.\n\n",
    "---\n",
    "### BibTeX (references.bib)\n\n",
    "```bibtex\n",
    bib,
    "\n```\n",
]))

# ── NOTEBOOK METADATA ──
nb = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.14.5"},
    },
    "cells": cells
}

out = "/home/hs32/Desktop/thesis/result/fedprox-result/FedProx_Research_Complete.ipynb"
with open(out, 'w') as f:
    json.dump(nb, f, indent=1)

size = os.path.getsize(out) / 1024
print(f"✓ Notebook created: {out}")
print(f"  Size: {size:.1f} KB")
print(f"  Cells: {len(cells)}")
