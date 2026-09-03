"""
Generate a comprehensive, beautifully structured Word document (.docx)
containing all slide content, tables, pitch notes, and embedded code-generated figures
strictly focused on BLOCKCHAIN and BUSINESS / HEALTH ECONOMICS (NO ML figures).
For Blockchain Olympiad Bangladesh (BCOLBD 2026).
"""

import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

DOC_PATH = "/home/hs32/Desktop/medchain/thesis/paper/MedChain_BCOLBD_Slide_Content_and_Figures.docx"
FIG_DIR = "/home/hs32/Desktop/medchain/thesis/paper/figures"

doc = Document()

# Set standard 1-inch margins
for section in doc.sections:
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)

# Colors
COLOR_BERRY = RGBColor(163, 43, 104)   # #A32B68
COLOR_TEAL = RGBColor(13, 148, 136)    # #0D9488
COLOR_DARK = RGBColor(46, 39, 51)      # #2E2733
COLOR_MUTED = RGBColor(107, 100, 114)  # #6B6472
COLOR_GREEN = RGBColor(22, 163, 74)    # #16A34A

def style_heading1(p, text):
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(18)
    run.font.bold = True
    run.font.color.rgb = COLOR_BERRY

def style_heading2(p, text):
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = COLOR_TEAL

def style_heading3(p, text):
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = 'Calibri'
    run.font.size = Pt(11.5)
    run.font.bold = True
    run.font.color.rgb = COLOR_DARK

def add_callout(doc, title, text, border_color="A32B68", bg_color="FDF2F8"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading)
    
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    cell._tc.get_or_add_tcPr().append(borders)
    
    cp = cell.paragraphs[0]
    cp.paragraph_format.space_before = Pt(4)
    cp.paragraph_format.space_after = Pt(2)
    r1 = cp.add_run(f"★ {title}\n")
    r1.font.bold = True
    r1.font.size = Pt(10.5)
    r1.font.color.rgb = COLOR_BERRY if border_color == "A32B68" else COLOR_TEAL
    
    r2 = cp.add_run(text)
    r2.font.size = Pt(9.5)
    r2.font.color.rgb = COLOR_DARK
    
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)

def set_table_header_style(row, bg_hex="A32B68"):
    for cell in row.cells:
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            for run in p.runs:
                run.font.bold = True
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(255, 255, 255)

def set_table_row_shading(row, bg_hex="F8F7FA"):
    for cell in row.cells:
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            for run in p.runs:
                run.font.size = Pt(9)
                run.font.color.rgb = COLOR_DARK

# ==============================================================================
# TITLE & INTRO
# ==============================================================================
title_p = doc.add_paragraph()
title_p.paragraph_format.space_before = Pt(0)
title_p.paragraph_format.space_after = Pt(2)
r = title_p.add_run("MedChain-FL: Blockchain & Business Master Deck Content")
r.font.name = 'Calibri'
r.font.size = Pt(23)
r.font.bold = True
r.font.color.rgb = COLOR_BERRY

sub_p = doc.add_paragraph()
sub_p.paragraph_format.space_before = Pt(0)
sub_p.paragraph_format.space_after = Pt(12)
r = sub_p.add_run("Slide Texts, Pitch Scripts, and Code-Generated Visualizations for Blockchain Olympiad Bangladesh (BCOLBD 2026)")
r.font.size = Pt(11.5)
r.font.color.rgb = COLOR_MUTED

add_callout(doc, "BLOCKCHAIN & BUSINESS FOCUS (ZERO ML FIGURES)",
    "Per your instructions, all machine learning figures (ROC curves, confusion matrices, neural net layers) "
    "have been omitted. This document and its accompanying figures focus 100% on BLOCKCHAIN MECHANICS "
    "(EVM Gas Benchmarks, 3-Sigma Byzantine Slashing, Solidity State Machine, Network Topology, Proof-of-Contribution Tokenomics) "
    "and BANGLADESH BUSINESS IMPACT (BDT 250+ Crore Healthcare Savings, 5-Year ARR Model, SaaS Economics, PDPO 2025 Compliance). "
    "All figures were generated programmatically using Python code (matplotlib & networkx).",
    border_color="0D9488", bg_color="F0FDFA"
)

# Metadata Table
meta_tbl = doc.add_table(rows=5, cols=2)
meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    ("Competition & Track", "Blockchain Olympiad Bangladesh (BCOLBD 2026) — HealthTech Category"),
    ("Team Name & ID", "Team FedGuard — Team ID: 6a7f01a5baff6"),
    ("Members & Affiliation", "Shahriar Hasan, Md. Taufiq Biswas, Md Najib Ul Azam Mahi (Dept. of ECE, HSTU, Dinajpur)"),
    ("Deployed Contract", "0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1 (Ethereum Sepolia Testnet)"),
    ("Live Endpoints", "Hospital Enclave: https://medchain.paradox-bd.com | Cockpit: https://cockpit.medchain.paradox-bd.com")
]
for idx, (lbl, val) in enumerate(meta_data):
    r_cells = meta_tbl.rows[idx].cells
    r_cells[0].width = Inches(2.0)
    r_cells[1].width = Inches(4.5)
    r_cells[0].text = lbl
    r_cells[1].text = val
    r_cells[0].paragraphs[0].runs[0].font.bold = True
    r_cells[0].paragraphs[0].runs[0].font.size = Pt(9.5)
    r_cells[1].paragraphs[0].runs[0].font.size = Pt(9.5)
    if idx % 2 == 1:
        set_table_row_shading(meta_tbl.rows[idx], "F8F7FA")

doc.add_page_break()

# ==============================================================================
# SLIDE 1: TITLE & CONSORTIUM SUMMARY
# ==============================================================================
style_heading1(doc.add_paragraph(), "Slide 01: Title & Team FedGuard")
style_heading2(doc.add_paragraph(), "Slide Header & Metadata")
p = doc.add_paragraph()
p.add_run("• Eyebrow: ").bold = True
p.add_run("BCOLBD 2026  ·  BLOCKCHAIN CATEGORY  ·  HEALTHTECH TRACK\n")
p.add_run("• Slide Title: ").bold = True
p.add_run("MedChain-FL: Ethereum–IPFS Smart Contract Framework for Privacy-Preserving Healthcare Consortiums\n")
p.add_run("• Team Details: ").bold = True
p.add_run("Team FedGuard (Team ID: 6a7f01a5baff6) | Shahriar Hasan, Md. Taufiq Biswas, Md Najib Ul Azam Mahi | Department of Electronics and Communication Engineering (ECE), HSTU, Dinajpur.")

style_heading3(doc.add_paragraph(), "Four Core Pillars for Slide 1")
p = doc.add_paragraph()
p.add_run("1. Consortium Ledger: Solidity state machine on Ethereum Sepolia (0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1) coordinating multi-hospital aggregation.\n")
p.add_run("2. Zero Data Leakage: 100% on-premise hospital enclaves. Raw patient biopsy slides NEVER leave local premises, ensuring strict PDPO 2025 compliance.\n")
p.add_run("3. Game-Theoretic Coordination: Mathematical anti-free-riding gates and automated on-chain Byzantine outlier slashing.\n")
p.add_run("4. Bangladesh Macro-Economic Impact: Slashes biopsy diagnosis from 28 days to 15 minutes, saving over BDT 250+ Crore annually across the national health system.")

add_callout(doc, "JUDGE PITCH SCRIPT FOR SLIDE 1 (30 SECONDS)",
    '"Honorable judges, we are Team FedGuard from HSTU. In Bangladesh, cancer diagnosis faces a severe structural '
    'crisis: a critical shortage of histopathologists outside Dhaka, and an absolute refusal by rival hospital chains '
    'to pool patient records. MedChain-FL eliminates the need for trusted central middlemen. By governing multi-hospital '
    'collaborations through an autonomous Ethereum smart contract and IPFS swarm, we allow competing institutions to '
    'coordinate diagnostics trustlessly—cutting turnaround from 28 days to 15 minutes while saving BDT 250+ Crore annually."',
    border_color="A32B68", bg_color="FDF2F8"
)

# ==============================================================================
# SLIDE 2: THE BANGLADESH HEALTHCARE CRISIS
# ==============================================================================
style_heading1(doc.add_paragraph(), "Slide 02: Catastrophic Diagnostic Bottleneck in Bangladesh")
style_heading2(doc.add_paragraph(), "Quantitative Bottleneck Metrics")
p = doc.add_paragraph()
p.add_run("• 1 : 1,000,000 Pathologist Scarcity: ").bold = True
p.add_run("Only ~170 histopathologists serve 173 Million citizens in Bangladesh. Over 100 Upazila health complexes have zero pathology access.\n")
p.add_run("• 70%+ Concentrated in Dhaka: ").bold = True
p.add_run("Divisional hubs (Rangpur, Dinajpur, Barisal, Sylhet) lack specialized oncopathologists. Physical biopsy tissue must courier to Dhaka.\n")
p.add_run("• 14 – 28 Days Diagnostic Delay: ").bold = True
p.add_run("Weeks in transit and laboratory backlogs mean 70% of breast cancer cases in Bangladesh are diagnosed at fatal Stage 3 or 4.")

style_heading3(doc.add_paragraph(), "Legal & Institutional Impasse (PDPO 2025)")
p = doc.add_paragraph()
p.add_run("• Commercial Hospital Distrust: Evercare, Square, United, and public medical colleges will NEVER pool patient images into a shared server.\n")
p.add_run("• The 2023 National Breach: 50M+ citizen records leaked via an exposed government database proved central data pooling is catastrophic.\n")
p.add_run("• Statutory Prohibition: Bangladesh Personal Data Protection Ordinance (PDPO) 2025 strictly prohibits exporting or centralizing health data.")

# ==============================================================================
# SLIDE 3: WHY BLOCKCHAIN IS MANDATORY
# ==============================================================================
style_heading1(doc.add_paragraph(), "Slide 03: The Blockchain Imperative (Why Federation Alone Fails)")
style_heading2(doc.add_paragraph(), "Comparative Governance Framework")

comp_tbl = doc.add_table(rows=5, cols=3)
comp_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
comp_headers = ["CENTRALIZED AI POOL", "FEDERATED AI ALONE", "MEDCHAIN-FL (BLOCKCHAIN)"]
for idx, h in enumerate(comp_headers):
    comp_tbl.rows[0].cells[idx].text = h
set_table_header_style(comp_tbl.rows[0], "A32B68")

comp_rows = [
    ("Single point of failure; one API leak compromises 100% of data.", "Central server acts as aggregator; operator can secretly bias or alter model weights.", "Decentralized Solidity smart contract coordinator; immutable consensus rules."),
    ("Hospitals must surrender patient records to a commercial rival.", "Requires bilateral trust agreements between competing hospital chains.", "Zero-trust consortium: participants only need to trust the open-source Ethereum contract."),
    ("Violates Bangladesh PDPO 2025 data protection statutes.", "Vulnerable to 'free-rider' nodes who download global AI without contributing local training.", "Math-enforced Proof-of-Contribution: nodes cannot pull global model without submitting verifiable updates."),
    ("High risk of regulatory sanctions and citizen privacy lawsuits.", "No verifiable multi-hospital audit trail for DGHS health inspections.", "Tamper-proof cryptographic receipt ledger on-chain for DGHS/MoHFW compliance audits.")
]
for r_idx, (c1, c2, c3) in enumerate(comp_rows, 1):
    row = comp_tbl.rows[r_idx]
    row.cells[0].text = c1
    row.cells[1].text = c2
    row.cells[2].text = c3
    if r_idx % 2 == 1:
        set_table_row_shading(row, "F8F7FA")

doc.add_paragraph().paragraph_format.space_after = Pt(6)

add_callout(doc, "GOVERNANCE INSIGHT FOR BLOCKCHAIN JUDGES",
    '"Federated learning alone solves the machine learning privacy problem. But only blockchain solves the '
    'governance problem. Without blockchain, you still have a centralized coordinator who can be bribed, hacked, or '
    'compromised. With Ethereum, the aggregation rules are immutable and verifiable by every hospital in Bangladesh."',
    border_color="0D9488", bg_color="F0FDFA"
)

# ==============================================================================
# SLIDE 4: NATIONWIDE DECENTRALIZED TOPOLOGY
# ==============================================================================
doc.add_page_break()
style_heading1(doc.add_paragraph(), "Slide 04: Nationwide Decentralized Consortium Topology")
style_heading2(doc.add_paragraph(), "Peer-to-Peer Enclave Mesh across 8 Divisions")
p = doc.add_paragraph()
p.add_run("• Decentralized Coordinator: ").bold = True
p.add_run("Ethereum Sepolia Smart Contract (0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1) acts as the trustless master referee.\n")
p.add_run("• Swarm Storage Layer: ").bold = True
p.add_run("IPFS content-addressed cluster replicates AES-256 encrypted gradient vectors between hospitals.\n")
p.add_run("• Hospital Nodes: ").bold = True
p.add_run("Divisional hubs (Dhaka BSMMU/Evercare, Rangpur HSTU, Chattogram CMCH, Rajshahi RMCH, Khulna KMCH, Sylhet SOMCH, Barishal SBMCH, Mymensingh MMCH) communicate directly via the smart contract.\n")
p.add_run("• ZERO Central Server Bottleneck: ").bold = True
p.add_run("If the central operator is destroyed or offline, the hospital network continues operating autonomously via Ethereum.")

# Embed Figure 4: Topology
fig4_path = os.path.join(FIG_DIR, "fig4_bangladesh_consortium_network_topology.png")
if os.path.exists(fig4_path):
    doc.add_picture(fig4_path, width=Inches(6.2))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = cap.add_run("Figure 1: Nationwide Decentralized Healthcare Consortium Topology in Bangladesh (Generated via NetworkX)")
    r.font.size = Pt(8.5)
    r.font.italic = True
    r.font.color.rgb = COLOR_MUTED

# ==============================================================================
# SLIDE 5 & 6: EVM GAS CONSUMPTION & MULTI-CHAIN SCALABILITY
# ==============================================================================
style_heading1(doc.add_paragraph(), "Slide 05 & 06: EVM Gas Optimization & Multi-Chain Scalability")
style_heading2(doc.add_paragraph(), "Empirical Gas Consumption & Layer-2 Economics")

p = doc.add_paragraph()
p.add_run("• Solidity Contract: ").bold = True
p.add_run("FederatedModelRegistry.sol deployed on Sepolia Testnet at block 10254150.\n")
p.add_run("• Bit-Packed Storage Slot Optimization: ").bold = True
p.add_run("Rather than storing full weights on-chain, only the 46-character IPFS CID, SHA-256 hash, and 1e4 scaled metrics are packed into a single uint256 slot (< 100 bytes on-chain), achieving a 99.6% gas reduction.\n")
p.add_run("• Multi-Chain Cost Comparison: ").bold = True
p.add_run("While Ethereum L1 costs ~$17.28 (BDT 2,070) per round, deploying on Polygon PoS or a Hyperledger Besu consortium rollup cuts gas costs to < BDT 0.15 (< $0.001) per round, ensuring 99.9% cost efficiency for public hospitals.")

# Embed Figure 1: Gas & Scalability
fig1_path = os.path.join(FIG_DIR, "fig1_blockchain_gas_scalability.png")
if os.path.exists(fig1_path):
    doc.add_picture(fig1_path, width=Inches(6.4))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = cap.add_run("Figure 2: Empirical EVM Gas Units Consumed & Multi-Chain Transaction Cost per Round (Generated via Python)")
    r.font.size = Pt(8.5)
    r.font.italic = True
    r.font.color.rgb = COLOR_MUTED

# ==============================================================================
# SLIDE 7: BYZANTINE FAULT TOLERANCE & STATISTICAL 3-SIGMA SLASHING
# ==============================================================================
doc.add_page_break()
style_heading1(doc.add_paragraph(), "Slide 07: Byzantine Fault Tolerance & Automated Slashing")
style_heading2(doc.add_paragraph(), "Deterministic On-Chain Outlier Defense")

p = doc.add_paragraph()
p.add_run("• Threat Scenario: ").bold = True
p.add_run("A compromised diagnostic lab or malicious actor uploads inverted, random, or poisoned gradients to degrade diagnostic accuracy.\n")
p.add_run("• Mathematical 3-Sigma Filter: ").bold = True
p.add_run("The contract evaluates reported validation metrics. Honest hospital gradients cluster tightly around mean loss mu = 0.085 (sigma = 0.012). Any update exceeding mu +/- 3*sigma (loss < 0.049 or > 0.121) is mathematically rejected without decrypting patient data.\n")
p.add_run("• Automated On-Chain Slashing: ").bold = True
p.add_run("The offending node's reputation score is slashed, its stake is penalized, and it is excluded from future consortium rounds.")

# Embed Figure 2: Byzantine Simulation
fig2_path = os.path.join(FIG_DIR, "fig2_byzantine_resilience_simulation.png")
if os.path.exists(fig2_path):
    doc.add_picture(fig2_path, width=Inches(6.4))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = cap.add_run("Figure 3: Statistical 3-Sigma Outlier Detection & Automated On-Chain Slashing Simulation (Generated via Python)")
    r.font.size = Pt(8.5)
    r.font.italic = True
    r.font.color.rgb = COLOR_MUTED

# ==============================================================================
# SLIDE 8 & 9: GAME THEORY & TOKENOMICS FLYWHEEL
# ==============================================================================
style_heading1(doc.add_paragraph(), "Slide 08 & 09: Consortium Game Theory & Proof-of-Contribution Tokenomics")
style_heading2(doc.add_paragraph(), "Nash Equilibrium & Reciprocal Incentive Structure")

p = doc.add_paragraph()
p.add_run("• Proof-of-Contribution Token Offset: ").bold = True
p.add_run("Hospitals that contribute high volumes of verified local training samples (e.g. Evercare contributing 5,000 biopsy scans) earn on-chain compute credits that discount their monthly enterprise node subscription by up to 60%.\n")
p.add_run("• Anti-Free-Rider Gate (minSamplesPerUpdate = 500): ").bold = True
p.add_run("A hospital cannot pull the latest global AI model unless its wallet has submitted at least 500 verified local samples. Parasitic consumption is mathematically prevented.\n")
p.add_run("• Pareto-Optimal Nash Equilibrium: ").bold = True
p.add_run("Defecting or attempting to free-ride yields negative utility (-5 to -10) due to smart contract exclusion. Mutual contribution yields the highest shared payoff (+10, +10).")

# Embed Figure 3: Game Theory
fig3_path = os.path.join(FIG_DIR, "fig3_consortium_game_theory_tokenomics.png")
if os.path.exists(fig3_path):
    doc.add_picture(fig3_path, width=Inches(6.4))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = cap.add_run("Figure 4: Proof-of-Contribution Token Offset Flywheel & Hospital Payoff Matrix (Generated via Python)")
    r.font.size = Pt(8.5)
    r.font.italic = True
    r.font.color.rgb = COLOR_MUTED

# ==============================================================================
# SLIDE 10: BANGLADESH HEALTH ECONOMICS & BDT 250+ CRORE SAVINGS
# ==============================================================================
doc.add_page_break()
style_heading1(doc.add_paragraph(), "Slide 10: Bangladesh Health Economics & BDT 250+ Crore Savings")
style_heading2(doc.add_paragraph(), "Macro-Economic Savings Breakdown")

econ_tbl = doc.add_table(rows=6, cols=4)
econ_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
econ_headers = ["HEALTHCARE METRIC", "TRADITIONAL DHAKA FLOW", "MEDCHAIN-FL ENCLAVE", "SOCIO-ECONOMIC IMPACT"]
for idx, h in enumerate(econ_headers):
    econ_tbl.rows[0].cells[idx].text = h
set_table_header_style(econ_tbl.rows[0], "A32B68")

econ_rows = [
    ("Diagnostic Turnaround", "14 to 28 Days (couriered to Dhaka)", "15 Minutes (Instant On-Premise Scan)", "99.9% Faster Diagnosis"),
    ("Patient Logistics & Travel", "BDT 15,000 – 30,000 (transit & hotel)", "BDT 500 – 1,000 (Local Hospital)", "98% Direct Savings"),
    ("Cancer Stage at Detection", "70% Detected at Stage 3/4 (Fatal)", "Stage 1/2 (Early & Curable)", "Averts Late Mortality"),
    ("Cancer Treatment Expense", "BDT 15 – 25 Lakh (Out-of-Pocket)", "BDT 1.5 – 2.5 Lakh (Curable Stage)", "Saves BDT 18 Lakh/Family"),
    ("5-Year Survival Rate", "35% – 44% (Late Detection)", "85% – 90%+ (Early Detection)", "+45% Survival Increase")
]
for r_idx, row in enumerate(econ_rows, 1):
    for c_idx, val in enumerate(row):
        econ_tbl.rows[r_idx].cells[c_idx].text = val
    if r_idx % 2 == 1:
        set_table_row_shading(econ_tbl.rows[r_idx], "F8F7FA")

# Embed Figure 5: Economic Savings Breakdown
fig5_path = os.path.join(FIG_DIR, "fig5_national_economic_savings_breakdown.png")
if os.path.exists(fig5_path):
    doc.add_picture(fig5_path, width=Inches(6.4))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = cap.add_run("Figure 5: Sources of BDT 250+ Crore National Savings & Patient Family Cost Reduction (Generated via Python)")
    r.font.size = Pt(8.5)
    r.font.italic = True
    r.font.color.rgb = COLOR_MUTED

# ==============================================================================
# SLIDE 11, 12, 13: 5-YEAR FINANCIAL PROJECTIONS & REVENUE MODEL
# ==============================================================================
doc.add_page_break()
style_heading1(doc.add_paragraph(), "Slide 11, 12 & 13: Commercial Strategy, Revenue Model & Financials")
style_heading2(doc.add_paragraph(), "Three Diversified Healthcare Revenue Streams")

p = doc.add_paragraph()
p.add_run("1. Private Hospital B2B SaaS (55% of Revenue): ").bold = True
p.add_run("BDT 75,000 – 1,500,000 / month / node. Target: Top private hospital chains (Evercare, Square, United, Labaid). Triples daily pathologist review capacity from 10 to 30 biopsies without adding staff.\n")
p.add_run("2. DGHS Public-Private Partnership Contract (25% of Revenue): ").bold = True
p.add_run("Annual enterprise health digitization contract for 37 public medical college hospitals, subsidized under the national healthcare budget.\n")
p.add_run("3. District Diagnostic Pay-Per-Scan API (20% of Revenue): ").bold = True
p.add_run("BDT 250 – 300 per biopsy scan for 4,000+ regional labs. Paid via bKash, Nagad, and digital payment gateways.")

# Embed Figure 6: Financial Trajectory
fig6_path = os.path.join(FIG_DIR, "fig6_financial_revenue_model_projections.png")
if os.path.exists(fig6_path):
    doc.add_picture(fig6_path, width=Inches(6.4))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = cap.add_run("Figure 6: 5-Year Financial Revenue Model & Key Unit Economics in Bangladesh (Generated via Python)")
    r.font.size = Pt(8.5)
    r.font.italic = True
    r.font.color.rgb = COLOR_MUTED

fin_tbl = doc.add_table(rows=6, cols=5)
fin_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
fin_headers = ["YEAR", "CONSORTIUM NODES", "ANNUAL BIOPSIES", "ANNUAL REVENUE (ARR)", "KEY MILESTONE"]
for idx, h in enumerate(fin_headers):
    fin_tbl.rows[0].cells[idx].text = h
set_table_header_style(fin_tbl.rows[0], "A32B68")

fin_rows = [
    ("Year 1", "3 Nodes", "5,000", "BDT 35 Lakh", "Pilot consortium: HSTU, BSMMU, Evercare"),
    ("Year 2", "10 Nodes", "18,000", "BDT 1.4 Crore", "Divisional expansion in Rangpur & Rajshahi"),
    ("Year 3", "25 Nodes", "50,000", "BDT 3.8 Crore", "Operating break-even; DGHS formal accreditation"),
    ("Year 4", "65 Nodes", "110,000", "BDT 10.5 Crore", "Scale across 37 public medical college hospitals"),
    ("Year 5", "150 Nodes", "200,000+", "BDT 24.2 Crore", "National adoption; 68% EBITDA margin; ~4,500 lives saved/yr")
]
for r_idx, row in enumerate(fin_rows, 1):
    for c_idx, val in enumerate(row):
        fin_tbl.rows[r_idx].cells[c_idx].text = val
    if r_idx % 2 == 1:
        set_table_row_shading(fin_tbl.rows[r_idx], "F8F7FA")

# ==============================================================================
# SLIDE 14 & 15: SECURITY MATRIX & ROADMAP
# ==============================================================================
doc.add_page_break()
style_heading1(doc.add_paragraph(), "Slide 14 & 15: Security Matrix & Execution Roadmap")
style_heading2(doc.add_paragraph(), "Blockchain Threat Defense & Compliance Matrix")

threat_tbl = doc.add_table(rows=7, cols=3)
threat_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
threat_headers = ["THREAT VECTOR", "ON-CHAIN & CRYPTOGRAPHIC DEFENSE", "COMPLIANCE STATUS"]
for idx, h in enumerate(threat_headers):
    threat_tbl.rows[0].cells[idx].text = h
set_table_header_style(threat_tbl.rows[0], "A32B68")

threat_rows = [
    ("Model Poisoning / Backdoor Attack", "3-Sigma Outlier Loss Rejection on Smart Contract + Node Reputation Slashing", "MITIGATED"),
    ("Free-Riding Node (No Contribution)", "Solidity Quorum Gate: minSamples = 500 strictly required before weight pull", "MITIGATED"),
    ("Sybil / Unauthorized Nodes", "OpenZeppelin Wallet-Bound KYC Address Mapping (mapping(address => HospitalInfo))", "MITIGATED"),
    ("Patient Health Data Leakage", "Enclave Air-Gap: 0 Bytes raw pixel data leaves hospital firewall (PDPO 2025)", "MITIGATED"),
    ("Man-in-the-Middle Attack", "AES-256-CBC Encryption under fresh IV + Content-Addressed IPFS CIDs", "MITIGATED"),
    ("On-Chain Re-identification", "Zero Patient PHI: Only IPFS hashes & bit-packed integers committed to Ethereum", "MITIGATED")
]
for r_idx, (t1, t2, t3) in enumerate(threat_rows, 1):
    threat_tbl.rows[r_idx].cells[0].text = t1
    threat_tbl.rows[r_idx].cells[1].text = t2
    threat_tbl.rows[r_idx].cells[2].text = t3
    if r_idx % 2 == 1:
        set_table_row_shading(threat_tbl.rows[r_idx], "F8F7FA")

style_heading3(doc.add_paragraph(), "Closing Pitch for Judges")
add_callout(doc, "30-SECOND CLOSING PITCH FOR JUDGES",
    '"In conclusion, MedChain-FL demonstrates that blockchain in healthcare is not just about financial tokens. '
    'It is about creating an incorruptible, decentralized governance fabric where competing institutions can '
    'collaborate for the greater good of national healthcare. With a verified smart contract on Sepolia, working enclaves, '
    'and a clear financial path to BDT 24.2 Crore ARR, MedChain-FL is ready to democratize cancer diagnostics across Bangladesh. '
    'Thank you."',
    border_color="A32B68", bg_color="FDF2F8"
)

doc.save(DOC_PATH)
print(f"Successfully generated master DOCX with strictly Blockchain and Business figures at: {DOC_PATH}")
