#!/usr/bin/env python3
"""
Generate publication-quality plots from FedProx experiment results.
Reads:  ../data/experiment_results.json
Writes: ../figures/*.png
"""

import os
import sys
import json
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use('Agg')  # non-interactive backend
import matplotlib.pyplot as plt

# ── resolve paths ──
try:
    BASE = Path(__file__).resolve().parent.parent
except NameError:
    BASE = Path.cwd()

DATA_PATH = BASE / 'data' / 'experiment_results.json'
FIG_DIR   = BASE / 'figures'
FIG_DIR.mkdir(parents=True, exist_ok=True)

# ── style ──
plt.rcParams.update({
    'figure.dpi': 150,
    'savefig.dpi': 300,
    'font.size': 11,
    'axes.titlesize': 13,
    'axes.labelsize': 12,
    'legend.fontsize': 10,
    'figure.figsize': (8, 5),
})

COLORS = {
    'FedAvg':  '#e74c3c',
    'FedProx': '#2ecc71',
}


def load_results():
    with open(DATA_PATH) as f:
        return json.load(f)


# ──────────────────────────────────────────────────────────────
# Plot 1: Global accuracy convergence
# ──────────────────────────────────────────────────────────────
def plot_accuracy_convergence(data):
    fig, ax = plt.subplots()
    for exp in data['experiments']:
        rounds = [r['round'] for r in exp['rounds']]
        accs   = [r['global']['accuracy'] for r in exp['rounds']]
        label  = exp['label']
        color  = COLORS.get('FedProx' if 'FedProx' in label else 'FedAvg', '#333')
        ax.plot(rounds, accs, '-o', color=color, label=label,
                markersize=5, linewidth=2)

    ax.set_xlabel('Communication Round')
    ax.set_ylabel('Global Test Accuracy')
    ax.set_title('FedProx vs FedAvg — Accuracy Convergence')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.set_ylim(bottom=0.5)
    fig.tight_layout()
    fig.savefig(FIG_DIR / 'convergence_accuracy.png')
    plt.close(fig)
    print('  ✓ convergence_accuracy.png')


# ──────────────────────────────────────────────────────────────
# Plot 2: Global loss convergence
# ──────────────────────────────────────────────────────────────
def plot_loss_convergence(data):
    fig, ax = plt.subplots()
    for exp in data['experiments']:
        rounds = [r['round'] for r in exp['rounds']]
        losses = [r['global']['loss'] for r in exp['rounds']]
        label  = exp['label']
        color  = COLORS.get('FedProx' if 'FedProx' in label else 'FedAvg', '#333')
        ax.plot(rounds, losses, '-s', color=color, label=label,
                markersize=5, linewidth=2)

    ax.set_xlabel('Communication Round')
    ax.set_ylabel('Global Test Loss')
    ax.set_title('FedProx vs FedAvg — Loss Convergence')
    ax.legend()
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(FIG_DIR / 'convergence_loss.png')
    plt.close(fig)
    print('  ✓ convergence_loss.png')


# ──────────────────────────────────────────────────────────────
# Plot 3: AUC-ROC convergence
# ──────────────────────────────────────────────────────────────
def plot_auc_convergence(data):
    fig, ax = plt.subplots()
    for exp in data['experiments']:
        rounds = [r['round'] for r in exp['rounds']]
        aucs   = [r['global']['auc_roc'] for r in exp['rounds']]
        label  = exp['label']
        color  = COLORS.get('FedProx' if 'FedProx' in label else 'FedAvg', '#333')
        ax.plot(rounds, aucs, '-^', color=color, label=label,
                markersize=5, linewidth=2)

    ax.set_xlabel('Communication Round')
    ax.set_ylabel('Global AUC-ROC')
    ax.set_title('FedProx vs FedAvg — AUC-ROC Convergence')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.set_ylim(0.4, 1.02)
    fig.tight_layout()
    fig.savefig(FIG_DIR / 'convergence_auc.png')
    plt.close(fig)
    print('  ✓ convergence_auc.png')


# ──────────────────────────────────────────────────────────────
# Plot 4: Per-hospital accuracy (final round, grouped bar)
# ──────────────────────────────────────────────────────────────
def plot_per_hospital_accuracy(data):
    experiments = data['experiments']
    h_names = list(experiments[0]['rounds'][-1]['hospitals'].keys())

    x = np.arange(len(h_names))
    width = 0.35

    fig, ax = plt.subplots(figsize=(9, 5))
    for i, exp in enumerate(experiments):
        final_hospitals = exp['rounds'][-1]['hospitals']
        accs = [final_hospitals[h]['accuracy'] for h in h_names]
        label = exp['label']
        color = COLORS.get('FedProx' if 'FedProx' in label else 'FedAvg', '#333')
        ax.bar(x + i * width, accs, width, label=label, color=color, alpha=0.85)

    ax.set_ylabel('Accuracy')
    ax.set_title('Per-Hospital Accuracy — Final Round')
    ax.set_xticks(x + width / 2)
    ax.set_xticklabels(h_names, fontsize=9)
    ax.legend()
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_ylim(bottom=0.5)
    fig.tight_layout()
    fig.savefig(FIG_DIR / 'per_hospital_accuracy.png')
    plt.close(fig)
    print('  ✓ per_hospital_accuracy.png')


# ──────────────────────────────────────────────────────────────
# Plot 5: μ Sensitivity Analysis
# ──────────────────────────────────────────────────────────────
def plot_mu_sensitivity(data):
    sweep = data.get('mu_sweep', [])
    if not sweep:
        print('  ⚠ no mu_sweep data — skipping')
        return

    mus  = [s['mu'] for s in sweep]
    accs = [s['accuracy'] for s in sweep]
    aucs = [s['auc_roc'] for s in sweep]

    fig, ax1 = plt.subplots()
    ax2 = ax1.twinx()

    l1, = ax1.plot(range(len(mus)), accs, '-o', color='#3498db', label='Accuracy',
                   linewidth=2, markersize=6)
    l2, = ax2.plot(range(len(mus)), aucs, '-s', color='#e67e22', label='AUC-ROC',
                   linewidth=2, markersize=6)

    ax1.set_xlabel('μ (proximal regularization strength)')
    ax1.set_ylabel('Accuracy', color='#3498db')
    ax2.set_ylabel('AUC-ROC', color='#e67e22')
    ax1.set_xticks(range(len(mus)))
    ax1.set_xticklabels([str(m) for m in mus], fontsize=9)
    ax1.set_title('FedProx — μ Sensitivity Analysis')

    lines = [l1, l2]
    ax1.legend(lines, [l.get_label() for l in lines], loc='lower right')
    ax1.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(FIG_DIR / 'mu_sensitivity.png')
    plt.close(fig)
    print('  ✓ mu_sensitivity.png')


# ──────────────────────────────────────────────────────────────
# Plot 6: Combined convergence (accuracy + loss subplots)
# ──────────────────────────────────────────────────────────────
def plot_combined_convergence(data):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    for exp in data['experiments']:
        rounds = [r['round'] for r in exp['rounds']]
        accs   = [r['global']['accuracy'] for r in exp['rounds']]
        losses = [r['global']['loss'] for r in exp['rounds']]
        label  = exp['label']
        color  = COLORS.get('FedProx' if 'FedProx' in label else 'FedAvg', '#333')

        ax1.plot(rounds, accs, '-o', color=color, label=label, linewidth=2, markersize=5)
        ax2.plot(rounds, losses, '-s', color=color, label=label, linewidth=2, markersize=5)

    ax1.set_xlabel('Communication Round')
    ax1.set_ylabel('Global Accuracy')
    ax1.set_title('Accuracy Convergence')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    ax1.set_ylim(bottom=0.5)

    ax2.set_xlabel('Communication Round')
    ax2.set_ylabel('Global Loss')
    ax2.set_title('Loss Convergence')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    fig.suptitle('FedProx vs FedAvg — Convergence', fontsize=14, y=1.02)
    fig.tight_layout()
    fig.savefig(FIG_DIR / 'combined_convergence.png', bbox_inches='tight')
    plt.close(fig)
    print('  ✓ combined_convergence.png')


# ──────────────────────────────────────────────────────────────
# Plot 7: Dataset distribution
# ──────────────────────────────────────────────────────────────
def plot_dataset_distribution(data):
    ds_info = data.get('dataset_info', {}).get('datasets', [])
    if not ds_info:
        return

    names    = [d['name'] for d in ds_info]
    benign   = [d['benign'] for d in ds_info]
    malign   = [d['malignant'] for d in ds_info]

    x = np.arange(len(names))
    width = 0.35

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(x - width/2, benign,  width, label='Benign',    color='#2ecc71', alpha=0.85)
    ax.bar(x + width/2, malign, width, label='Malignant', color='#e74c3c', alpha=0.85)

    ax.set_ylabel('Number of Images')
    ax.set_title('Dataset Class Distribution')
    ax.set_xticks(x)
    ax.set_xticklabels(names, fontsize=9)
    ax.legend()
    ax.grid(True, alpha=0.3, axis='y')

    # Add count labels
    for i, (b, m) in enumerate(zip(benign, malign)):
        ax.text(i - width/2, b + 100, str(b), ha='center', fontsize=8)
        ax.text(i + width/2, m + 100, str(m), ha='center', fontsize=8)

    fig.tight_layout()
    fig.savefig(FIG_DIR / 'dataset_distribution.png')
    plt.close(fig)
    print('  ✓ dataset_distribution.png')


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────
def main():
    print("=" * 55)
    print("  Generating FedProx Research Plots")
    print("=" * 55)

    if not DATA_PATH.exists():
        print(f"ERROR: {DATA_PATH} not found. Run fedprox_experiment.py first.")
        sys.exit(1)

    data = load_results()

    plot_accuracy_convergence(data)
    plot_loss_convergence(data)
    plot_auc_convergence(data)
    plot_per_hospital_accuracy(data)
    plot_mu_sensitivity(data)
    plot_combined_convergence(data)
    plot_dataset_distribution(data)

    print(f"\n✓ All figures saved in {FIG_DIR}/")


if __name__ == '__main__':
    main()
