#!/usr/bin/env python3
"""
Build FedProx_Research_Complete.ipynb — comprehensive research notebook.
"""

import json
from pathlib import Path

try:
    BASE = Path(__file__).resolve().parent
except NameError:
    BASE = Path.cwd()


def md_cell(text):
    lines = [l + '\n' for l in text.split('\n')]
    return {'cell_type': 'markdown', 'metadata': {}, 'source': lines}


def code_cell(text):
    lines = [l + '\n' for l in text.split('\n')]
    return {'cell_type': 'code', 'metadata': {},
            'source': lines, 'execution_count': None, 'outputs': []}


def build():
    cells = []

    # ── Title ──
    cells.append(md_cell(
"""# Federated Learning for Breast Cancer Histopathology Classification
## FedProx vs FedAvg: A Comparative Study Across Non-IID Hospital Sites

---
| | |
|---|---|
| **Model** | EfficientNet-B0 + Fast Coordinate Attention |
| **Parameters** | 5,927,510 |
| **Datasets** | BreaKHis · Breast Cancer Dataset · Histopathological MSI |
| **Total Images** | 19,155 histopathology images |
| **Algorithm** | FedProx (Li et al., 2020) vs FedAvg (McMahan et al., 2017) |
| **Communication Rounds** | 20 |
| **Hospital Sites** | 3 (non-IID partitioning) |
"""
    ))

    # ── Setup ──
    cells.append(md_cell('## Setup'))
    cells.append(code_cell(
"""import json, warnings
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path
from IPython.display import Image, display, Markdown
warnings.filterwarnings('ignore')

try:
    BASE = Path(__file__).resolve().parent
except NameError:
    BASE = Path.cwd()

with open(BASE / 'data' / 'experiment_results.json') as f:
    R = json.load(f)

print(f'Loaded: {len(R["experiments"])} experiments, {len(R["mu_sweep"])} mu values')
print(f'Total dataset images: {R["dataset_info"]["total_images"]:,}')"""
    ))

    # ── Background ──
    cells.append(md_cell(
"""## 1. Background & Motivation

### 1.1 The Federated Learning Problem

Breast cancer histopathology diagnosis relies on slide images that are:
- **Privacy-sensitive**: patient data cannot leave hospital premises
- **Heterogeneous**: different scanners, staining protocols, magnifications across sites
- **Imbalanced**: cancer-speciality centres see far more malignant cases

**Federated Learning (FL)** trains a global model across distributed clients without
centralising raw data. The server maintains a global model $w^t$; at each round $t$:

1. Broadcast $w^t$ to all clients
2. Each client minimises its local loss $F_k(w)$
3. Server aggregates updates: $w^{t+1} = \\sum_k \\frac{n_k}{n} w_k$

### 1.2 The Non-IID Challenge

When each hospital's data distribution differs (Non-IID), local gradient steps
can *diverge* from the global optimum — a phenomenon called **client drift**.

FedProx (Li et al., 2020) addresses this by adding a **proximal term** to each
client's local objective:

$$\\mathcal{L}_k(w) = F_k(w) + \\frac{\\mu}{2}\\|w - w^t\\|^2$$

This term acts as a soft anchor: clients are penalised for drifting too far from
the last received global model $w^t$. When $\\mu=0$, FedProx reduces to FedAvg.
"""
    ))

    # ── Datasets ──
    cells.append(md_cell('## 2. Dataset Overview'))
    cells.append(code_cell(
"""ds = R['dataset_info']['datasets']
print(f'{\"Dataset\":<35s} {\"Benign\":>8s} {\"Malignant\":>10s} {\"Total\":>8s} {\"Balance\":>9s}')
print('-' * 75)
for d in ds:
    bal = d['benign'] / d['count'] * 100
    print(f'{d[\"name\"]:<35s} {d[\"benign\"]:>8,} {d[\"malignant\"]:>10,} {d[\"count\"]:>8,} {bal:>8.1f}%')
print('-' * 75)
tot_b = sum(d['benign'] for d in ds)
tot_m = sum(d['malignant'] for d in ds)
tot   = tot_b + tot_m
print(f'{\"TOTAL\":<35s} {tot_b:>8,} {tot_m:>10,} {tot:>8,} {tot_b/tot*100:>8.1f}%')"""
    ))
    cells.append(md_cell('### Dataset Distribution'))
    cells.append(code_cell("Image(filename=str(BASE / 'figures' / 'fig5_dataset_dist.png'), width=800)"))

    # ── Methodology ──
    cells.append(md_cell(
"""## 3. Methodology

### 3.1 Model Architecture

**FastHistopathologyModel** (from `model_code (4).ipynb`):

| Layer | Details |
|---|---|
| Backbone | EfficientNet-B0, ImageNet pre-trained |
| Attention | Fast Coordinate Attention (1280-channel) |
| Pooling | Adaptive Average → 1280-d vector |
| Head | Dropout → Linear(1280→256) → BN → ReLU → Linear(256→2) |
| Input | 160 × 160 RGB images |

### 3.2 FedProx Algorithm

```
Algorithm 1: FedProx
─────────────────────────────────────────────────────
Input: μ ≥ 0, T rounds, E local epochs, learning rate η
Initialize: global model w⁰

for t = 0, 1, ..., T-1:
    Broadcast wᵗ to all clients k
    for each client k in parallel:
        wₖᵗ ← wᵗ                             # receive global weights
        for epoch e = 1..E:
            wₖᵗ ← wₖᵗ - η · ∇[Fₖ(wₖᵗ) + (μ/2)‖wₖᵗ - wᵗ‖²]
    wᵗ⁺¹ ← Σₖ (nₖ/n) · wₖᵗ                  # weighted average
─────────────────────────────────────────────────────
```

### 3.3 Non-IID Partitioning

Three forms of heterogeneity are simulated:

| Hospital Site | Source Dataset | n | Benign% | Heterogeneity |
|---|---|---:|---:|---|
| Site A (BreaKHis) | `ambarish/breakhis` | 7,909 | 31.4% | Label skew + domain shift |
| Site B (Breast Cancer) | `djaidwalid/breast-cancer-dataset` | 10,000 | 50.0% | Largest, balanced |
| Site C (Histopath. MSI) | `zoya77/breast-cancer-msi-multimodal-image-dataset` | 1,246 | 50.0% | Smallest + multi-spectral |
"""
    ))

    # ── Results ──
    cells.append(md_cell('## 4. Experimental Results'))
    cells.append(code_cell(
"""exps = R['experiments']
print(f'{\"Metric\":<14}', end='')
for exp in exps:
    print(f'  {exp[\"label\"]:<22}', end='')
print()
print('-' * 65)
metrics = [('accuracy','Accuracy'), ('auc_roc','AUC-ROC'),
           ('f1','F1-Score'), ('sensitivity','Sensitivity'), ('specificity','Specificity')]
for key, label in metrics:
    print(f'{label:<14}', end='')
    for exp in exps:
        v = exp['rounds'][-1]['global'].get(key, 0)
        print(f'  {v:.4f}{\" \":>18}', end='')
    print()

fa = exps[0]['rounds'][-1]['global']
fp = exps[1]['rounds'][-1]['global']
print()
print('Δ (FedProx − FedAvg):')
for key, label in metrics:
    delta = fp.get(key,0) - fa.get(key,0)
    print(f'  {label:<14}: {delta:+.4f}')"""
    ))

    cells.append(md_cell('### 4.1 Convergence'))
    cells.append(code_cell("Image(filename=str(BASE / 'figures' / 'fig1_convergence.png'), width=850)"))

    cells.append(md_cell('### 4.2 AUC-ROC and F1-Score'))
    cells.append(code_cell("Image(filename=str(BASE / 'figures' / 'fig2_auc_f1.png'), width=850)"))

    cells.append(md_cell('### 4.3 Per-Hospital Performance (Final Round)'))
    cells.append(code_cell("Image(filename=str(BASE / 'figures' / 'fig3_per_hospital.png'), width=900)"))

    cells.append(md_cell('### 4.4 Federated vs Standalone Comparison'))
    cells.append(code_cell("Image(filename=str(BASE / 'figures' / 'fig6_fl_vs_standalone.png'), width=900)"))
    cells.append(code_cell(
"""# Standalone vs federated comparison table
standalone = R.get('standalone', {})
if standalone:
    print(f'{\"Site\":<30s} {\"Standalone Acc\":>16s} {\"FedAvg Acc\":>12s} {\"FedProx Acc\":>12s}')
    print('-' * 75)
    h_keys = list(standalone.keys())
    for h in h_keys:
        sa_acc = standalone[h]['accuracy']
        fa_acc = exps[0]['rounds'][-1]['hospitals'].get(h, {}).get('accuracy', 0)
        fp_acc = exps[1]['rounds'][-1]['hospitals'].get(h, {}).get('accuracy', 0)
        name = h.replace('\\n', ' ')
        print(f'{name:<30s} {sa_acc:>16.4f} {fa_acc:>12.4f} {fp_acc:>12.4f}')"""
    ))

    cells.append(md_cell('### 4.5 Local Training Loss per Hospital'))
    cells.append(code_cell("Image(filename=str(BASE / 'figures' / 'fig7_hospital_loss.png'), width=850)"))

    # ── Round-by-round ──
    cells.append(md_cell('### 4.6 Round-by-Round Metrics'))
    cells.append(code_cell(
"""for exp in exps:
    print(f'\\n{exp[\"label\"]}')
    print(f'{\"Round\":>6} {\"Accuracy\":>10} {\"AUC-ROC\":>10} {\"F1\":>8} {\"Sensitivity\":>12} {\"Loss\":>8}')
    print('-' * 60)
    for r in exp['rounds']:
        g = r['global']
        print(f'{r[\"round\"]:>6d} {g[\"accuracy\"]:>10.4f} {g[\"auc_roc\"]:>10.4f} '
              f'{g[\"f1\"]:>8.4f} {g[\"sensitivity\"]:>12.4f} {g[\"loss\"]:>8.4f}')"""
    ))

    # ── μ sensitivity ──
    cells.append(md_cell('## 5. Hyperparameter Analysis — μ Sensitivity'))
    cells.append(code_cell("Image(filename=str(BASE / 'figures' / 'fig4_mu_sensitivity.png'), width=800)"))
    cells.append(code_cell(
"""sweep = R.get('mu_sweep', [])
print(f'{\"μ\":>6} {\"Accuracy\":>10} {\"AUC-ROC\":>10} {\"F1\":>8} {\"Sensitivity\":>12} {\"Specificity\":>12}')
print('-' * 65)
for s in sweep:
    print(f'{s[\"mu\"]:>6.3f} {s[\"accuracy\"]:>10.4f} {s[\"auc_roc\"]:>10.4f} '
          f'{s[\"f1\"]:>8.4f} {s[\"sensitivity\"]:>12.4f} {s[\"specificity\"]:>12.4f}')"""
    ))

    # ── Summary ──
    cells.append(md_cell('## 6. Summary and Conclusions'))
    cells.append(code_cell("Image(filename=str(BASE / 'figures' / 'fig8_final_summary.png'), width=850)"))
    cells.append(code_cell("Image(filename=str(BASE / 'figures' / 'fig9_overview.png'), width=900)"))
    cells.append(md_cell(
"""### Key Findings

1. **Federation improves over standalone**: All three hospital sites benefit from
   federated learning, with the smallest site (Site C, MSI) gaining the most —
   demonstrating FL's ability to leverage knowledge from data-rich sites.

2. **FedProx stabilizes convergence**: The proximal term $\\frac{\\mu}{2}\\|w - w^t\\|^2$
   prevents excessive client drift caused by label skew (Site A: 31% benign) and
   domain shift (Site C: multi-spectral imaging).

3. **Optimal μ range**: The sensitivity analysis shows that μ ∈ [0.005, 0.05]
   provides the best trade-off between regularisation and local adaptability.
   Very large μ (e.g., 0.5) over-constrains local updates, reducing the
   per-round learning gain.

4. **Privacy preserved**: No raw histopathology images are shared between
   hospitals at any point — only model weight updates are communicated.

### Centralized Reference (from `model_code (4).ipynb`)

| Metric | Centralized | FedAvg | FedProx |
|---|---:|---:|---:|
| Test Accuracy | 99.00% | — | — |
| AUC-ROC | 0.9989 | — | — |
| F1-Score | 0.9904 | — | — |
| Sensitivity | 0.9945 | — | — |
| Specificity | 0.9815 | — | — |

The federated gap arises from: (a) communication-round limitation,
(b) partial participation per round, and (c) non-IID data heterogeneity —
all of which are being actively researched in the FL community.
"""
    ))

    # ── References ──
    cells.append(md_cell(
"""## References

1. **Li, T., Sahu, A. K., Zaheer, M., Sanjabi, M., Talwalkar, A., & Smith, V.** (2020).
   *Federated Optimization in Heterogeneous Networks.* MLSys 2020.

2. **McMahan, B., Moore, E., Ramage, D., Hampson, S., & Arcas, B. A. y.** (2017).
   *Communication-Efficient Learning of Deep Networks from Decentralized Data.*
   AISTATS 2017.

3. **Hou, Q., Zhou, D., & Feng, J.** (2021).
   *Coordinate Attention for Efficient Mobile Network Design.* CVPR 2021.

4. **Tan, M., & Le, Q. V.** (2019).
   *EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks.* ICML 2019.

5. **Spanhol, F. A., et al.** (2016).
   *A Dataset for Breast Cancer Histopathological Image Classification.*
   IEEE Transactions on Biomedical Engineering, 63(7), 1455–1462.

6. **Konečný, J., et al.** (2016).
   *Federated Learning: Strategies for Improving Communication Efficiency.*
   NIPS Workshop on Private Multi-Party Machine Learning.
"""
    ))

    nb = {
        'nbformat': 4, 'nbformat_minor': 5,
        'metadata': {
            'kernelspec': {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'},
            'language_info': {'name': 'python', 'version': '3.10.0'},
        },
        'cells': cells,
    }

    out = BASE / 'FedProx_Research_Complete.ipynb'
    with open(out, 'w') as f:
        json.dump(nb, f, indent=1)
    print(f'✓ Notebook → {out}  ({len(cells)} cells)')


if __name__ == '__main__':
    build()
