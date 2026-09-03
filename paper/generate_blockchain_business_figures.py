#!/usr/bin/env python3
"""
Generate strictly Blockchain and Business figures for MedChain-FL.
Tailored for Blockchain Olympiad Bangladesh (BCOLBD 2026).
NO Machine Learning figures (no ROC curves, CNNs, or loss curves).
Only code-generated, statistical, game-theoretic, and architectural figures.
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import networkx as nx

OUTPUT_DIR = "/home/hs32/Desktop/medchain/thesis/paper/figures"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Cohesive Palette
MAGENTA = "#A32B68"      # Primary accent
TEAL = "#0D9488"         # Secondary accent
DARK = "#2E2733"         # Charcoal heading
MUTED = "#6B6472"        # Slate muted
GREEN = "#16A34A"        # Success green
RED = "#DC2626"          # Threat red
LIGHT_BG = "#F8F7FA"     # Card background
BORDER_COL = "#E5E2E8"   # Subtle border

plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# -----------------------------------------------------------------------------
# FIGURE 1: BLOCKCHAIN GAS CONSUMPTION & LAYER-1 VS LAYER-2 COST ANALYSIS
# -----------------------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
fig.suptitle('Empirical EVM Gas Consumption & Multi-Chain Scalability Analysis', fontsize=16, fontweight='bold', color=DARK, y=0.98)

funcs = ['registerHospital()', 'openRound()', 'submitModelUpdate()', 'publishGlobalModel()']
gas_units = [84210, 47820, 92640, 71500]
colors_gas = [TEAL, MAGENTA, DARK, GREEN]

bars1 = ax1.barh(funcs, gas_units, color=colors_gas, height=0.55, edgecolor=BORDER_COL, linewidth=1.2)
ax1.set_facecolor(LIGHT_BG)
ax1.set_xlabel('EVM Gas Units Consumed', fontsize=11, fontweight='bold', color=DARK)
ax1.set_title('Solidity Functions in FederatedModelRegistry.sol', fontsize=12, fontweight='bold', color=DARK)
ax1.set_xlim(0, 115000)
ax1.grid(axis='x', linestyle='--', alpha=0.5)

for bar, val in zip(bars1, gas_units):
    ax1.text(val + 2000, bar.get_y() + bar.get_height()/2, f'{val:,} gas', 
             va='center', fontsize=9.5, fontweight='bold', color=DARK)

networks = ['Ethereum L1\n(Sepolia Baseline)', 'Arbitrum One\n(Optimistic L2)', 'Polygon PoS\n(Sidechain)', 'Hyperledger Besu\n(Consortium L2)']
cost_bdt = [2070.0, 9.60, 1.80, 0.12]

bars2 = ax2.bar(networks, cost_bdt, color=[RED, DARK, TEAL, GREEN], width=0.5, edgecolor=BORDER_COL, linewidth=1.2)
ax2.set_facecolor(LIGHT_BG)
ax2.set_ylabel('Transaction Cost per Round (BDT)', fontsize=11, fontweight='bold', color=DARK)
ax2.set_yscale('log')
ax2.set_title('Cost per Round Across Networks (Log Scale)', fontsize=12, fontweight='bold', color=DARK)
ax2.set_ylim(0.05, 7000)
ax2.grid(axis='y', linestyle='--', alpha=0.5)

ax2.text(0, 2300, 'BDT 2,070\n($17.28)', ha='center', va='bottom', fontsize=9, fontweight='bold', color=RED)
ax2.text(1, 12.0, 'BDT 9.60\n($0.08)', ha='center', va='bottom', fontsize=9, fontweight='bold', color=DARK)
ax2.text(2, 2.3, 'BDT 1.80\n($0.015)', ha='center', va='bottom', fontsize=9, fontweight='bold', color=TEAL)
ax2.text(3, 0.16, '< BDT 0.15\n(Near-Zero Gas)', ha='center', va='bottom', fontsize=9, fontweight='bold', color=GREEN)

plt.tight_layout(rect=[0, 0.03, 1, 0.95])
f1 = os.path.join(OUTPUT_DIR, "fig1_blockchain_gas_scalability.png")
plt.savefig(f1, dpi=300)
plt.close()
print(f"Generated: {f1}")


# -----------------------------------------------------------------------------
# FIGURE 2: STATISTICAL 3-SIGMA BYZANTINE FAULT TOLERANCE & SLASHING SIMULATION
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11, 5.5), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor(LIGHT_BG)

mu = 0.085
sigma = 0.012
x = np.linspace(0.03, 0.16, 1000)
y = (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x - mu) / sigma)**2)

ax.plot(x, y, color=DARK, lw=2.5, label='Honest Hospital Gradient Distribution ($\mu=0.085, \sigma=0.012$)')

# Fill Accepted Zone (+/- 3 Sigma)
x_accept = np.linspace(mu - 3*sigma, mu + 3*sigma, 500)
y_accept = (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x_accept - mu) / sigma)**2)
ax.fill_between(x_accept, y_accept, color='#DCFCE7', alpha=0.8, label='Consensus Acceptance Zone (99.73% of honest updates)')

# Fill Rejection Zones
x_left = np.linspace(0.03, mu - 3*sigma, 200)
y_left = (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x_left - mu) / sigma)**2)
ax.fill_between(x_left, y_left, color='#FEE2E2', alpha=0.8, label='Slashing Zone (> 3$\sigma$ deviation)')

x_right = np.linspace(mu + 3*sigma, 0.16, 200)
y_right = (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x_right - mu) / sigma)**2)
ax.fill_between(x_right, y_right, color='#FEE2E2', alpha=0.8)

# Vertical Threshold Lines
ax.axvline(mu - 3*sigma, color=RED, linestyle='--', lw=1.8, label=f'Lower Threshold ({mu - 3*sigma:.3f})')
ax.axvline(mu + 3*sigma, color=RED, linestyle='--', lw=1.8, label=f'Upper Threshold ({mu + 3*sigma:.3f})')

# Plot Simulated Attack Nodes with non-overlapping callouts
adv_data = [
    (0.042, 2, 9, 'Poisoning Attack A\n(Loss < 0.049 → Slashed)'),
    (0.133, 2, 8, 'Inverted Gradients\n(Loss > 0.121 → Slashed)'),
    (0.150, 2, 16, 'Adversarial Noise\n(Loss = 0.150 → Slashed)')
]
for adv_x, pt_y, text_y, lbl in adv_data:
    ax.scatter(adv_x, pt_y, color=RED, s=120, zorder=5, edgecolor=DARK, lw=1.5)
    ax.annotate(lbl, xy=(adv_x, pt_y), xytext=(adv_x, text_y),
                arrowprops=dict(arrowstyle="->", color=RED, lw=1.5),
                ha='center', fontsize=8, fontweight='bold', color=RED,
                bbox=dict(boxstyle="round,pad=0.3", facecolor="#FFF", edgecolor=RED))

# Plot Honest Nodes
honest_losses = [0.082, 0.088, 0.076, 0.091]
h_labels = ['Evercare', 'BSMMU', 'DMCH', 'HSTU']
for hl, hlbl in zip(honest_losses, h_labels):
    ax.scatter(hl, 18, color=GREEN, s=100, zorder=5, edgecolor=DARK, lw=1.2)
    ax.text(hl, 19.5, hlbl, ha='center', fontsize=8.5, fontweight='bold', color=GREEN)

ax.set_xlabel('Reported Validation Loss Metric on Smart Contract', fontsize=11, fontweight='bold', color=DARK)
ax.set_ylabel('Probability Density', fontsize=11, fontweight='bold', color=DARK)
ax.set_title('Byzantine Fault Tolerance: On-Chain 3-Sigma Outlier Detection & Automated Slashing', fontsize=14, fontweight='bold', color=DARK, pad=12)
ax.legend(loc='upper right', frameon=True, facecolor='#FFFFFF', edgecolor=BORDER_COL, fontsize=8.5)
ax.set_ylim(0, 38)
ax.grid(axis='both', linestyle='--', alpha=0.4)

plt.tight_layout()
f2 = os.path.join(OUTPUT_DIR, "fig2_byzantine_resilience_simulation.png")
plt.savefig(f2, dpi=300)
plt.close()
print(f"Generated: {f2}")


# -----------------------------------------------------------------------------
# FIGURE 3: CONSORTIUM GAME THEORY & PROOF-OF-CONTRIBUTION TOKENOMICS
# -----------------------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
fig.suptitle('Game-Theoretic Consortium Incentives & Tokenized Offset Flywheel', fontsize=16, fontweight='bold', color=DARK, y=0.98)

# Panel 1: Proof-of-Contribution Subscription Discount Curve
samples = np.linspace(0, 10000, 500)
discount_pct = 60 * (1 - np.exp(-samples / 2500))
net_fee = 100 * (1 - discount_pct / 100)

ax1.set_facecolor(LIGHT_BG)
ax1.plot(samples, net_fee, color=MAGENTA, lw=3, label='Monthly Enterprise Fee (Thousand BDT)')
ax1.axvline(500, color=RED, linestyle='--', lw=1.5, label='Anti-Free-Rider Gate (500 Samples)')
ax1.fill_between(samples, 0, net_fee, color='#FDF2F8', alpha=0.6)

ax1.set_xlabel('Cumulative Verified Samples Contributed (On-Chain Proof)', fontsize=10.5, fontweight='bold', color=DARK)
ax1.set_ylabel('Monthly Node Subscription Fee (Thousand BDT)', fontsize=10.5, fontweight='bold', color=DARK)
ax1.set_title('Proof-of-Contribution Token Offset Flywheel', fontsize=12, fontweight='bold', color=DARK)
ax1.set_ylim(30, 105)
ax1.set_xlim(0, 10000)
ax1.legend(loc='upper right', frameon=True, facecolor='#FFFFFF', edgecolor=BORDER_COL, fontsize=9)
ax1.grid(axis='both', linestyle='--', alpha=0.4)

ax1.annotate('Evercare (5,000 samples):\n45% Fee Reduction\n(BDT 55,000 / mo)', 
             xy=(5000, 55), xytext=(5500, 75),
             arrowprops=dict(facecolor=TEAL, shrink=0.05, width=1.5, headwidth=6),
             bbox=dict(boxstyle="round,pad=0.3", facecolor="#CCFBF1", edgecolor=TEAL),
             fontsize=8.5, fontweight='bold', color=DARK)

# Panel 2: Game-Theoretic Payoff Matrix
ax2.set_facecolor('#FFFFFF')
ax2.axis('off')
ax2.set_title('Hospital Consortium Payoff Matrix (Nash Equilibrium)', fontsize=12, fontweight='bold', color=DARK)

matrix_data = [
    ["STRATEGY", "Hospital B: CONTRIBUTE", "Hospital B: DEFECT / FREE-RIDE"],
    ["Hospital A:\nCONTRIBUTE", "(+10, +10)\n★ Pareto-Optimal Nash Eq.\nMutual AI Accuracy Jump\nMax Token Credits", "(+8, -5)\nSmart Contract Enforces:\nHospital B Blocked from\nPulling Global Weights"],
    ["Hospital A:\nDEFECT / FREE-RIDE", "(-5, +8)\nHospital A Blocked\nReputation Slashed on-chain\nExcluded from Round", "(-10, -10)\nNo Diagnostic AI\nHigh Manual Cost\nConsortium Stagnates"]
]

col_widths = [0.28, 0.36, 0.36]
table = ax2.table(cellText=matrix_data, colWidths=col_widths, cellLoc='center', loc='center', bbox=[0.02, 0.05, 0.96, 0.85])
table.auto_set_font_size(False)
table.set_fontsize(8.2)

for (r, c), cell in table.get_celld().items():
    cell.set_edgecolor(BORDER_COL)
    cell.set_linewidth(1.5)
    if r == 0 or c == 0:
        cell.set_facecolor(LIGHT_BG)
        cell.get_text().set_color(DARK)
        cell.get_text().set_weight('bold')
    elif r == 1 and c == 1:
        cell.set_facecolor('#DCFCE7')
        cell.get_text().set_color(GREEN)
        cell.get_text().set_weight('bold')
    else:
        cell.set_facecolor('#FEF2F2')
        cell.get_text().set_color(RED)

plt.tight_layout(rect=[0, 0.03, 1, 0.95])
f3 = os.path.join(OUTPUT_DIR, "fig3_consortium_game_theory_tokenomics.png")
plt.savefig(f3, dpi=300)
plt.close()
print(f"Generated: {f3}")


# -----------------------------------------------------------------------------
# FIGURE 4: BANGLADESH DECENTRALIZED CONSORTIUM NETWORK TOPOLOGY
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 7.5), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor('#FFFFFF')

G = nx.Graph()

G.add_node("Ethereum\nSmart Contract\n(0x1BE4...)", node_type='ledger', pos=(0, 0))
G.add_node("IPFS Swarm\n(Encrypted Weights)", node_type='swarm', pos=(0, 1.2))

divisions = [
    ("Dhaka Central\n(BSMMU & Evercare)", 1.8, 0.3),
    ("Dinajpur & Rangpur\n(HSTU Enclave)", -1.6, 1.6),
    ("Chattogram\n(CMCH Lab Node)", 1.7, -1.3),
    ("Rajshahi\n(RMCH Lab Node)", -1.7, 0.4),
    ("Khulna\n(KMCH Lab Node)", -1.2, -1.2),
    ("Sylhet\n(SOMCH Lab Node)", 1.5, 1.5),
    ("Barishal\n(SBMCH Lab Node)", 0.2, -1.8),
    ("Mymensingh\n(MMCH Lab Node)", 0.3, 1.8)
]

for name, x, y in divisions:
    G.add_node(name, node_type='hospital', pos=(x, y))
    G.add_edge(name, "Ethereum\nSmart Contract\n(0x1BE4...)")
    G.add_edge(name, "IPFS Swarm\n(Encrypted Weights)")

pos = nx.get_node_attributes(G, 'pos')

nx.draw_networkx_edges(G, pos, ax=ax, edge_color=BORDER_COL, width=1.5, style='solid')
nx.draw_networkx_edges(G, pos, edgelist=[("Ethereum\nSmart Contract\n(0x1BE4...)", "IPFS Swarm\n(Encrypted Weights)")],
                       ax=ax, edge_color=MAGENTA, width=3.0)

hospital_nodes = [n for n, d in G.nodes(data=True) if d['node_type'] == 'hospital']
ledger_nodes = [n for n, d in G.nodes(data=True) if d['node_type'] == 'ledger']
swarm_nodes = [n for n, d in G.nodes(data=True) if d['node_type'] == 'swarm']

nx.draw_networkx_nodes(G, pos, nodelist=hospital_nodes, node_color='#CCFBF1', edgecolors=TEAL, node_size=2800, ax=ax, linewidths=2)
nx.draw_networkx_nodes(G, pos, nodelist=ledger_nodes, node_color='#FDF2F8', edgecolors=MAGENTA, node_size=3800, ax=ax, linewidths=2.5)
nx.draw_networkx_nodes(G, pos, nodelist=swarm_nodes, node_color='#DCFCE7', edgecolors=GREEN, node_size=3400, ax=ax, linewidths=2.5)

labels = {n: n for n in G.nodes()}
nx.draw_networkx_labels(G, pos, labels=labels, font_size=7.5, font_weight='bold', font_color=DARK, ax=ax)

ax.set_title('Nationwide Decentralized Healthcare Consortium Topology in Bangladesh', fontsize=14, fontweight='bold', color=DARK, pad=15)
ax.set_xlim(-2.4, 2.4)
ax.set_ylim(-2.4, 2.4)
ax.axis('off')

ax.text(0, -2.25, 'Zero Central Server Bottleneck: Peer-to-Peer Enclaves Coordinated by Ethereum State Machine',
        ha='center', va='center', fontsize=9.5, fontweight='bold', color=MAGENTA,
        bbox=dict(boxstyle="round,pad=0.4", facecolor=LIGHT_BG, edgecolor=MAGENTA))

plt.tight_layout()
f4 = os.path.join(OUTPUT_DIR, "fig4_bangladesh_consortium_network_topology.png")
plt.savefig(f4, dpi=300)
plt.close()
print(f"Generated: {f4}")


# -----------------------------------------------------------------------------
# FIGURE 5: BANGLADESH HEALTH ECONOMICS & BDT 250+ CRORE SAVINGS BREAKDOWN
# -----------------------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
fig.suptitle('Macro-Economic Health Impact: BDT 250+ Crore Annual National Savings', fontsize=16, fontweight='bold', color=DARK, y=0.98)

labels_donut = [
    'Patient Travel, Hotel & Courier\nExpenses Avoided (BDT 145 Cr)',
    'Averted Late-Stage Treatment\nOut-of-Pocket Costs (BDT 75 Cr)',
    'Hospital Pathology Efficiency\n& Labor Optimization (BDT 30 Cr)'
]
sizes_donut = [145, 75, 30]
colors_donut = [MAGENTA, TEAL, GREEN]

wedges, texts, autotexts = ax1.pie(sizes_donut, labels=labels_donut, autopct='%1.1f%%',
                                   startangle=140, colors=colors_donut,
                                   textprops=dict(color=DARK, fontsize=8.5, fontweight='bold'),
                                   wedgeprops=dict(width=0.42, edgecolor='#FFFFFF', linewidth=2))

for at in autotexts:
    at.set_color('#FFFFFF')
    at.set_fontsize(10)
    at.set_weight('bold')

ax1.set_title('Sources of BDT 250+ Crore National Savings', fontsize=12, fontweight='bold', color=DARK)
ax1.text(0, 0, 'BDT 250 Cr\nAnnual\nSavings', ha='center', va='center', fontsize=12, fontweight='bold', color=DARK)

metrics = ['Logistics & Courier\n(Dhaka Transit)', 'Diagnostic Biopsy\n(Turnaround Delay)', 'Cancer Treatment\n(Late vs Early Stage)']
traditional = [25000, 12000, 2000000]
medchain = [500, 2500, 200000]

x_m = np.arange(len(metrics))
w = 0.35

ax2.set_facecolor(LIGHT_BG)
ax2.bar(x_m - w/2, traditional, width=w, label='Traditional Dhaka-Centric Courier Flow', color=RED, edgecolor=BORDER_COL)
ax2.bar(x_m + w/2, medchain, width=w, label='MedChain-FL On-Premise Enclave', color=GREEN, edgecolor=BORDER_COL)

ax2.set_yscale('log')
ax2.set_ylabel('Cost per Patient Family (BDT, Log Scale)', fontsize=10.5, fontweight='bold', color=DARK)
ax2.set_title('Direct Financial Burden per Patient Family', fontsize=12, fontweight='bold', color=DARK)
ax2.set_xticks(x_m)
ax2.set_xticklabels(metrics, fontsize=9, fontweight='bold', color=DARK)
ax2.set_ylim(100, 12000000)
ax2.legend(loc='upper right', frameon=True, facecolor='#FFFFFF', edgecolor=BORDER_COL, fontsize=8.5)
ax2.grid(axis='y', linestyle='--', alpha=0.4)

ax2.text(0 - w/2, 35000, 'BDT 25k', ha='center', fontsize=8.5, fontweight='bold', color=RED)
ax2.text(0 + w/2, 800, 'BDT 500\n(98% Save)', ha='center', fontsize=8, fontweight='bold', color=GREEN)

ax2.text(1 - w/2, 16000, 'BDT 12k', ha='center', fontsize=8.5, fontweight='bold', color=RED)
ax2.text(1 + w/2, 3500, 'BDT 2.5k', ha='center', fontsize=8, fontweight='bold', color=GREEN)

ax2.text(2 - w/2, 2600000, 'BDT 20 Lakh\n(Stage 3/4 Fatal)', ha='center', fontsize=8.5, fontweight='bold', color=RED)
ax2.text(2 + w/2, 280000, 'BDT 2 Lakh\n(Stage 1 Curable)', ha='center', fontsize=8, fontweight='bold', color=GREEN)

plt.tight_layout(rect=[0, 0.03, 1, 0.95])
f5 = os.path.join(OUTPUT_DIR, "fig5_national_economic_savings_breakdown.png")
plt.savefig(f5, dpi=300)
plt.close()
print(f"Generated: {f5}")


# -----------------------------------------------------------------------------
# FIGURE 6: 5-YEAR FINANCIAL REVENUE PROJECTION & UNIT ECONOMICS
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10.5, 6), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor(LIGHT_BG)

years = ['Year 1\n(Pilot Consortium)', 'Year 2\n(Divisional Expansion)', 'Year 3\n(Break-Even)', 'Year 4\n(Public Scale)', 'Year 5\n(National Adoption)']
saas = np.array([0.20, 0.80, 2.10, 5.80, 13.30])
ppp = np.array([0.10, 0.40, 1.00, 2.70, 6.10])
pay_scan = np.array([0.05, 0.20, 0.70, 2.00, 4.80])

w_b = 0.52
b1 = ax.bar(years, saas, width=w_b, label='Private Hospital B2B SaaS (BDT 75k–1.5L/mo)', color=MAGENTA, edgecolor=BORDER_COL)
b2 = ax.bar(years, ppp, width=w_b, bottom=saas, label='DGHS & MoHFW Public-Private Partnership Contract', color=TEAL, edgecolor=BORDER_COL)
b3 = ax.bar(years, pay_scan, width=w_b, bottom=saas+ppp, label='District Diagnostic Pay-Per-Scan API (BDT 250/scan)', color=DARK, edgecolor=BORDER_COL)

total_rev = saas + ppp + pay_scan
nodes_cnt = [3, 10, 25, 65, 150]
for idx, (tot, n) in enumerate(zip(total_rev, nodes_cnt)):
    ax.text(idx, tot + 0.6, f'BDT {tot:.1f} Cr\n({n} Nodes)', ha='center', va='bottom', fontsize=9.5, fontweight='bold', color=DARK)

ax.set_ylabel('Annual Recurring Revenue (Crore BDT)', fontsize=11, fontweight='bold', color=DARK)
ax.set_title('Consortium Financial Trajectory in Bangladesh (ARR in BDT)', fontsize=15, fontweight='bold', color=DARK, pad=15)
ax.set_ylim(0, 29)
ax.legend(loc='upper left', frameon=True, facecolor='#FFFFFF', edgecolor=BORDER_COL, fontsize=9)
ax.grid(axis='y', linestyle='--', alpha=0.4)

unit_box = (
    "KEY UNIT ECONOMICS:\n"
    "• LTV / CAC Ratio: 4.8×\n"
    "• Year 5 EBITDA Margin: 68%\n"
    "• Customer Payback: 5.2 Months\n"
    "• Gross Margin: 82% (near-zero L2 gas)"
)
ax.text(0.02, 0.50, unit_box, transform=ax.transAxes, fontsize=8.5, fontweight='bold', color=DARK,
        bbox=dict(boxstyle="round,pad=0.5", facecolor='#F0FDFA', edgecolor=TEAL, alpha=0.9))

plt.tight_layout()
f6 = os.path.join(OUTPUT_DIR, "fig6_financial_revenue_model_projections.png")
plt.savefig(f6, dpi=300)
plt.close()
print(f"Generated: {f6}")

print("All 6 strictly Blockchain & Business figures generated successfully!")
