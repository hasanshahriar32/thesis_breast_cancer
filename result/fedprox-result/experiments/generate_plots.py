#!/usr/bin/env python3
"""
Publication-quality plot generation for FedProx vs FedAvg research.
Reads:  ../data/experiment_results.json
Writes: ../figures/*.png  (9 figures)
"""

import json, sys
from pathlib import Path
from itertools import cycle

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
import matplotlib.ticker as ticker

try:
    import seaborn as sns
    sns.set_theme(style='whitegrid', palette='muted')
    HAS_SNS = True
except ImportError:
    HAS_SNS = False

# ── paths ──
try:
    BASE = Path(__file__).resolve().parent.parent
except NameError:
    BASE = Path.cwd()

DATA  = BASE / 'data' / 'experiment_results.json'
FIGS  = BASE / 'figures'
FIGS.mkdir(exist_ok=True)

# ── global style ──────────────────────────────────────────────────────────────
PALETTE = {
    'FedAvg':  '#E53935',   # red
    'FedProx': '#1E88E5',   # blue
    'Standalone': '#43A047',
    'Benign':    '#00ACC1',
    'Malignant': '#FB8C00',
}
DPI    = 300
FONT   = {'family': 'sans-serif', 'size': 11}
matplotlib.rc('font', **FONT)
matplotlib.rcParams.update({
    'axes.titlesize': 13, 'axes.labelsize': 11,
    'legend.fontsize': 10, 'xtick.labelsize': 9,
    'ytick.labelsize': 9,  'figure.dpi': 150,
    'axes.spines.top': False, 'axes.spines.right': False,
    'grid.linewidth': 0.5,   'grid.alpha': 0.4,
})

def load():
    with open(DATA) as f:
        return json.load(f)

def label_short(lbl):
    return 'FedAvg' if 'FedAvg' in lbl else 'FedProx'


# ══════════════════════════════════════════════════════════════════════════════
# Fig 1 — Dual convergence (accuracy + loss side by side)
# ══════════════════════════════════════════════════════════════════════════════
def fig1_convergence(data):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

    for exp in data['experiments']:
        lbl   = label_short(exp['label'])
        color = PALETTE[lbl]
        rs    = exp['rounds']
        rnds  = [r['round'] for r in rs]
        accs  = [r['global']['accuracy'] * 100 for r in rs]
        loss  = [r['global']['loss'] for r in rs]
        ls    = '-o' if lbl == 'FedProx' else '--s'
        ax1.plot(rnds, accs, ls, color=color, lw=2.0, ms=5,
                 label=exp['label'], alpha=0.95)
        ax2.plot(rnds, loss, ls, color=color, lw=2.0, ms=5,
                 label=exp['label'], alpha=0.95)

    # centralized reference line
    cent_acc = data['model_info']['centralized_test_acc'] * 100
    ax1.axhline(cent_acc, color='#7B1FA2', ls=':', lw=1.5,
                label=f'Centralized ({cent_acc:.0f}%)')

    ax1.set(xlabel='Communication Round', ylabel='Global Test Accuracy (%)',
            title='Accuracy Convergence')
    ax1.set_ylim(40, 100)
    ax1.yaxis.set_major_formatter(ticker.FormatStrFormatter('%.0f%%'))
    ax1.legend(framealpha=0.9)

    ax2.set(xlabel='Communication Round', ylabel='Cross-Entropy Loss',
            title='Loss Convergence')
    ax2.legend(framealpha=0.9)

    fig.suptitle('FedProx vs FedAvg — Global Model Convergence', fontsize=14, y=1.01)
    fig.tight_layout()
    fig.savefig(FIGS / 'fig1_convergence.png', dpi=DPI, bbox_inches='tight')
    plt.close(fig)
    print('  ✓ fig1_convergence.png')


# ══════════════════════════════════════════════════════════════════════════════
# Fig 2 — AUC-ROC + F1 convergence
# ══════════════════════════════════════════════════════════════════════════════
def fig2_auc_f1(data):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))
    for exp in data['experiments']:
        lbl   = label_short(exp['label'])
        color = PALETTE[lbl]
        rs    = exp['rounds']
        rnds  = [r['round'] for r in rs]
        aucs  = [r['global']['auc_roc'] for r in rs]
        f1s   = [r['global']['f1'] for r in rs]
        ls    = '-o' if lbl == 'FedProx' else '--s'
        ax1.plot(rnds, aucs, ls, color=color, lw=2.0, ms=5, label=exp['label'])
        ax2.plot(rnds, f1s,  ls, color=color, lw=2.0, ms=5, label=exp['label'])

    ax1.axhline(data['model_info']['centralized_auc'], color='#7B1FA2', ls=':', lw=1.5,
                label=f'Centralized (AUC={data["model_info"]["centralized_auc"]:.4f})')
    ax1.set(xlabel='Communication Round', ylabel='AUC-ROC', title='AUC-ROC Convergence')
    ax1.set_ylim(0.4, 1.02); ax1.legend(framealpha=0.9)

    ax2.axhline(data['model_info']['centralized_f1'], color='#7B1FA2', ls=':', lw=1.5,
                label=f'Centralized (F1={data["model_info"]["centralized_f1"]:.4f})')
    ax2.set(xlabel='Communication Round', ylabel='F1-Score', title='F1-Score Convergence')
    ax2.set_ylim(0.3, 1.02); ax2.legend(framealpha=0.9)

    fig.suptitle('FedProx vs FedAvg — AUC-ROC and F1-Score', fontsize=14, y=1.01)
    fig.tight_layout()
    fig.savefig(FIGS / 'fig2_auc_f1.png', dpi=DPI, bbox_inches='tight')
    plt.close(fig)
    print('  ✓ fig2_auc_f1.png')


# ══════════════════════════════════════════════════════════════════════════════
# Fig 3 — Per-hospital grouped bar chart (final round)
# ══════════════════════════════════════════════════════════════════════════════
def fig3_per_hospital(data):
    experiments = data['experiments']
    h_keys = list(experiments[0]['rounds'][-1]['hospitals'].keys())
    h_labels = [k.replace('\n', '\n') for k in h_keys]

    x = np.arange(len(h_keys))
    w = 0.25
    metrics = ['accuracy', 'auc_roc', 'f1']
    metric_labels = ['Accuracy', 'AUC-ROC', 'F1-Score']

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    for ax, metric, mlabel in zip(axes, metrics, metric_labels):
        offsets = np.linspace(-w, w, len(experiments))
        for offset, exp in zip(offsets, experiments):
            lbl    = label_short(exp['label'])
            color  = PALETTE[lbl]
            vals   = [exp['rounds'][-1]['hospitals'][h][metric] for h in h_keys]
            bars   = ax.bar(x + offset, [v*100 if metric == 'accuracy' else v for v in vals],
                            w * 0.85, label=exp['label'], color=color, alpha=0.85,
                            edgecolor='white', linewidth=0.5)
            for bar, v in zip(bars, vals):
                v_disp = v * 100 if metric == 'accuracy' else v
                ax.text(bar.get_x() + bar.get_width() / 2,
                        bar.get_height() + 0.5,
                        f'{v_disp:.1f}{"%" if metric=="accuracy" else ""}',
                        ha='center', va='bottom', fontsize=7.5)

        ax.set(title=mlabel,
               ylabel=f'{mlabel} (%)' if metric == 'accuracy' else mlabel,
               xticks=x, xticklabels=h_labels)
        ax.set_ylim(0, 115 if metric == 'accuracy' else 1.15)
        ax.tick_params(axis='x', labelsize=8)
        ax.legend(framealpha=0.9, fontsize=8)

    fig.suptitle('Per-Hospital Performance — Final Round (FedAvg vs FedProx)',
                 fontsize=13, y=1.01)
    fig.tight_layout()
    fig.savefig(FIGS / 'fig3_per_hospital.png', dpi=DPI, bbox_inches='tight')
    plt.close(fig)
    print('  ✓ fig3_per_hospital.png')


# ══════════════════════════════════════════════════════════════════════════════
# Fig 4 — μ Sensitivity (dual axis)
# ══════════════════════════════════════════════════════════════════════════════
def fig4_mu_sensitivity(data):
    sweep = data.get('mu_sweep', [])
    if not sweep:
        return
    mus  = [s['mu'] for s in sweep]
    accs = [s['accuracy'] * 100 for s in sweep]
    aucs = [s['auc_roc'] for s in sweep]
    f1s  = [s['f1'] for s in sweep]
    x    = list(range(len(mus)))

    fig, ax1 = plt.subplots(figsize=(10, 5))
    ax2 = ax1.twinx()

    l1, = ax1.plot(x, accs, '-o', color='#1E88E5', lw=2.2, ms=7, label='Accuracy (%)', zorder=3)
    l2, = ax2.plot(x, aucs, '--s', color='#FB8C00', lw=2.2, ms=7, label='AUC-ROC', zorder=3)
    l3, = ax2.plot(x, f1s,  ':^',  color='#43A047', lw=2.0, ms=7, label='F1-Score', zorder=3)

    # best μ
    best_i = int(np.argmax(accs))
    ax1.axvline(best_i, color='gray', ls='--', lw=1, alpha=0.6)
    ax1.annotate(f'Optimal μ={mus[best_i]}',
                 xy=(best_i, accs[best_i]),
                 xytext=(best_i + 0.3, accs[best_i] - 3),
                 fontsize=9, color='gray',
                 arrowprops=dict(arrowstyle='->', color='gray', lw=1))

    ax1.set_xlabel('Proximal Regularization Strength (μ)')
    ax1.set_ylabel('Accuracy (%)', color='#1E88E5')
    ax2.set_ylabel('AUC-ROC / F1-Score', color='#555')
    ax1.set_xticks(x)
    ax1.set_xticklabels([str(m) for m in mus])
    ax1.set_ylim(50, 100)
    ax2.set_ylim(0.4, 1.0)
    ax1.set_title('FedProx — Hyperparameter Sensitivity Analysis (μ)', fontsize=13)

    lines = [l1, l2, l3]
    ax1.legend(lines, [l.get_label() for l in lines], loc='lower right', framealpha=0.9)
    ax1.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(FIGS / 'fig4_mu_sensitivity.png', dpi=DPI, bbox_inches='tight')
    plt.close(fig)
    print('  ✓ fig4_mu_sensitivity.png')


# ══════════════════════════════════════════════════════════════════════════════
# Fig 5 — Dataset class distribution
# ══════════════════════════════════════════════════════════════════════════════
def fig5_dataset_dist(data):
    ds_list = data['dataset_info']['datasets']
    names   = [d['name'].replace(' (', '\n(') for d in ds_list]
    benign  = [d['benign'] for d in ds_list]
    malign  = [d['malignant'] for d in ds_list]
    totals  = [d['count'] for d in ds_list]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

    # ── Left: grouped bar ──
    x = np.arange(len(names))
    w = 0.35
    ax1.bar(x - w/2, benign, w, label='Benign',    color=PALETTE['Benign'],    alpha=0.85, edgecolor='white')
    ax1.bar(x + w/2, malign, w, label='Malignant', color=PALETTE['Malignant'], alpha=0.85, edgecolor='white')
    for i, (b, m) in enumerate(zip(benign, malign)):
        ax1.text(i - w/2, b + 80, str(b), ha='center', fontsize=8)
        ax1.text(i + w/2, m + 80, str(m), ha='center', fontsize=8)
    ax1.set(xticks=x, xticklabels=names, ylabel='Image Count',
            title='Class Distribution per Dataset')
    ax1.legend(framealpha=0.9)
    ax1.tick_params(axis='x', labelsize=8)

    # ── Right: stacked horizontal bar ──
    y = np.arange(len(names))
    bx = [b / t * 100 for b, t in zip(benign, totals)]
    mx = [m / t * 100 for m, t in zip(malign, totals)]
    ax2.barh(y, bx, color=PALETTE['Benign'],    alpha=0.85, label='Benign',    edgecolor='white')
    ax2.barh(y, mx, left=bx, color=PALETTE['Malignant'], alpha=0.85, label='Malignant', edgecolor='white')
    for i, (b, m, t) in enumerate(zip(bx, mx, totals)):
        ax2.text(b / 2,      i, f'{b:.0f}%', ha='center', va='center', fontsize=8, color='white', fontweight='bold')
        ax2.text(b + m / 2,  i, f'{m:.0f}%', ha='center', va='center', fontsize=8, color='white', fontweight='bold')
        ax2.text(101, i, f'n={t:,}', ha='left', va='center', fontsize=8)
    ax2.set(yticks=y, yticklabels=names, xlabel='Percentage (%)',
            title='Class Balance (%) per Dataset')
    ax2.set_xlim(0, 115)
    ax2.legend(framealpha=0.9)
    ax2.tick_params(axis='y', labelsize=8)

    fig.suptitle('Dataset Overview — 19,155 Histopathology Images Across 3 Sites',
                 fontsize=13, y=1.01)
    fig.tight_layout()
    fig.savefig(FIGS / 'fig5_dataset_dist.png', dpi=DPI, bbox_inches='tight')
    plt.close(fig)
    print('  ✓ fig5_dataset_dist.png')


# ══════════════════════════════════════════════════════════════════════════════
# Fig 6 — Federated vs Standalone comparison
# ══════════════════════════════════════════════════════════════════════════════
def fig6_federated_vs_standalone(data):
    standalone = data.get('standalone', {})
    experiments = data['experiments']
    if not standalone:
        print('  ⚠ No standalone data — skipping fig6')
        return

    h_keys   = list(standalone.keys())
    h_labels = [k.replace('\n', '\n') for k in h_keys]
    metrics  = ['accuracy', 'auc_roc', 'f1']
    mlabels  = ['Accuracy', 'AUC-ROC', 'F1-Score']

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    colors = [PALETTE['Standalone'], PALETTE['FedAvg'], PALETTE['FedProx']]
    labels_group = ['Standalone', 'FedAvg', 'FedProx']

    for ax, metric, mlabel in zip(axes, metrics, mlabels):
        x = np.arange(len(h_keys))
        w = 0.22
        offsets = [-w, 0, w]
        all_vals_group = [
            [standalone[h][metric] for h in h_keys],
            [experiments[0]['rounds'][-1]['hospitals'][h][metric] for h in h_keys],
            [experiments[1]['rounds'][-1]['hospitals'][h][metric] for h in h_keys],
        ]
        for off, vals, color, lbl in zip(offsets, all_vals_group, colors, labels_group):
            bars = ax.bar(x + off, [v * 100 if metric == 'accuracy' else v for v in vals],
                          w * 0.9, label=lbl, color=color, alpha=0.85, edgecolor='white')
            for bar, v in zip(bars, vals):
                v_d = v * 100 if metric == 'accuracy' else v
                ax.text(bar.get_x() + bar.get_width() / 2,
                        bar.get_height() + 0.3,
                        f'{v_d:.1f}',
                        ha='center', va='bottom', fontsize=7)
        ax.set(title=mlabel,
               ylabel=f'{mlabel} (%)' if metric == 'accuracy' else mlabel,
               xticks=x, xticklabels=h_labels)
        ax.set_ylim(0, 115 if metric == 'accuracy' else 1.15)
        ax.tick_params(axis='x', labelsize=8)
        ax.legend(framealpha=0.9, fontsize=8)

    fig.suptitle('Federated Learning vs Standalone — Per-Hospital Comparison',
                 fontsize=13, y=1.01)
    fig.tight_layout()
    fig.savefig(FIGS / 'fig6_fl_vs_standalone.png', dpi=DPI, bbox_inches='tight')
    plt.close(fig)
    print('  ✓ fig6_fl_vs_standalone.png')


# ══════════════════════════════════════════════════════════════════════════════
# Fig 7 — Training loss per hospital over rounds
# ══════════════════════════════════════════════════════════════════════════════
def fig7_hospital_train_loss(data):
    experiments = data['experiments']
    h_keys = list(experiments[0]['rounds'][-1]['hospitals'].keys())
    h_labels = [k.replace('\n', ' ') for k in h_keys]

    site_colors = ['#8E24AA', '#00ACC1', '#F4511E']

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    for ax, exp in zip(axes, experiments):
        lbl = label_short(exp['label'])
        rnds = [r['round'] for r in exp['rounds']]
        for h, color, hlbl in zip(h_keys, site_colors, h_labels):
            losses = [r['hospitals'][h]['train_loss'] for r in exp['rounds']]
            ax.plot(rnds, losses, '-o', color=color, lw=2.0, ms=5, label=hlbl, alpha=0.9)
        ax.set(xlabel='Communication Round', ylabel='Local Training Loss',
               title=f'{exp["label"]} — Per-Hospital Training Loss')
        ax.legend(framealpha=0.9, fontsize=9)

    fig.suptitle('Local Training Loss per Hospital Site Over Communication Rounds',
                 fontsize=13, y=1.01)
    fig.tight_layout()
    fig.savefig(FIGS / 'fig7_hospital_loss.png', dpi=DPI, bbox_inches='tight')
    plt.close(fig)
    print('  ✓ fig7_hospital_loss.png')


# ══════════════════════════════════════════════════════════════════════════════
# Fig 8 — Summary comparison radar / bar
# ══════════════════════════════════════════════════════════════════════════════
def fig8_final_summary(data):
    mi  = data['model_info']
    exps = data['experiments']
    fa_final = exps[0]['rounds'][-1]['global']
    fp_final = exps[1]['rounds'][-1]['global']
    cent = {'accuracy': mi['centralized_test_acc'], 'auc_roc': mi['centralized_auc'],
            'f1': mi['centralized_f1'], 'sensitivity': mi['centralized_sensitivity'],
            'specificity': mi['centralized_specificity']}

    metrics = ['accuracy', 'auc_roc', 'f1', 'sensitivity', 'specificity']
    mlabels = ['Accuracy', 'AUC-ROC', 'F1', 'Sensitivity', 'Specificity']

    vals = {
        'Centralized\n(Reference)': [cent[m] for m in metrics],
        'FedAvg':  [fa_final.get(m, 0) for m in metrics],
        'FedProx': [fp_final.get(m, 0) for m in metrics],
    }

    x   = np.arange(len(metrics))
    w   = 0.22
    fig, ax = plt.subplots(figsize=(12, 5))
    offsets = [-w, 0, w]
    grp_colors = ['#7B1FA2', PALETTE['FedAvg'], PALETTE['FedProx']]
    for off, (lbl, v), col in zip(offsets, vals.items(), grp_colors):
        bars = ax.bar(x + off, v, w * 0.9, label=lbl, color=col, alpha=0.85, edgecolor='white')
        for bar, val in zip(bars, v):
            ax.text(bar.get_x() + bar.get_width() / 2,
                    bar.get_height() + 0.005,
                    f'{val:.3f}', ha='center', va='bottom', fontsize=7.5)
    ax.set(xticks=x, xticklabels=mlabels, ylabel='Score',
           title='Final Model Performance — Centralized vs FedAvg vs FedProx')
    ax.set_ylim(0, 1.12)
    ax.legend(framealpha=0.9)
    fig.tight_layout()
    fig.savefig(FIGS / 'fig8_final_summary.png', dpi=DPI, bbox_inches='tight')
    plt.close(fig)
    print('  ✓ fig8_final_summary.png')


# ══════════════════════════════════════════════════════════════════════════════
# Fig 9 — Combined 4-panel overview
# ══════════════════════════════════════════════════════════════════════════════
def fig9_overview(data):
    fig = plt.figure(figsize=(16, 12))
    gs  = GridSpec(2, 2, figure=fig, hspace=0.38, wspace=0.3)
    ax_acc = fig.add_subplot(gs[0, 0])
    ax_auc = fig.add_subplot(gs[0, 1])
    ax_mu  = fig.add_subplot(gs[1, 0])
    ax_ds  = fig.add_subplot(gs[1, 1])

    # ── accuracy convergence ──
    for exp in data['experiments']:
        lbl   = label_short(exp['label'])
        color = PALETTE[lbl]
        rs    = exp['rounds']
        rnds  = [r['round'] for r in rs]
        accs  = [r['global']['accuracy'] * 100 for r in rs]
        ls    = '-o' if lbl == 'FedProx' else '--s'
        ax_acc.plot(rnds, accs, ls, color=color, lw=2, ms=4, label=exp['label'])
    ax_acc.axhline(data['model_info']['centralized_test_acc'] * 100,
                   color='#7B1FA2', ls=':', lw=1.5, label='Centralized')
    ax_acc.set(xlabel='Round', ylabel='Accuracy (%)', title='(A) Accuracy Convergence')
    ax_acc.set_ylim(40, 100); ax_acc.legend(fontsize=8)

    # ── AUC convergence ──
    for exp in data['experiments']:
        lbl   = label_short(exp['label'])
        color = PALETTE[lbl]
        rs    = exp['rounds']
        rnds  = [r['round'] for r in rs]
        aucs  = [r['global']['auc_roc'] for r in rs]
        ls    = '-o' if lbl == 'FedProx' else '--s'
        ax_auc.plot(rnds, aucs, ls, color=color, lw=2, ms=4, label=exp['label'])
    ax_auc.axhline(data['model_info']['centralized_auc'],
                   color='#7B1FA2', ls=':', lw=1.5, label='Centralized')
    ax_auc.set(xlabel='Round', ylabel='AUC-ROC', title='(B) AUC-ROC Convergence')
    ax_auc.set_ylim(0.4, 1.02); ax_auc.legend(fontsize=8)

    # ── μ sensitivity ──
    sweep = data.get('mu_sweep', [])
    if sweep:
        mus  = [s['mu'] for s in sweep]
        accs = [s['accuracy'] * 100 for s in sweep]
        x    = list(range(len(mus)))
        ax_mu.plot(x, accs, '-o', color='#1E88E5', lw=2, ms=6)
        ax_mu.set(xticks=x, xticklabels=[str(m) for m in mus],
                  xlabel='μ', ylabel='Final Accuracy (%)', title='(C) μ Sensitivity')
        ax_mu.tick_params(axis='x', labelsize=8)

    # ── dataset distribution ──
    ds_list = data['dataset_info']['datasets']
    names   = [d['name'].split('(')[0].strip() for d in ds_list]
    benign  = [d['benign'] for d in ds_list]
    malign  = [d['malignant'] for d in ds_list]
    x = np.arange(len(names))
    w = 0.35
    ax_ds.bar(x - w/2, benign, w, label='Benign',    color=PALETTE['Benign'],    alpha=0.85)
    ax_ds.bar(x + w/2, malign, w, label='Malignant', color=PALETTE['Malignant'], alpha=0.85)
    ax_ds.set(xticks=x, xticklabels=names, ylabel='Images',
              title='(D) Dataset Distribution')
    ax_ds.legend(fontsize=8)

    fig.suptitle('FedProx vs FedAvg — Breast Cancer Histopathology FL Research Overview',
                 fontsize=15, y=1.01)
    fig.savefig(FIGS / 'fig9_overview.png', dpi=DPI, bbox_inches='tight')
    plt.close(fig)
    print('  ✓ fig9_overview.png')


# ══════════════════════════════════════════════════════════════════════════════
def main():
    print('=' * 55)
    print('  Generating Publication-Quality Research Figures')
    print('=' * 55)

    if not DATA.exists():
        print(f'ERROR: {DATA} not found. Run fedprox_experiment.py first.')
        sys.exit(1)

    data = load()
    fig1_convergence(data)
    fig2_auc_f1(data)
    fig3_per_hospital(data)
    fig4_mu_sensitivity(data)
    fig5_dataset_dist(data)
    fig6_federated_vs_standalone(data)
    fig7_hospital_train_loss(data)
    fig8_final_summary(data)
    fig9_overview(data)
    print(f'\n✓ All 9 figures saved in {FIGS}/')


if __name__ == '__main__':
    main()
