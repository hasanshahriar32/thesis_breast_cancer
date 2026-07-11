#!/usr/bin/env python3
"""
Generate Publication-Quality Plots for FedProx vs FedAvg Experiment
===================================================================

Reads experiment_results.json and produces:
  1. convergence_accuracy.png    — Accuracy convergence curves (all methods)
  2. convergence_loss.png        — Loss convergence curves
  3. convergence_auc.png         — AUC-ROC convergence curves
  4. final_metrics_comparison.png — Bar chart of final metrics
  5. mu_sensitivity.png          — μ sensitivity analysis
  6. hospital_performance.png    — Per-hospital breakdown
  7. proximal_loss_analysis.png  — Proximal vs CE loss decomposition
"""

import os
import sys
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import seaborn as sns

# ============================================================================
# Style Configuration (publication quality)
# ============================================================================
plt.rcParams.update({
    'figure.figsize': (10, 6),
    'figure.dpi': 150,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'font.size': 12,
    'font.family': 'serif',
    'axes.titlesize': 14,
    'axes.labelsize': 13,
    'xtick.labelsize': 11,
    'ytick.labelsize': 11,
    'legend.fontsize': 11,
    'lines.linewidth': 2.0,
    'lines.markersize': 6,
    'grid.alpha': 0.3,
    'axes.grid': True,
})

# Color palette
COLORS = {
    'FedAvg': '#E74C3C',              # Red
    'FedProx_mu0.001': '#3498DB',     # Blue
    'FedProx_mu0.01': '#2ECC71',      # Green
    'FedProx_mu0.1': '#9B59B6',       # Purple
    'FedProx_mu0.5': '#F39C12',       # Orange
    'FedProx_mu1.0': '#1ABC9C',       # Teal
}

MARKERS = {
    'FedAvg': 'o',
    'FedProx_mu0.001': 's',
    'FedProx_mu0.01': '^',
    'FedProx_mu0.1': 'D',
    'FedProx_mu0.5': 'v',
    'FedProx_mu1.0': 'P',
}

LABELS = {
    'FedAvg': 'FedAvg (baseline)',
    'FedProx_mu0.001': 'FedProx (μ=0.001)',
    'FedProx_mu0.01': 'FedProx (μ=0.01)',
    'FedProx_mu0.1': 'FedProx (μ=0.1)',
    'FedProx_mu0.5': 'FedProx (μ=0.5)',
    'FedProx_mu1.0': 'FedProx (μ=1.0)',
}


def load_results(result_dir):
    path = os.path.join(result_dir, 'data', 'experiment_results.json')
    with open(path, 'r') as f:
        return json.load(f)


def plot_convergence_accuracy(results, output_dir):
    """Plot accuracy convergence curves for all methods."""
    fig, ax = plt.subplots(figsize=(10, 6))
    
    for key, result in results.items():
        rounds = [r['round'] for r in result['rounds']]
        accs = [r['global_accuracy'] for r in result['rounds']]
        ax.plot(rounds, accs,
                color=COLORS.get(key, '#333'),
                marker=MARKERS.get(key, 'o'),
                label=LABELS.get(key, key),
                markevery=1,
                linewidth=2.5 if key == 'FedAvg' else 1.8,
                linestyle='--' if key == 'FedAvg' else '-')
    
    ax.set_xlabel('Communication Round')
    ax.set_ylabel('Global Model Accuracy (%)')
    ax.set_title('FedProx vs FedAvg: Accuracy Convergence\n(Non-IID Data across 3 Hospitals)')
    ax.legend(loc='lower right', framealpha=0.9)
    ax.xaxis.set_major_locator(ticker.MaxNLocator(integer=True))
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'convergence_accuracy.png'))
    plt.close()
    print("  ✓ convergence_accuracy.png")


def plot_convergence_loss(results, output_dir):
    """Plot loss convergence curves."""
    fig, ax = plt.subplots(figsize=(10, 6))
    
    for key, result in results.items():
        rounds = [r['round'] for r in result['rounds']]
        losses = [r['avg_loss'] for r in result['rounds']]
        ax.plot(rounds, losses,
                color=COLORS.get(key, '#333'),
                marker=MARKERS.get(key, 'o'),
                label=LABELS.get(key, key),
                markevery=1,
                linewidth=2.5 if key == 'FedAvg' else 1.8,
                linestyle='--' if key == 'FedAvg' else '-')
    
    ax.set_xlabel('Communication Round')
    ax.set_ylabel('Average Training Loss')
    ax.set_title('FedProx vs FedAvg: Training Loss Convergence\n(Non-IID Data across 3 Hospitals)')
    ax.legend(loc='upper right', framealpha=0.9)
    ax.xaxis.set_major_locator(ticker.MaxNLocator(integer=True))
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'convergence_loss.png'))
    plt.close()
    print("  ✓ convergence_loss.png")


def plot_convergence_auc(results, output_dir):
    """Plot AUC-ROC convergence curves."""
    fig, ax = plt.subplots(figsize=(10, 6))
    
    for key, result in results.items():
        rounds = [r['round'] for r in result['rounds']]
        aucs = [r['global_auc'] for r in result['rounds']]
        ax.plot(rounds, aucs,
                color=COLORS.get(key, '#333'),
                marker=MARKERS.get(key, 'o'),
                label=LABELS.get(key, key),
                markevery=1,
                linewidth=2.5 if key == 'FedAvg' else 1.8,
                linestyle='--' if key == 'FedAvg' else '-')
    
    ax.set_xlabel('Communication Round')
    ax.set_ylabel('AUC-ROC Score')
    ax.set_title('FedProx vs FedAvg: AUC-ROC Convergence\n(Non-IID Data across 3 Hospitals)')
    ax.legend(loc='lower right', framealpha=0.9)
    ax.xaxis.set_major_locator(ticker.MaxNLocator(integer=True))
    ax.set_ylim(0.4, 1.02)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'convergence_auc.png'))
    plt.close()
    print("  ✓ convergence_auc.png")


def plot_final_metrics_comparison(results, output_dir):
    """Bar chart comparing final metrics of all methods."""
    metrics = ['accuracy', 'auc_roc', 'sensitivity', 'specificity', 'f1_score']
    metric_labels = ['Accuracy (%)', 'AUC-ROC', 'Sensitivity', 'Specificity', 'F1-Score']
    
    fig, axes = plt.subplots(1, 5, figsize=(20, 5))
    
    methods = list(results.keys())
    x = np.arange(len(methods))
    colors = [COLORS.get(m, '#333') for m in methods]
    labels = [LABELS.get(m, m) for m in methods]
    
    for i, (metric, mlabel) in enumerate(zip(metrics, metric_labels)):
        values = []
        for m in methods:
            val = results[m]['final_metrics'][metric]
            if metric == 'accuracy':
                values.append(val)
            else:
                values.append(val * 100 if val <= 1.0 else val)
        
        bars = axes[i].bar(x, values, color=colors, width=0.6, edgecolor='white', linewidth=0.5)
        axes[i].set_title(mlabel, fontweight='bold')
        axes[i].set_xticks(x)
        axes[i].set_xticklabels([f'μ={results[m]["mu"]}' if m != 'FedAvg' else 'FedAvg'
                                  for m in methods], rotation=45, ha='right', fontsize=9)
        
        # Add value labels on bars
        for bar, val in zip(bars, values):
            axes[i].text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.5,
                        f'{val:.1f}', ha='center', va='bottom', fontsize=8)
    
    fig.suptitle('FedProx vs FedAvg: Final Model Performance Comparison', 
                 fontsize=15, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'final_metrics_comparison.png'))
    plt.close()
    print("  ✓ final_metrics_comparison.png")


def plot_mu_sensitivity(results, output_dir):
    """Plot showing how μ affects each metric (sensitivity analysis)."""
    fedprox_keys = [k for k in results if k != 'FedAvg']
    mu_values = [results[k]['mu'] for k in fedprox_keys]
    
    metrics = {
        'Accuracy (%)': [results[k]['final_metrics']['accuracy'] for k in fedprox_keys],
        'AUC-ROC (×100)': [results[k]['final_metrics']['auc_roc'] * 100 for k in fedprox_keys],
        'Sensitivity (×100)': [results[k]['final_metrics']['sensitivity'] * 100 for k in fedprox_keys],
        'Specificity (×100)': [results[k]['final_metrics']['specificity'] * 100 for k in fedprox_keys],
    }
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    line_colors = ['#3498DB', '#E74C3C', '#2ECC71', '#9B59B6']
    markers = ['o', 's', '^', 'D']
    
    for i, (name, values) in enumerate(metrics.items()):
        ax.plot(range(len(mu_values)), values,
                color=line_colors[i], marker=markers[i],
                label=name, linewidth=2, markersize=8)
    
    # Add FedAvg baselines as horizontal dashed lines
    baseline = results['FedAvg']['final_metrics']
    ax.axhline(y=baseline['accuracy'], color='#E74C3C', linestyle=':', alpha=0.5, label='FedAvg Accuracy')
    ax.axhline(y=baseline['auc_roc'] * 100, color='#3498DB', linestyle=':', alpha=0.5)
    
    ax.set_xlabel('Proximal Parameter (μ)')
    ax.set_ylabel('Score')
    ax.set_title('FedProx: Effect of Proximal Parameter μ on Performance')
    ax.set_xticks(range(len(mu_values)))
    ax.set_xticklabels([str(m) for m in mu_values])
    ax.legend(loc='best', framealpha=0.9)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'mu_sensitivity.png'))
    plt.close()
    print("  ✓ mu_sensitivity.png")


def plot_hospital_performance(results, output_dir):
    """Per-hospital performance breakdown in the final round."""
    # Get the best FedProx and FedAvg results
    best_fedprox_key = max(
        [k for k in results if k != 'FedAvg'],
        key=lambda k: results[k]['final_metrics']['accuracy']
    )
    
    methods = ['FedAvg', best_fedprox_key]
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    for idx, method_key in enumerate(methods):
        result = results[method_key]
        last_round = result['rounds'][-1]
        hospitals = last_round['hospitals']
        
        names = [h['hospital'].split(' ')[0] for h in hospitals]  # Short names
        accs = [h['accuracy'] for h in hospitals]
        losses = [h['loss'] for h in hospitals]
        
        x = np.arange(len(names))
        
        color = '#E74C3C' if method_key == 'FedAvg' else '#2ECC71'
        bars = axes[idx].bar(x, accs, color=color, width=0.5, edgecolor='white')
        
        for bar, acc in zip(bars, accs):
            axes[idx].text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.5,
                          f'{acc:.1f}%', ha='center', va='bottom', fontsize=10)
        
        axes[idx].set_xlabel('Hospital')
        axes[idx].set_ylabel('Local Training Accuracy (%)')
        axes[idx].set_title(f'{LABELS.get(method_key, method_key)}\n(Final Round)', fontweight='bold')
        axes[idx].set_xticks(x)
        axes[idx].set_xticklabels(names)
        axes[idx].set_ylim(0, 105)
    
    fig.suptitle('Per-Hospital Performance: FedAvg vs Best FedProx', 
                 fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'hospital_performance.png'))
    plt.close()
    print("  ✓ hospital_performance.png")


def plot_proximal_loss_analysis(results, output_dir):
    """Show decomposition of total loss into CE loss + proximal loss."""
    fedprox_keys = [k for k in results if k != 'FedAvg' and results[k]['mu'] > 0]
    
    if not fedprox_keys:
        return
    
    fig, axes = plt.subplots(1, min(len(fedprox_keys), 3), figsize=(15, 5))
    if not hasattr(axes, '__len__'):
        axes = [axes]
    
    selected_keys = [k for k in fedprox_keys if results[k]['mu'] in [0.01, 0.1, 0.5]]
    if not selected_keys:
        selected_keys = fedprox_keys[:3]
    
    for idx, key in enumerate(selected_keys):
        if idx >= len(axes):
            break
        result = results[key]
        rounds = [r['round'] for r in result['rounds']]
        ce_losses = [r['avg_ce_loss'] for r in result['rounds']]
        prox_losses = [r['avg_prox_loss'] for r in result['rounds']]
        total_losses = [r['avg_loss'] for r in result['rounds']]
        
        axes[idx].fill_between(rounds, 0, ce_losses, alpha=0.4, color='#3498DB', label='CE Loss')
        axes[idx].fill_between(rounds, ce_losses, total_losses, alpha=0.4, color='#E74C3C', label='Proximal Loss')
        axes[idx].plot(rounds, total_losses, color='#2C3E50', linewidth=2, label='Total Loss')
        
        axes[idx].set_xlabel('Communication Round')
        axes[idx].set_ylabel('Loss')
        axes[idx].set_title(f'μ = {result["mu"]}', fontweight='bold')
        axes[idx].legend(fontsize=9)
        axes[idx].xaxis.set_major_locator(ticker.MaxNLocator(integer=True))
    
    fig.suptitle('FedProx: Loss Decomposition (Cross-Entropy + Proximal Term)', 
                 fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'proximal_loss_analysis.png'))
    plt.close()
    print("  ✓ proximal_loss_analysis.png")


def generate_summary_table(results, output_dir):
    """Generate a LaTeX-formatted table for the paper."""
    table_lines = []
    table_lines.append("% Auto-generated comparison table for journal paper")
    table_lines.append("\\begin{table}[htbp]")
    table_lines.append("\\centering")
    table_lines.append("\\caption{Performance Comparison: FedAvg vs FedProx with Different $\\mu$ Values}")
    table_lines.append("\\label{tab:fedprox_results}")
    table_lines.append("\\begin{tabular}{lccccc}")
    table_lines.append("\\hline")
    table_lines.append("\\textbf{Method} & \\textbf{Accuracy (\\%)} & \\textbf{AUC-ROC} & "
                       "\\textbf{Sensitivity} & \\textbf{Specificity} & \\textbf{F1-Score} \\\\")
    table_lines.append("\\hline")
    
    best_acc = max(r['final_metrics']['accuracy'] for r in results.values())
    
    for key, result in results.items():
        fm = result['final_metrics']
        name = result['algorithm'].replace('μ', '$\\mu$')
        acc = fm['accuracy']
        auc = fm['auc_roc']
        sens = fm['sensitivity']
        spec = fm['specificity']
        f1 = fm['f1_score']
        
        # Bold the best accuracy
        acc_str = f"\\textbf{{{acc:.2f}}}" if abs(acc - best_acc) < 0.01 else f"{acc:.2f}"
        
        table_lines.append(f"{name} & {acc_str} & {auc:.4f} & {sens:.4f} & {spec:.4f} & {f1:.4f} \\\\")
    
    table_lines.append("\\hline")
    table_lines.append("\\end{tabular}")
    table_lines.append("\\end{table}")
    
    path = os.path.join(output_dir, 'comparison_table.tex')
    with open(path, 'w') as f:
        f.write('\n'.join(table_lines))
    print(f"  ✓ comparison_table.tex")


def main():
    result_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    figures_dir = os.path.join(result_dir, 'figures')
    tables_dir = os.path.join(result_dir, 'tables')
    os.makedirs(figures_dir, exist_ok=True)
    os.makedirs(tables_dir, exist_ok=True)
    
    print("Loading experiment results...")
    results = load_results(result_dir)
    print(f"  Found {len(results)} experiment configurations\n")
    
    print("Generating publication-quality figures...")
    plot_convergence_accuracy(results, figures_dir)
    plot_convergence_loss(results, figures_dir)
    plot_convergence_auc(results, figures_dir)
    plot_final_metrics_comparison(results, figures_dir)
    plot_mu_sensitivity(results, figures_dir)
    plot_hospital_performance(results, figures_dir)
    plot_proximal_loss_analysis(results, figures_dir)
    
    print("\nGenerating tables...")
    generate_summary_table(results, tables_dir)
    
    print("\n✓ All figures and tables generated!")
    print(f"  Figures: {figures_dir}/")
    print(f"  Tables:  {tables_dir}/")


if __name__ == '__main__':
    main()
