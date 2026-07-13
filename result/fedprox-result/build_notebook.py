#!/usr/bin/env python3
"""
Build the consolidated FedProx research notebook.

Reads:
    paper_sections/methodology.md
    data/experiment_results.json
    figures/*.png

Writes:
    FedProx_Research_Complete.ipynb
"""

import os
import sys
import json
import base64
from pathlib import Path

# ── resolve paths ──
try:
    BASE = Path(__file__).resolve().parent
except NameError:
    BASE = Path.cwd()


def md_cell(source):
    """Create a markdown notebook cell."""
    if isinstance(source, list):
        lines = source
    else:
        lines = [line + '\n' for line in source.split('\n')]
    return {
        'cell_type': 'markdown',
        'metadata': {},
        'source': lines,
    }


def code_cell(source):
    """Create a code notebook cell."""
    if isinstance(source, list):
        lines = source
    else:
        lines = [line + '\n' for line in source.split('\n')]
    return {
        'cell_type': 'code',
        'metadata': {},
        'source': lines,
        'execution_count': None,
        'outputs': [],
    }


def image_to_base64(img_path):
    """Encode an image file as base64 string."""
    with open(img_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')


def build_notebook():
    cells = []

    # ── Title ──
    cells.append(md_cell(
        '# FedProx vs FedAvg: Federated Breast Cancer Histopathology Classification\n'
        '\n'
        '> **Complete Research Notebook**  \n'
        '> Model: EfficientNet-B0 + Fast Coordinate Attention (5.9M params)  \n'
        '> Datasets: BreaKHis + Breast Cancer + Histopathological MSI (19,155 images)  \n'
        '> Aggregation: FedProx (Li et al., 2020) vs FedAvg (McMahan et al., 2017)\n'
    ))

    # ── Setup cell ──
    cells.append(code_cell(
        'import os, json, sys\n'
        'import numpy as np\n'
        'import matplotlib.pyplot as plt\n'
        'from pathlib import Path\n'
        'from IPython.display import display, Markdown, Image\n'
        '\n'
        '# Resolve base directory\n'
        'try:\n'
        '    BASE = Path(__file__).resolve().parent\n'
        'except NameError:\n'
        '    BASE = Path.cwd()\n'
        '\n'
        'print(f"Working directory: {BASE}")\n'
    ))

    # ── Methodology ──
    meth_path = BASE / 'paper_sections' / 'methodology.md'
    if meth_path.exists():
        cells.append(md_cell('---\n## Methodology\n'))
        meth_text = meth_path.read_text()
        cells.append(md_cell(meth_text))

    # ── Load results ──
    cells.append(md_cell('---\n## Experimental Results\n'))
    cells.append(code_cell(
        '# Load experiment results\n'
        'results_path = BASE / "data" / "experiment_results.json"\n'
        'with open(results_path) as f:\n'
        '    results = json.load(f)\n'
        '\n'
        'print(f"Loaded results with {len(results[\'experiments\'])} experiments")\n'
        'print(f"μ sweep: {len(results.get(\'mu_sweep\', []))} configurations")\n'
    ))

    # ── Dataset info table ──
    cells.append(md_cell('### Dataset Summary\n'))
    cells.append(code_cell(
        '# Display dataset information\n'
        'ds_info = results["dataset_info"]["datasets"]\n'
        'print(f"{\'Dataset\':<25s} {\'Benign\':>8s} {\'Malignant\':>10s} {\'Total\':>8s}")\n'
        'print("-" * 55)\n'
        'total_b = total_m = 0\n'
        'for ds in ds_info:\n'
        '    print(f"{ds[\'name\']:<25s} {ds[\'benign\']:>8d} {ds[\'malignant\']:>10d} {ds[\'count\']:>8d}")\n'
        '    total_b += ds["benign"]\n'
        '    total_m += ds["malignant"]\n'
        'print("-" * 55)\n'
        'print(f"{\'TOTAL\':<25s} {total_b:>8d} {total_m:>10d} {total_b + total_m:>8d}")\n'
    ))

    # ── Final round comparison ──
    cells.append(md_cell('### Final-Round Performance Comparison\n'))
    cells.append(code_cell(
        '# Final round comparison\n'
        'print(f"{\'Method\':<25s} {\'Accuracy\':>10s} {\'AUC-ROC\':>10s} {\'Loss\':>10s}")\n'
        'print("-" * 60)\n'
        'for exp in results["experiments"]:\n'
        '    final = exp["rounds"][-1]["global"]\n'
        '    print(f"{exp[\'label\']:<25s} {final[\'accuracy\']:>10.4f} "\n'
        '          f"{final[\'auc_roc\']:>10.4f} {final[\'loss\']:>10.4f}")\n'
        '\n'
        '# Delta\n'
        'b  = results["experiments"][0]["rounds"][-1]["global"]\n'
        'fp = results["experiments"][1]["rounds"][-1]["global"]\n'
        'print(f"\\nΔ Accuracy: {fp[\'accuracy\'] - b[\'accuracy\']:+.4f}")\n'
        'print(f"Δ AUC-ROC:  {fp[\'auc_roc\'] - b[\'auc_roc\']:+.4f}")\n'
    ))

    # ── Convergence plots ──
    cells.append(md_cell('### Convergence Analysis\n'))

    plot_files = [
        ('combined_convergence.png', 'Combined Accuracy & Loss Convergence'),
        ('convergence_accuracy.png', 'Accuracy Convergence'),
        ('convergence_loss.png', 'Loss Convergence'),
        ('convergence_auc.png', 'AUC-ROC Convergence'),
        ('per_hospital_accuracy.png', 'Per-Hospital Accuracy (Final Round)'),
        ('mu_sensitivity.png', 'μ Sensitivity Analysis'),
        ('dataset_distribution.png', 'Dataset Class Distribution'),
    ]

    for filename, title in plot_files:
        fig_path = BASE / 'figures' / filename
        if fig_path.exists():
            cells.append(md_cell(f'#### {title}\n'))
            cells.append(code_cell(
                f'Image(filename=str(BASE / "figures" / "{filename}"), width=700)\n'
            ))

    # ── Convergence data code ──
    cells.append(md_cell('### Round-by-Round Data\n'))
    cells.append(code_cell(
        '# Convergence data\n'
        'for exp in results["experiments"]:\n'
        '    print(f"\\n{exp[\'label\']}")\n'
        '    print(f"{\'Round\':>6s} {\'Accuracy\':>10s} {\'AUC-ROC\':>10s} {\'Loss\':>10s}")\n'
        '    print("-" * 40)\n'
        '    for r in exp["rounds"]:\n'
        '        g = r["global"]\n'
        '        print(f"{r[\'round\']:>6d} {g[\'accuracy\']:>10.4f} "\n'
        '              f"{g[\'auc_roc\']:>10.4f} {g[\'loss\']:>10.4f}")\n'
    ))

    # ── μ Sensitivity ──
    cells.append(md_cell('### μ Sensitivity Analysis\n'))
    cells.append(code_cell(
        '# μ sweep results\n'
        'sweep = results.get("mu_sweep", [])\n'
        'if sweep:\n'
        '    print(f"{\'μ\':>8s} {\'Accuracy\':>10s} {\'AUC-ROC\':>10s} {\'Loss\':>10s}")\n'
        '    print("-" * 42)\n'
        '    for s in sweep:\n'
        '        print(f"{s[\'mu\']:>8.3f} {s[\'accuracy\']:>10.4f} "\n'
        '              f"{s[\'auc_roc\']:>10.4f} {s[\'loss\']:>10.4f}")\n'
    ))

    # ── Model info ──
    cells.append(md_cell('### Model Information\n'))
    cells.append(code_cell(
        '# Model baseline metrics\n'
        'mi = results["model_info"]\n'
        'print(f"Architecture:          {mi[\'architecture\']}")\n'
        'print(f"Total Parameters:      {mi[\'total_params\']:,}")\n'
        'print(f"Input Size:            {mi[\'img_size\']}×{mi[\'img_size\']}")\n'
        'print(f"Centralized Val Acc:   {mi[\'centralized_best_val_acc\']:.2%}")\n'
        'print(f"Centralized Test Acc:  {mi[\'centralized_test_acc\']:.2%}")\n'
        'print(f"Centralized AUC:       {mi[\'centralized_auc\']:.4f}")\n'
        'print(f"Centralized F1:        {mi[\'centralized_f1\']:.4f}")\n'
    ))

    # ── References ──
    cells.append(md_cell(
        '---\n'
        '## References\n'
        '\n'
        '1. Li, T., et al. (2020). *Federated Optimization in Heterogeneous Networks.* MLSys.\n'
        '2. McMahan, B., et al. (2017). *Communication-Efficient Learning of Deep Networks from Decentralized Data.* AISTATS.\n'
        '3. Hou, Q., et al. (2021). *Coordinate Attention for Efficient Mobile Network Design.* CVPR.\n'
        '4. Tan, M. & Le, Q. V. (2019). *EfficientNet: Rethinking Model Scaling for CNNs.* ICML.\n'
        '5. Spanhol, F. A., et al. (2016). *A Dataset for Breast Cancer Histopathological Image Classification.* IEEE TBME.\n'
    ))

    # ── Build notebook JSON ──
    notebook = {
        'nbformat': 4,
        'nbformat_minor': 5,
        'metadata': {
            'kernelspec': {
                'display_name': 'Python 3',
                'language': 'python',
                'name': 'python3',
            },
            'language_info': {
                'name': 'python',
                'version': '3.10.0',
            },
        },
        'cells': cells,
    }

    out_path = BASE / 'FedProx_Research_Complete.ipynb'
    with open(out_path, 'w') as f:
        json.dump(notebook, f, indent=1)

    print(f'✓ Notebook written → {out_path}')
    print(f'  {len(cells)} cells')


if __name__ == '__main__':
    build_notebook()
