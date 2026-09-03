#!/usr/bin/env python3
"""
Generate professional, high-resolution figures for MedChain-FL
specifically tailored for Blockchain Olympiad Bangladesh (BCOLBD 2026).
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

OUTPUT_DIR = "/home/hs32/Desktop/medchain/thesis/paper/figures"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Styling palette
MAGENTA = "#A32B68"
TEAL = "#0D9488"
DARK = "#2E2733"
MUTED = "#6B6472"
GREEN = "#16A34A"
RED = "#DC2626"
LIGHT_BG = "#F8F7FA"
BORDER_COL = "#E5E2E8"

plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# -----------------------------------------------------------------------------
# FIGURE 1: BANGLADESH HEALTH ECONOMICS & COST-BENEFIT COMPARISON
# -----------------------------------------------------------------------------
fig, axes = plt.subplots(2, 2, figsize=(12, 8), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
fig.suptitle('MedChain-FL: Bangladesh Health Economics & Patient ROI', fontsize=18, fontweight='bold', color=DARK, y=0.98)

# Panel 1: Turnaround Time
ax1 = axes[0, 0]
ax1.set_facecolor(LIGHT_BG)
categories1 = ['Traditional\n(Dhaka Courier)', 'MedChain-FL\n(Local Enclave)']
times = [28.0, 0.01]  # 28 days vs 15 mins (0.01 days)
bars1 = ax1.bar(categories1, [28, 0.25], color=[RED, GREEN], width=0.45, edgecolor=BORDER_COL, linewidth=1.5)
ax1.set_ylabel('Diagnostic Time (Days)', fontsize=11, fontweight='bold', color=DARK)
ax1.set_title('Diagnostic Turnaround: 28 Days → 15 Mins\n(99.9% Turnaround Acceleration)', fontsize=12, fontweight='bold', color=DARK)
ax1.set_ylim(0, 32)
ax1.text(0, 29, '28 Days\n(Weeks in Queue)', ha='center', va='bottom', fontsize=10, fontweight='bold', color=RED)
ax1.text(1, 1.0, '15 Minutes\n(Instant On-Premise)', ha='center', va='bottom', fontsize=10, fontweight='bold', color=GREEN)
ax1.grid(axis='y', linestyle='--', alpha=0.5)

# Panel 2: Logistics & Travel Cost
ax2 = axes[0, 1]
ax2.set_facecolor(LIGHT_BG)
costs = [25000, 500]
bars2 = ax2.bar(['Dhaka Transit\n& Hotel Stay', 'Local District\nHospital'], costs, color=[RED, TEAL], width=0.45, edgecolor=BORDER_COL, linewidth=1.5)
ax2.set_ylabel('Patient Out-of-Pocket (BDT)', fontsize=11, fontweight='bold', color=DARK)
ax2.set_title('Logistics & Travel Expense: BDT 25,000 → BDT 500\n(98% Direct Family Savings)', fontsize=12, fontweight='bold', color=DARK)
ax2.set_ylim(0, 29000)
ax2.text(0, 25500, 'BDT 25,000\n(Dhaka Travel)', ha='center', va='bottom', fontsize=10, fontweight='bold', color=RED)
ax2.text(1, 1200, 'BDT 500\n(Local Scan)', ha='center', va='bottom', fontsize=10, fontweight='bold', color=TEAL)
ax2.grid(axis='y', linestyle='--', alpha=0.5)

# Panel 3: Treatment Expense (Late Stage vs Early Stage)
ax3 = axes[1, 0]
ax3.set_facecolor(LIGHT_BG)
treat_costs = [20.0, 2.0]  # in Lakh BDT
bars3 = ax3.bar(['Late Stage 3/4\n(Traditional Delay)', 'Early Stage 1\n(MedChain-FL)'], treat_costs, color=[RED, GREEN], width=0.45, edgecolor=BORDER_COL, linewidth=1.5)
ax3.set_ylabel('Treatment Cost (Lakh BDT)', fontsize=11, fontweight='bold', color=DARK)
ax3.set_title('Cancer Treatment Expense: Saves BDT 18 Lakh\n(Prevents Out-of-Pocket Poverty)', fontsize=12, fontweight='bold', color=DARK)
ax3.set_ylim(0, 24)
ax3.text(0, 20.5, 'BDT 20 Lakh\n(Catastrophic Out-of-Pocket)', ha='center', va='bottom', fontsize=10, fontweight='bold', color=RED)
ax3.text(1, 2.5, 'BDT 2.0 Lakh\n(Curable Stage 1)', ha='center', va='bottom', fontsize=10, fontweight='bold', color=GREEN)
ax3.grid(axis='y', linestyle='--', alpha=0.5)

# Panel 4: 5-Year Survival Rate
ax4 = axes[1, 1]
ax4.set_facecolor(LIGHT_BG)
surv = [38.0, 89.0]
bars4 = ax4.bar(['Late Detection\n(Traditional Flow)', 'Early Detection\n(MedChain-FL)'], surv, color=[MUTED, GREEN], width=0.45, edgecolor=BORDER_COL, linewidth=1.5)
ax4.set_ylabel('5-Year Survival Rate (%)', fontsize=11, fontweight='bold', color=DARK)
ax4.set_title('5-Year Patient Survival: 38% → 89%\n(+51% Absolute Survival Leap)', fontsize=12, fontweight='bold', color=DARK)
ax4.set_ylim(0, 105)
ax4.text(0, 40, '38.0%\n(Late Detection)', ha='center', va='bottom', fontsize=10, fontweight='bold', color=MUTED)
ax4.text(1, 91, '89.0%\n(Early Curable)', ha='center', va='bottom', fontsize=10, fontweight='bold', color=GREEN)
ax4.grid(axis='y', linestyle='--', alpha=0.5)

plt.tight_layout(rect=[0, 0.03, 1, 0.95])
f1_path = os.path.join(OUTPUT_DIR, "fig1_bangladesh_health_economics.png")
plt.savefig(f1_path, dpi=300)
plt.close()
print(f"Generated: {f1_path}")


# -----------------------------------------------------------------------------
# FIGURE 2: 5-YEAR FINANCIAL REVENUE FORECAST & ARR TRAJECTORY
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor(LIGHT_BG)

years = ['Year 1\n(Pilot)', 'Year 2\n(Expansion)', 'Year 3\n(Break-Even)', 'Year 4\n(Scale)', 'Year 5\n(National)']
pvt_saas = np.array([0.20, 0.80, 2.10, 5.80, 13.30])  # in Crore BDT
dghs_ppp = np.array([0.10, 0.40, 1.00, 2.70, 6.10])
pay_per_scan = np.array([0.05, 0.20, 0.70, 2.00, 4.80])

bar_width = 0.55
bars_saas = ax.bar(years, pvt_saas, width=bar_width, label='Private Hospital SaaS (Evercare, Square, United)', color=MAGENTA, edgecolor=BORDER_COL)
bars_ppp = ax.bar(years, dghs_ppp, width=bar_width, bottom=pvt_saas, label='DGHS & MoHFW PPP Contract (37 Govt Med Colleges)', color=TEAL, edgecolor=BORDER_COL)
bars_scan = ax.bar(years, pay_per_scan, width=bar_width, bottom=pvt_saas + dghs_ppp, label='District Diagnostic Pay-Per-Scan API (BDT 250/scan)', color=DARK, edgecolor=BORDER_COL)

totals = pvt_saas + dghs_ppp + pay_per_scan
nodes = [3, 10, 25, 65, 150]
for idx, (tot, n) in enumerate(zip(totals, nodes)):
    ax.text(idx, tot + 0.6, f'BDT {tot:.1f} Cr\n({n} Nodes)', ha='center', va='bottom', fontsize=10, fontweight='bold', color=DARK)

ax.set_ylabel('Annual Recurring Revenue (Crore BDT)', fontsize=12, fontweight='bold', color=DARK)
ax.set_title('MedChain-FL 5-Year Financial Projection in Bangladesh (ARR in BDT)', fontsize=15, fontweight='bold', color=DARK, pad=15)
ax.set_ylim(0, 28)
ax.legend(loc='upper left', frameon=True, facecolor='#FFFFFF', edgecolor=BORDER_COL, fontsize=9.5)
ax.grid(axis='y', linestyle='--', alpha=0.5)

ax.annotate('Year 5: BDT 24.2 Crore ARR\nEBITDA Margin: 68%\n~4,500 Lives Saved/Yr', 
            xy=(4, 24.2), xytext=(2.8, 20),
            arrowprops=dict(facecolor=GREEN, shrink=0.05, width=1.5, headwidth=8),
            bbox=dict(boxstyle="round,pad=0.5", facecolor="#DCFCE7", edgecolor=GREEN, alpha=0.9),
            fontsize=10, fontweight='bold', color=DARK)

plt.tight_layout()
f2_path = os.path.join(OUTPUT_DIR, "fig2_5year_revenue_arr_forecast.png")
plt.savefig(f2_path, dpi=300)
plt.close()
print(f"Generated: {f2_path}")


# -----------------------------------------------------------------------------
# FIGURE 3: BANGLADESH MARKET OPPORTUNITY (TAM / SAM / SOM)
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9, 6), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor('#FFFFFF')

circle_tam = plt.Circle((0.5, 0.5), 0.45, color='#F3E8FF', ec=MAGENTA, linewidth=2)
circle_sam = plt.Circle((0.5, 0.42), 0.30, color='#CCFBF1', ec=TEAL, linewidth=2)
circle_som = plt.Circle((0.5, 0.35), 0.16, color='#DCFCE7', ec=GREEN, linewidth=2)

ax.add_patch(circle_tam)
ax.add_patch(circle_sam)
ax.add_patch(circle_som)

ax.text(0.5, 0.84, 'TAM: BDT 1,200 Crore ($100M)', ha='center', va='center', fontsize=13, fontweight='bold', color=MAGENTA)
ax.text(0.5, 0.78, '4,500+ Diagnostic Centers · 173M Citizens · 30M Screening-Age Women in BD', ha='center', va='center', fontsize=8.5, color=DARK)

ax.text(0.5, 0.59, 'SAM: BDT 280 Crore ($23M)', ha='center', va='center', fontsize=12, fontweight='bold', color=TEAL)
ax.text(0.5, 0.54, '37 Public Medical Colleges + Top 100 Private Hospital Chains & Labs', ha='center', va='center', fontsize=8.5, color=DARK)

ax.text(0.5, 0.37, 'SOM: BDT 24.2 Crore ($2M)', ha='center', va='center', fontsize=11, fontweight='bold', color=GREEN)
ax.text(0.5, 0.31, '150 Hospital Consortium Nodes (Year 5)\n200,000+ Annual Biopsies Processed', ha='center', va='center', fontsize=8, color=DARK)

ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis('off')
ax.set_title('Market Sizing & Commercial Opportunity in Bangladesh', fontsize=15, fontweight='bold', color=DARK, pad=10)

plt.tight_layout()
f3_path = os.path.join(OUTPUT_DIR, "fig3_bangladesh_market_tam_sam_som.png")
plt.savefig(f3_path, dpi=300)
plt.close()
print(f"Generated: {f3_path}")


# -----------------------------------------------------------------------------
# FIGURE 4: BLOCKCHAIN STORAGE & GAS COMPRESSION FUNNEL
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11, 6), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor(LIGHT_BG)

steps = ['Raw Biopsy Slide\n(Hospital Enclave)', 'AES-256 Weights\n(IPFS Swarm)', 'Smart Contract Payload\n(Ethereum Sepolia)', 'Polygon / Besu L2\n(Consortium Rollup)']
sizes = ['15 – 50 MB', '< 10 MB', '< 100 Bytes', '< 100 Bytes']
trans_costs = ['0 Bytes Transmitted\n(Air-Gap Firewall)', 'Decentralized Swarm\n(Zero Gas Cost)', '~$17.28 / round\n(Sepolia Testnet L1)', '< BDT 2.00 (< $0.02)\n(99.9% Gas Reduction)']
colors = [MAGENTA, TEAL, DARK, GREEN]

for i in range(len(steps)):
    rect = patches.FancyBboxPatch((i*2.8 + 0.3, 1.2), 2.2, 3.8, boxstyle="round,pad=0.2",
                                  facecolor='#FFFFFF', edgecolor=colors[i], linewidth=2)
    ax.add_patch(rect)
    ax.text(i*2.8 + 1.4, 4.5, steps[i], ha='center', va='center', fontsize=10.5, fontweight='bold', color=colors[i])
    ax.text(i*2.8 + 1.4, 3.4, f"Data Size:\n{sizes[i]}", ha='center', va='center', fontsize=11, fontweight='bold', color=DARK)
    ax.text(i*2.8 + 1.4, 2.1, f"Gas / Cost:\n{trans_costs[i]}", ha='center', va='center', fontsize=9.5, color=MUTED)

for i in range(len(steps)-1):
    ax.annotate('', xy=((i+1)*2.8 + 0.1, 3.1), xytext=(i*2.8 + 2.7, 3.1),
                arrowprops=dict(arrowstyle="->", color=DARK, lw=2.5))

ax.set_xlim(0, 11.2)
ax.set_ylim(0.5, 5.5)
ax.axis('off')
ax.set_title('Blockchain EVM Storage & Gas Compression Architecture (99.6% Gas Reduction)', fontsize=15, fontweight='bold', color=DARK, pad=15)

plt.tight_layout()
f4_path = os.path.join(OUTPUT_DIR, "fig4_blockchain_storage_compression.png")
plt.savefig(f4_path, dpi=300)
plt.close()
print(f"Generated: {f4_path}")


# -----------------------------------------------------------------------------
# FIGURE 5: SMART CONTRACT STATE MACHINE & BYZANTINE FAULT TOLERANCE
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(12, 6.5), dpi=300)
fig.patch.set_facecolor('#FFFFFF')
ax.set_facecolor(LIGHT_BG)

boxes = [
    ("1. Whitelist KYC", "registerHospital()\nWallet-Bound Identity\nOpenZeppelin Ownable", 0.6, 3.2, TEAL),
    ("2. Open Round", "openRound()\nBroadcast Global CID\nTrigger Sync Timer", 3.0, 3.2, MAGENTA),
    ("3. Submit Delta", "submitModelUpdate()\nminSamples = 500\nBit-Packed Metrics", 5.4, 3.2, DARK),
    ("4. Byzantine Filter", "3-Sigma Loss Check\nKey Parity Validation\nSlashing bad nodes", 7.8, 3.2, RED),
    ("5. Finalize Lineage", "publishGlobalModel()\nWeighted FedAvg\nConsensus CID Anchor", 10.2, 3.2, GREEN),
]

for title, sub, x, y, col in boxes:
    rect = patches.FancyBboxPatch((x-0.9, y-1.2), 1.8, 2.4, boxstyle="round,pad=0.2",
                                  facecolor='#FFFFFF', edgecolor=col, linewidth=2)
    ax.add_patch(rect)
    ax.text(x, y+0.7, title, ha='center', va='center', fontsize=10.5, fontweight='bold', color=col)
    ax.text(x, y-0.2, sub, ha='center', va='center', fontsize=8.5, color=DARK)

for i in range(len(boxes)-1):
    ax.annotate('', xy=(boxes[i+1][2]-1.0, 3.2), xytext=(boxes[i][2]+1.0, 3.2),
                arrowprops=dict(arrowstyle="->", color=DARK, lw=2))

ax.annotate('Outlier / Poisoning Detected: Node Slashed & Excluded', 
            xy=(boxes[0][2], 1.5), xytext=(boxes[3][2], 1.5),
            arrowprops=dict(arrowstyle="->", color=RED, lw=2, linestyle="--"),
            ha='center', va='center', fontsize=9.5, fontweight='bold', color=RED)

ax.set_xlim(-0.5, 12.0)
ax.set_ylim(0.5, 5.0)
ax.axis('off')
ax.set_title('Solidity Consensus State Machine (FederatedModelRegistry.sol on Ethereum Sepolia)', fontsize=15, fontweight='bold', color=DARK, pad=10)

plt.tight_layout()
f5_path = os.path.join(OUTPUT_DIR, "fig5_smart_contract_state_machine.png")
plt.savefig(f5_path, dpi=300)
plt.close()
print(f"Generated: {f5_path}")
print("All 5 figures generated successfully!")
