#!/usr/bin/env python3
"""
Enhanced Generator script for BCOLBD 2026 MedChain-FL presentation.
Engineered specifically for Blockchain Olympiad judging:
- Native PowerPoint tables with colored header rows and alternating row fills
- Visual stat badges, pricing pills, and ROI callouts
- Rich cards with high contrast and zero walls of text
"""

import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

# Professional Palette
MAGENTA = RGBColor(163, 43, 104)      # Primary accent #A32B68
MAGENTA_LIGHT = RGBColor(253, 242, 248)
TEAL = RGBColor(13, 148, 136)         # Secondary accent #0D9488
TEAL_LIGHT = RGBColor(240, 253, 250)
DARK = RGBColor(46, 39, 51)           # Deep slate heading #2E2733
MUTED = RGBColor(107, 100, 114)       # Slate muted #6B6472
LIGHT_BG = RGBColor(255, 255, 255)    # Clean white
CARD_BG = RGBColor(248, 247, 250)     # Light soft card #F8F7FA
CARD_BORDER = RGBColor(230, 226, 233) # Subtle border #E6E2E9
GREEN = RGBColor(22, 163, 74)         # Emerald green #16A34A
GREEN_LIGHT = RGBColor(240, 253, 244)
RED = RGBColor(220, 38, 38)           # Ruby red #DC2626
RED_LIGHT = RGBColor(254, 242, 242)
WHITE = RGBColor(255, 255, 255)
AMBER = RGBColor(217, 119, 6)
AMBER_LIGHT = RGBColor(254, 249, 195)

IMG_DIR = "/tmp/pptx_imgs"

def add_header(slide, eyebrow_text, title_text, slide_num):
    # Eyebrow
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(10), Inches(0.25))
    tf = tb.text_frame
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = eyebrow_text.upper()
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = MAGENTA
    
    # Title
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.62), Inches(11.5), Inches(0.55))
    tf = tb.text_frame
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = title_text
    p.font.size = Pt(21)
    p.font.bold = True
    p.font.color.rgb = DARK

    # Footer
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(9.0), Inches(0.25))
    tf = tb.text_frame
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = "MedChain-FL  ·  Team FedGuard  ·  BCOLBD 2026"
    p.font.size = Pt(8.5)
    p.font.color.rgb = MUTED

    # Slide Number
    tb = slide.shapes.add_textbox(Inches(12.0), Inches(7.05), Inches(0.6), Inches(0.25))
    tf = tb.text_frame
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = str(slide_num).zfill(2)
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = MUTED
    p.alignment = PP_ALIGN.RIGHT

def create_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_color
    shape.line.color.rgb = border_color
    shape.line.width = Pt(1)
    return shape

# ==============================================================================
# SLIDE 1: TITLE & TEAM
# ==============================================================================
slide1 = prs.slides.add_slide(blank_layout)
tb = slide1.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(11.5), Inches(0.3))
tf = tb.text_frame
p = tf.paragraphs[0]
p.text = "BCOLBD 2026   ·   BLOCKCHAIN CATEGORY   ·   HEALTHTECH TRACK"
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = MAGENTA

tb = slide1.shapes.add_textbox(Inches(0.8), Inches(1.45), Inches(11.5), Inches(1.1))
tf = tb.text_frame
p = tf.paragraphs[0]
p.text = "MedChain-FL"
p.font.size = Pt(46)
p.font.bold = True
p.font.color.rgb = DARK

tb = slide1.shapes.add_textbox(Inches(0.8), Inches(2.6), Inches(11.5), Inches(0.6))
tf = tb.text_frame
p = tf.paragraphs[0]
p.text = "Ethereum–IPFS Smart Contract Framework for Privacy-Preserving Federated Healthcare AI"
p.font.size = Pt(15)
p.font.color.rgb = MUTED

# Pillars Ribbon Card
create_card(slide1, Inches(0.8), Inches(3.5), Inches(11.7), Inches(1.5), CARD_BG, CARD_BORDER)
pillar_data = [
    ("Consortium Ledger", "Solidity State Machine", "0x1BE4... Sepolia Live"),
    ("Zero Patient Leakage", "100% On-Premise Enclave", "PDPO 2025 Compliant"),
    ("Clinical PyTorch", "EfficientNet-B0 + CoordAtt", "98.95% Malignant Acc"),
    ("Bangladesh Healthcare", "28 Days → 15 Minutes", "BDT 250 Cr Saved/Yr")
]
for idx, (title, sub1, sub2) in enumerate(pillar_data):
    x_offset = Inches(1.0 + idx * 2.9)
    tb = slide1.shapes.add_textbox(x_offset, Inches(3.7), Inches(2.7), Inches(1.1))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = title
    p1.font.size = Pt(12)
    p1.font.bold = True
    p1.font.color.rgb = MAGENTA
    p2 = tf.add_paragraph()
    p2.text = sub1
    p2.font.size = Pt(10)
    p2.font.color.rgb = DARK
    p3 = tf.add_paragraph()
    p3.text = sub2
    p3.font.size = Pt(9)
    p3.font.color.rgb = MUTED

tb = slide1.shapes.add_textbox(Inches(0.8), Inches(5.3), Inches(8.5), Inches(1.2))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "Team FedGuard   ·   Team ID: 6a7f01a5baff6"
p1.font.size = Pt(12)
p1.font.bold = True
p1.font.color.rgb = DARK
p2 = tf.add_paragraph()
p2.text = "Shahriar Hasan  ·  Md. Taufiq Biswas  ·  Md Najib Ul Azam Mahi"
p2.font.size = Pt(10)
p2.font.color.rgb = DARK
p3 = tf.add_paragraph()
p3.text = "Dept. of Electronics and Communication Engineering (ECE), HSTU, Dinajpur"
p3.font.size = Pt(10)
p3.font.bold = True
p3.font.color.rgb = TEAL

logo_path = os.path.join(IMG_DIR, "slide_1_img_1.png")
if os.path.exists(logo_path):
    slide1.shapes.add_picture(logo_path, Inches(9.8), Inches(5.3), width=Inches(2.5))

# ==============================================================================
# SLIDE 2: THE BANGLADESH CRISIS
# ==============================================================================
slide2 = prs.slides.add_slide(blank_layout)
add_header(slide2, "01 · THE PROBLEM IN BANGLADESH", "Catastrophic Diagnostic Bottleneck & Hospital Data Distrust", 1)

stats = [
    ("1 : 1,000,000", "PATHOLOGIST SCARCITY", "Only ~170 histopathologists in BD for 173M citizens. Critical oncology deficit.", RED),
    ("70%+ in Dhaka", "REGIONAL HEALTH DIVIDE", "Divisional hubs (Rangpur, Dinajpur, Barisal) lack oncopathologists; tissue sent to Dhaka.", MAGENTA),
    ("14 – 28 Days", "DIAGNOSTIC TURNAROUND", "Weeks-long courier delay causes 70% of breast cancers to be diagnosed at fatal Stage 3/4.", DARK)
]

for idx, (num, label, desc, color) in enumerate(stats):
    create_card(slide2, Inches(0.8 + idx * 4.0), Inches(1.35), Inches(3.7), Inches(2.7))
    tb = slide2.shapes.add_textbox(Inches(1.0 + idx * 4.0), Inches(1.55), Inches(3.3), Inches(2.3))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = num
    p1.font.size = Pt(32)
    p1.font.bold = True
    p1.font.color.rgb = color
    p2 = tf.add_paragraph()
    p2.text = label
    p2.font.size = Pt(10.5)
    p2.font.bold = True
    p2.font.color.rgb = DARK
    p3 = tf.add_paragraph()
    p3.text = desc
    p3.font.size = Pt(9.5)
    p3.font.color.rgb = MUTED

create_card(slide2, Inches(0.8), Inches(4.3), Inches(11.7), Inches(2.4), RED_LIGHT, RGBColor(254, 202, 202))
tb = slide2.shapes.add_textbox(Inches(1.1), Inches(4.5), Inches(11.1), Inches(2.0))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "THE CENTRALIZATION PARADOX & LEGAL MANDATE (PDPO 2025)"
p1.font.size = Pt(11)
p1.font.bold = True
p1.font.color.rgb = RED
p2 = tf.add_paragraph()
p2.text = "• Hospital Rivalry: Top private hospital chains (Evercare, Square, United) and government colleges will NEVER share raw biopsy images."
p2.font.size = Pt(10)
p2.font.color.rgb = DARK
p3 = tf.add_paragraph()
p3.text = "• The 2023 National Breach: 50M+ citizen records leaked via one exposed government API proved central databases in BD are catastrophic."
p3.font.size = Pt(10)
p3.font.color.rgb = DARK
p4 = tf.add_paragraph()
p4.text = "• Personal Data Protection Ordinance (PDPO) 2025: Strict statutory prohibition against central pooling or exporting patient medical records."
p4.font.size = Pt(10)
p4.font.bold = True
p4.font.color.rgb = RED

# ==============================================================================
# SLIDE 3: WHY BLOCKCHAIN IS MANDATORY
# ==============================================================================
slide3 = prs.slides.add_slide(blank_layout)
add_header(slide3, "02 · THE BLOCKCHAIN IMPERATIVE", "Federation Breaks Silos. Only Blockchain Removes the Trusted Operator.", 2)

cols = [
    ("CENTRALIZED POOL", "❌ Broken Architecture", [
        "Single point of failure and attack",
        "Host hospital controls entire AI model",
        "Rival hospital distrust prevents participation",
        "Violates PDPO 2025 data protection law"
    ], RED_LIGHT, RED),
    ("FEDERATED AI ALONE", "⚠️ Incomplete Solution", [
        "Still requires trusted central aggregator server",
        "Free-riding nodes cannot be prevented on-chain",
        "No tamper-proof multi-hospital audit trail",
        "Vulnerable to coordinator model poisoning"
    ], AMBER_LIGHT, AMBER),
    ("MEDCHAIN-FL (BLOCKCHAIN)", "✅ Trustless Consortium", [
        "Decentralized Solidity smart contract coordinator",
        "Zero raw patient data leaves hospital firewall",
        "Math-enforced anti-free-riding & quorum rules",
        "Immutable audit ledger for DGHS regulatory inspection"
    ], GREEN_LIGHT, GREEN)
]

for idx, (title, tag, lines, bg, accent) in enumerate(cols):
    create_card(slide3, Inches(0.8 + idx * 4.0), Inches(1.35), Inches(3.7), Inches(3.9), bg, accent)
    tb = slide3.shapes.add_textbox(Inches(1.0 + idx * 4.0), Inches(1.55), Inches(3.3), Inches(3.5))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = title
    p1.font.size = Pt(12)
    p1.font.bold = True
    p1.font.color.rgb = DARK
    p2 = tf.add_paragraph()
    p2.text = tag
    p2.font.size = Pt(10.5)
    p2.font.bold = True
    p2.font.color.rgb = accent
    for l in lines:
        p = tf.add_paragraph()
        p.text = "• " + l
        p.font.size = Pt(9.5)
        p.font.color.rgb = DARK

create_card(slide3, Inches(0.8), Inches(5.5), Inches(11.7), Inches(1.2))
tb = slide3.shapes.add_textbox(Inches(1.1), Inches(5.65), Inches(11.1), Inches(0.9))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "GOVERNANCE INSIGHT FOR BLOCKCHAIN OLYMPIAD JUDGES:"
p1.font.size = Pt(10)
p1.font.bold = True
p1.font.color.rgb = MAGENTA
p2 = tf.add_paragraph()
p2.text = "In a multi-hospital consortium of commercial rivals, trust cannot rely on an administrative password or bilateral legal contracts — it must be governed by an autonomous, immutable smart contract on Ethereum that nobody owns and everyone verifies."
p2.font.size = Pt(10)
p2.font.color.rgb = DARK

# ==============================================================================
# SLIDE 4: SYSTEM ARCHITECTURE
# ==============================================================================
slide4 = prs.slides.add_slide(blank_layout)
add_header(slide4, "03 · SYSTEM ARCHITECTURE", "Three Decoupled Tiers: Enclave, Swarm, and Ethereum Ledger", 3)

arch_img = os.path.join(IMG_DIR, "slide_6_img_2.png")
if os.path.exists(arch_img):
    slide4.shapes.add_picture(arch_img, Inches(0.8), Inches(1.35), width=Inches(7.2))

tiers = [
    ("TIER 1: HOSPITAL ENCLAVE", "Node.js + PyTorch inside hospital firewall\nZero patient biopsy images leave node\nLocal FedProx weight delta calculation", MAGENTA),
    ("TIER 2: IPFS SWARM STORAGE", "AES-256-CBC encrypted parameter vectors\nContent-addressed 46-char CID storage\n23.6 MB model zipped to < 10 MB on wire", TEAL),
    ("TIER 3: SEPOLIA LEDGER", "Solidity smart contract (0x1BE4...)\nState machine coordination & round gating\nBit-packed metrics (<100 bytes on-chain)", DARK)
]
for idx, (head, body, col) in enumerate(tiers):
    create_card(slide4, Inches(8.3), Inches(1.35 + idx * 1.8), Inches(4.2), Inches(1.65))
    tb = slide4.shapes.add_textbox(Inches(8.5), Inches(1.45 + idx * 1.8), Inches(3.8), Inches(1.45))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = head
    p1.font.size = Pt(10)
    p1.font.bold = True
    p1.font.color.rgb = col
    for line in body.split("\n"):
        p = tf.add_paragraph()
        p.text = "• " + line
        p.font.size = Pt(8.5)
        p.font.color.rgb = DARK

create_card(slide4, Inches(0.8), Inches(5.6), Inches(11.7), Inches(1.1), GREEN_LIGHT, GREEN)
tb = slide4.shapes.add_textbox(Inches(1.0), Inches(5.75), Inches(11.3), Inches(0.8))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "ZERO-LEAKAGE AIR-GAP GUARANTEE: 0 BYTES RAW PATIENT BIOPY LEAVES NODE"
p1.font.size = Pt(10.5)
p1.font.bold = True
p1.font.color.rgb = GREEN
p2 = tf.add_paragraph()
p2.text = "Only encrypted mathematical gradient descriptors leave the local enclave. Hospital firewalls enforce zero outbound raw pixel streams. Cryptographically verified non-repudiation."
p2.font.size = Pt(9.5)
p2.font.color.rgb = DARK

# ==============================================================================
# SLIDE 5: HOW A TRAINING ROUND WORKS
# ==============================================================================
slide5 = prs.slides.add_slide(blank_layout)
add_header(slide5, "04 · CONSENSUS PROTOCOL", "Deterministic 5-Step Smart Contract State Machine", 4)

steps = [
    ("1. Round Opens", "Sepolia Contract", "Operator triggers new round;\nBase model IPFS CID published on-chain.", MAGENTA),
    ("2. Local Pull", "Hospital Enclave", "Hospitals fetch encrypted global weights;\nDecrypt in memory on CPU.", TEAL),
    ("3. FedProx Train", "PyTorch Local", "Local gradient descent with proximal drift penalty mu.\nZero data shared.", DARK),
    ("4. Encrypt & Post", "IPFS + Ledger", "AES-256 weights to IPFS;\nSHA-256 digest & packed metrics committed.", TEAL),
    ("5. Finalize", "Solidity Lineage", "Contract verifies all quorum;\nFedAvg consensus executed;\nGlobal CID committed.", GREEN)
]

for idx, (s_title, s_sub, s_desc, s_color) in enumerate(steps):
    create_card(slide5, Inches(0.8 + idx * 2.38), Inches(1.5), Inches(2.25), Inches(3.7))
    tb = slide5.shapes.add_textbox(Inches(0.95 + idx * 2.38), Inches(1.7), Inches(1.95), Inches(3.3))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = s_title
    p1.font.size = Pt(12)
    p1.font.bold = True
    p1.font.color.rgb = s_color
    p2 = tf.add_paragraph()
    p2.text = s_sub
    p2.font.size = Pt(9.5)
    p2.font.bold = True
    p2.font.color.rgb = DARK
    p3 = tf.add_paragraph()
    p3.text = s_desc
    p3.font.size = Pt(8.5)
    p3.font.color.rgb = MUTED

create_card(slide5, Inches(0.8), Inches(5.5), Inches(11.7), Inches(1.2), CARD_BG, MAGENTA)
tb = slide5.shapes.add_textbox(Inches(1.1), Inches(5.65), Inches(11.1), Inches(0.9))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "SMART CONTRACT RULE: ALL SUBMISSIONS REQUIRED BEFORE FINALIZATION"
p1.font.size = Pt(10)
p1.font.bold = True
p1.font.color.rgb = MAGENTA
p2 = tf.add_paragraph()
p2.text = "A round cannot finalize without quorum. If a hospital node drops or attempts a free-ride attack, the contract prevents round closure, penalizes node reliability score, and requires manual operator intervention justification."
p2.font.size = Pt(9.5)
p2.font.color.rgb = DARK

# ==============================================================================
# SLIDE 6: DATA MODEL & STORAGE ECONOMICS
# ==============================================================================
slide6 = prs.slides.add_slide(blank_layout)
add_header(slide6, "05 · DATA SOVEREIGNTY & GAS OPTIMIZATION", "What Goes On-Chain — And What Deliberately Does Not", 5)

create_card(slide6, Inches(0.8), Inches(1.35), Inches(5.6), Inches(4.0))
tb = slide6.shapes.add_textbox(Inches(1.1), Inches(1.55), Inches(5.0), Inches(3.6))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "OFF-CHAIN (Hospital Enclave & IPFS)"
p1.font.size = Pt(14)
p1.font.bold = True
p1.font.color.rgb = DARK
off_items = [
    ("Patient Biopsy Slides (15–50 MB)", "NEVER transmitted anywhere. Kept behind firewall."),
    ("Raw Encrypted Weights (23.6 MB)", "Zipped with AES-256-CBC, pinned to Pinata IPFS swarm."),
    ("PyTorch Local Training", "Executes on commodity CPU inside hospital premises."),
    ("Hospital Private Credentials", "Hospital private keys never leave local environment.")
]
for title, desc in off_items:
    p = tf.add_paragraph()
    p.text = "• " + title + ": "
    p.font.bold = True
    p.font.size = Pt(9.5)
    p.font.color.rgb = DARK
    run = p.add_run()
    run.text = desc
    run.font.bold = False
    run.font.color.rgb = MUTED

create_card(slide6, Inches(6.9), Inches(1.35), Inches(5.6), Inches(4.0), GREEN_LIGHT, GREEN)
tb = slide6.shapes.add_textbox(Inches(7.2), Inches(1.55), Inches(5.0), Inches(3.6))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "ON-CHAIN (Ethereum Sepolia Contract)"
p1.font.size = Pt(14)
p1.font.bold = True
p1.font.color.rgb = GREEN
on_items = [
    ("Hospital Registry Mapping", "Wallet-bound KYC address (mapping(address => HospitalInfo))."),
    ("IPFS Content Identifiers", "46-character cryptographic CIDs for global & local weights."),
    ("Bit-Packed Metrics (<100 Bytes)", "Accuracy and AUC scaled & packed into single uint256 slot."),
    ("Immutable Audit Trail", "Verifiable timestamped receipt log for DGHS / MoHFW inspection.")
]
for title, desc in on_items:
    p = tf.add_paragraph()
    p.text = "• " + title + ": "
    p.font.bold = True
    p.font.size = Pt(9.5)
    p.font.color.rgb = DARK
    run = p.add_run()
    run.text = desc
    run.font.bold = False
    run.font.color.rgb = MUTED

create_card(slide6, Inches(0.8), Inches(5.6), Inches(11.7), Inches(1.1))
tb = slide6.shapes.add_textbox(Inches(1.1), Inches(5.75), Inches(11.1), Inches(0.8))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "DATA COMPRESSION PIPELINE & EVM STORAGE OPTIMIZATION:"
p1.font.size = Pt(9.5)
p1.font.bold = True
p1.font.color.rgb = MAGENTA
p2 = tf.add_paragraph()
p2.text = "23.6 MB PyTorch Model  ──►  < 10 MB Encrypted IPFS Swarm  ──►  < 100 Bytes Committed On-Chain (99.6% Gas Reduction)"
p2.font.size = Pt(11)
p2.font.bold = True
p2.font.color.rgb = TEAL

# ==============================================================================
# SLIDE 7: SMART CONTRACT ARCHITECTURE & BYZANTINE TOLERANCE
# ==============================================================================
slide7 = prs.slides.add_slide(blank_layout)
add_header(slide7, "06 · SMART CONTRACT & CONSENSUS", "Solidity State Machine Deployed on Ethereum Sepolia", 6)

create_card(slide7, Inches(0.8), Inches(1.35), Inches(11.7), Inches(0.9), CARD_BG, TEAL)
tb = slide7.shapes.add_textbox(Inches(1.1), Inches(1.45), Inches(11.1), Inches(0.7))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "DEPLOYED SMART CONTRACT: FederatedModelRegistry.sol"
p1.font.size = Pt(11)
p1.font.bold = True
p1.font.color.rgb = TEAL
p2 = tf.add_paragraph()
p2.text = "Sepolia Address: 0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1  |  Block: 10254150  |  OpenZeppelin v5.0 (ReentrancyGuard, Pausable, Ownable)"
p2.font.size = Pt(9)
p2.font.color.rgb = DARK

c_items = [
    ("CONSENSUS STATE MACHINE", "Enforced Function Transitions", [
        "registerHospital(addr, name, region)",
        "openRound(version, baseCID)",
        "submitModelUpdate(weightsCID, hash)",
        "publishGlobalModel(version, acc)",
        "Strict access control prevents unauthorized model injection."
    ], MAGENTA),
    ("BYZANTINE DEFENSE", "Anti-Poisoning & Slashing", [
        "3-Sigma Outlier Detection on loss",
        "Parameter key parity verification",
        "Malicious gradient auto-rejection",
        "On-chain node reputation slashing",
        "Protects against rogue or compromised lab nodes."
    ], RED),
    ("ANTI-FREE-RIDER GATE", "Game-Theoretic Incentives", [
        "minSamplesPerUpdate = 500 strictly required",
        "Cannot pull global weights without valid update",
        "Proof-of-Contribution records cumulative samples",
        "Incentivizes long-term data contribution",
        "Game-theoretic equilibrium among hospital nodes."
    ], GREEN)
]
for idx, (title, sub, lines, color) in enumerate(c_items):
    create_card(slide7, Inches(0.8 + idx * 4.0), Inches(2.45), Inches(3.7), Inches(4.3))
    tb = slide7.shapes.add_textbox(Inches(1.0 + idx * 4.0), Inches(2.65), Inches(3.3), Inches(3.9))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = title
    p1.font.size = Pt(11.5)
    p1.font.bold = True
    p1.font.color.rgb = color
    p2 = tf.add_paragraph()
    p2.text = sub
    p2.font.size = Pt(9.5)
    p2.font.bold = True
    p2.font.color.rgb = DARK
    for line in lines:
        p = tf.add_paragraph()
        p.text = "• " + line
        p.font.size = Pt(8.5)
        p.font.color.rgb = MUTED

# ==============================================================================
# SLIDE 8: CLINICAL AI ENGINE (PUNCHY 1-SLIDE SUMMARY)
# ==============================================================================
slide8 = prs.slides.add_slide(blank_layout)
add_header(slide8, "07 · CLINICAL AI VALIDATION", "CoAtt-FedNet: Clinical-Grade Oncology on Commodity CPU", 7)

ai_stats = [
    ("98.95%", "OVERALL ACCURACY", "Surpasses published state-of-the-art benchmarks (97.54%).", GREEN),
    ("99.45%", "MALIGNANT RECALL", "Virtually zero missed cancer biopsies across test splits.", MAGENTA),
    ("0.9995", "ROC-AUC SCORE", "Clinical grade discrimination confidence with 98.80% precision.", TEAL),
    ("5.9M", "PARAMETERS (EFFICIENTNET)", "15× lighter than Vision Transformers. Runs in 580ms on hospital CPU.", DARK)
]
for idx, (num, lbl, desc, col) in enumerate(ai_stats):
    create_card(slide8, Inches(0.8 + idx * 3.0), Inches(1.35), Inches(2.7), Inches(2.1))
    tb = slide8.shapes.add_textbox(Inches(0.95 + idx * 3.0), Inches(1.5), Inches(2.4), Inches(1.8))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = num
    p1.font.size = Pt(28)
    p1.font.bold = True
    p1.font.color.rgb = col
    p2 = tf.add_paragraph()
    p2.text = lbl
    p2.font.size = Pt(9.5)
    p2.font.bold = True
    p2.font.color.rgb = DARK
    p3 = tf.add_paragraph()
    p3.text = desc
    p3.font.size = Pt(8.5)
    p3.font.color.rgb = MUTED

plot1 = os.path.join(IMG_DIR, "slide_9_img_11.png")
plot2 = os.path.join(IMG_DIR, "slide_10_img_2.png")
if os.path.exists(plot1):
    slide8.shapes.add_picture(plot1, Inches(0.8), Inches(3.65), width=Inches(5.7))
if os.path.exists(plot2):
    slide8.shapes.add_picture(plot2, Inches(6.8), Inches(3.65), width=Inches(5.7))

# ==============================================================================
# SLIDE 9: LIVE WORKING PROTOTYPE
# ==============================================================================
slide9 = prs.slides.add_slide(blank_layout)
add_header(slide9, "08 · PRODUCTION PROTOTYPE", "Live End-to-End System Operational on Custom Domains", 8)

proto_img = os.path.join(IMG_DIR, "slide_11_img_2.png")
if os.path.exists(proto_img):
    slide9.shapes.add_picture(proto_img, Inches(0.8), Inches(1.35), width=Inches(4.8))

endpoints = [
    ("HOSPITAL WORKSTATION ENCLAVE", "https://medchain.paradox-bd.com", "Pathologist biopsy scan UI · PyTorch CPU inference · FedProx local optimizer · Verifiable receipt ledger.", MAGENTA),
    ("CENTRAL OPERATOR COCKPIT", "https://cockpit.medchain.paradox-bd.com", "Consensus monitor · Candidate approval console · Outbox delivery retry · Retention audit.", TEAL),
    ("FEDERATED AGGREGATOR CORE", "https://api.medchain.paradox-bd.com", "NestJS microservice engine · Neon PostgreSQL (40 tables) · Upstash Redis queue · Cloudflare R2 storage.", DARK),
    ("ETHEREUM SEPOLIA SMART CONTRACT", "0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1", "Verifiable on Etherscan · 39 passing test suites · Genesis model & 3 active hospital test nodes.", GREEN)
]
for idx, (title, url, detail, col) in enumerate(endpoints):
    create_card(slide9, Inches(6.0), Inches(1.35 + idx * 1.3), Inches(6.5), Inches(1.15))
    tb = slide9.shapes.add_textbox(Inches(6.2), Inches(1.4 + idx * 1.3), Inches(6.1), Inches(1.0))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = title
    p1.font.size = Pt(10)
    p1.font.bold = True
    p1.font.color.rgb = col
    p2 = tf.add_paragraph()
    p2.text = url
    p2.font.size = Pt(9)
    p2.font.bold = True
    p2.font.color.rgb = DARK
    p3 = tf.add_paragraph()
    p3.text = detail
    p3.font.size = Pt(8)
    p3.font.color.rgb = MUTED

create_card(slide9, Inches(0.8), Inches(5.9), Inches(11.7), Inches(0.7), CARD_BG, GREEN)
tb = slide9.shapes.add_textbox(Inches(1.1), Inches(6.0), Inches(11.1), Inches(0.5))
tf = tb.text_frame
p = tf.paragraphs[0]
p.text = "✓ ALL BCOLBD MANDATORY CRITERIA SATISFIED: Working UI, backend pipeline, and live verified Sepolia smart contract."
p.font.size = Pt(9.5)
p.font.bold = True
p.font.color.rgb = GREEN

# ==============================================================================
# SLIDE 10: BANGLADESH HEALTH ECONOMICS & COST REDUCTION (NATIVE TABLE)
# ==============================================================================
slide10 = prs.slides.add_slide(blank_layout)
add_header(slide10, "09 · SOCIO-ECONOMIC IMPACT IN BANGLADESH", "Democratizing Diagnostics: Saving BDT 250+ Crore Annually", 9)

# Add Native PPTX Table
table_shape = slide10.shapes.add_table(6, 4, Inches(0.8), Inches(1.35), Inches(11.7), Inches(3.9))
tbl = table_shape.table
tbl.columns[0].width = Inches(2.5)
tbl.columns[1].width = Inches(3.4)
tbl.columns[2].width = Inches(3.4)
tbl.columns[3].width = Inches(2.4)

headers = ["HEALTHCARE METRIC", "TRADITIONAL DHAKA FLOW", "MEDCHAIN-FL ENCLAVE", "SOCIO-ECONOMIC IMPACT"]
for c_idx, h in enumerate(headers):
    cell = tbl.cell(0, c_idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = MAGENTA
    cell.text_frame.margin_left = cell.text_frame.margin_right = Inches(0.1)
    p = cell.text_frame.paragraphs[0]
    p.text = h
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = WHITE

data_rows = [
    ("Diagnostic Turnaround", "14 to 28 Days (tissue courier to Dhaka)", "15 Minutes (Instant On-Premise Scan)", "99.9% Faster Diagnosis"),
    ("Patient Logistics & Travel", "BDT 15,000 – 30,000 (transit & hotel)", "BDT 500 – 1,000 (Local Hospital)", "98% Direct Savings"),
    ("Cancer Stage at Detection", "70% Detected at Stage 3/4 (Fatal)", "Stage 1/2 (Early & Curable)", "Averts Late Mortality"),
    ("Cancer Treatment Expense", "BDT 15 – 25 Lakh (Out-of-Pocket)", "BDT 1.5 – 2.5 Lakh (Curable Stage)", "Saves BDT 18 Lakh/Family"),
    ("5-Year Survival Rate", "35% – 44% (Late Detection)", "85% – 90%+ (Early Detection)", "+45% Survival Increase")
]

for r_idx, row in enumerate(data_rows, 1):
    for c_idx, val in enumerate(row):
        cell = tbl.cell(r_idx, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG if r_idx % 2 == 1 else WHITE
        cell.text_frame.margin_left = cell.text_frame.margin_right = Inches(0.1)
        p = cell.text_frame.paragraphs[0]
        p.text = val
        p.font.size = Pt(9.5)
        p.font.bold = (c_idx == 0 or r_idx == 4 or c_idx == 3)
        p.font.color.rgb = GREEN if (r_idx == 4 or c_idx == 3) else DARK

create_card(slide10, Inches(0.8), Inches(5.45), Inches(11.7), Inches(1.3), GREEN_LIGHT, GREEN)
tb = slide10.shapes.add_textbox(Inches(1.1), Inches(5.6), Inches(11.1), Inches(1.0))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "NATIONAL HEALTHCARE ECONOMIC IMPACT (DGHS & SMART BANGLADESH 2041):"
p1.font.size = Pt(11)
p1.font.bold = True
p1.font.color.rgb = GREEN
p2 = tf.add_paragraph()
p2.text = "Scaling MedChain-FL across 37 government medical colleges and 500 regional diagnostic centers saves the Bangladesh healthcare system over BDT 250+ Crore annually in direct medical costs and averts catastrophic health poverty for thousands of families."
p2.font.size = Pt(10)
p2.font.color.rgb = DARK

# ==============================================================================
# SLIDE 11: MARKET SIZE & ADDRESSABLE OPPORTUNITY
# ==============================================================================
slide11 = prs.slides.add_slide(blank_layout)
add_header(slide11, "10 · MARKET OPPORTUNITY", "Total Addressable Market (TAM) in Bangladesh Healthcare", 10)

markets = [
    ("BDT 1,200 Cr", "TAM (TOTAL ADDRESSABLE)", [
        "4,500+ Registered Diagnostic Centers in BD",
        "173 Million Population across 8 Divisions",
        "30 Million Screening-Age Women in Bangladesh",
        "National oncology diagnostic market potential"
    ], DARK),
    ("BDT 280 Cr", "SAM (SERVICEABLE ADDRESSABLE)", [
        "37 Government Medical College Hospitals",
        "Top 100 Private Hospital Chains & Labs",
        "High-Volume Histopathology Hubs (Dhaka & Divisional)",
        "Primary targets for consortium membership"
    ], TEAL),
    ("BDT 24.2 Cr", "SOM (OBTAINABLE YEAR 5)", [
        "150 Hospital Consortium Nodes",
        "200,000+ Annual Biopsies Processed",
        "Sustainable 68% High-Margin Cashflow",
        "Realistic penetration of BD digital pathology"
    ], MAGENTA)
]

for idx, (num, lbl, body, col) in enumerate(markets):
    create_card(slide11, Inches(0.8 + idx * 4.0), Inches(1.35), Inches(3.7), Inches(3.9))
    tb = slide11.shapes.add_textbox(Inches(1.0 + idx * 4.0), Inches(1.55), Inches(3.3), Inches(3.5))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = num
    p1.font.size = Pt(28)
    p1.font.bold = True
    p1.font.color.rgb = col
    p2 = tf.add_paragraph()
    p2.text = lbl
    p2.font.size = Pt(10)
    p2.font.bold = True
    p2.font.color.rgb = DARK
    for line in body:
        p = tf.add_paragraph()
        p.text = "• " + line
        p.font.size = Pt(9)
        p.font.color.rgb = MUTED

create_card(slide11, Inches(0.8), Inches(5.45), Inches(11.7), Inches(1.2))
tb = slide11.shapes.add_textbox(Inches(1.1), Inches(5.6), Inches(11.1), Inches(0.9))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "NATIONAL STRATEGIC ALIGNMENT:"
p1.font.size = Pt(10)
p1.font.bold = True
p1.font.color.rgb = MAGENTA
p2 = tf.add_paragraph()
p2.text = "1. DGHS Shared Health Record (SHR) Project  |  2. Smart Bangladesh 2041 Healthcare Modernization Mandate  |  3. Global Healthcare AI Market: $1.3B (2023) → $6B+ (2030) growing at 24.5% CAGR."
p2.font.size = Pt(9.5)
p2.font.color.rgb = DARK

# ==============================================================================
# SLIDE 12: CONSORTIUM BUSINESS MODEL & REVENUE STREAMS
# ==============================================================================
slide12 = prs.slides.add_slide(blank_layout)
add_header(slide12, "11 · BUSINESS MODEL", "Three Mutually Reinforcing Healthcare Revenue Streams", 11)

streams = [
    ("STREAM 1: PRIVATE HOSPITAL SAAS", "BDT 75k – 1.5 Lakh / Mo", [
        "Target: Evercare, Square, United, Labaid",
        "Value: Triples pathologist throughput (10 → 30/day)",
        "Zero hardware cost: Runs on commodity hospital PCs",
        "High willingness to pay for throughput expansion"
    ], MAGENTA),
    ("STREAM 2: DGHS & MOHFW CONTRACT", "National PPP Licensing", [
        "Target: 37 Public Medical College Hospitals",
        "Subsidized under Smart Bangladesh 2041 health budget",
        "Decentralizes cancer diagnostics to division levels",
        "Stable recurring annual government contract"
    ], TEAL),
    ("STREAM 3: PAY-PER-SCAN API", "BDT 250 – 300 / Scan", [
        "Target: 4,000+ Regional & District Diagnostic Labs",
        "Enables small district labs to offer AI histopathology",
        "Micro-payments paid via bKash / Nagad / Smart Pay",
        "Huge volume: 200,000+ scans annually by Year 5"
    ], DARK)
]

for idx, (title, pill, lines, color) in enumerate(streams):
    create_card(slide12, Inches(0.8 + idx * 4.0), Inches(1.35), Inches(3.7), Inches(3.9))
    tb = slide12.shapes.add_textbox(Inches(1.0 + idx * 4.0), Inches(1.55), Inches(3.3), Inches(3.5))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = title
    p1.font.size = Pt(11)
    p1.font.bold = True
    p1.font.color.rgb = color
    p2 = tf.add_paragraph()
    p2.text = pill
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = DARK
    for line in lines:
        p = tf.add_paragraph()
        p.text = "• " + line
        p.font.size = Pt(9)
        p.font.color.rgb = MUTED

create_card(slide12, Inches(0.8), Inches(5.45), Inches(11.7), Inches(1.2), CARD_BG, TEAL)
tb = slide12.shapes.add_textbox(Inches(1.1), Inches(5.6), Inches(11.1), Inches(0.9))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "TOKENIZED CONTRIBUTION OFFSETS (PROOF-OF-FEDERATED-CONTRIBUTION):"
p1.font.size = Pt(10)
p1.font.bold = True
p1.font.color.rgb = TEAL
p2 = tf.add_paragraph()
p2.text = "High-volume contributing hospitals (e.g. Evercare contributing 5,000 verified samples) earn on-chain compute credits that discount their annual subscription, creating a self-sustaining game-theoretic flywheel for continuous dataset expansion."
p2.font.size = Pt(9.5)
p2.font.color.rgb = DARK

# ==============================================================================
# SLIDE 13: 5-YEAR FINANCIAL PROJECTIONS & UNIT ECONOMICS
# ==============================================================================
slide13 = prs.slides.add_slide(blank_layout)
add_header(slide13, "12 · FINANCIAL TRAJECTORY", "Path to BDT 24.2 Crore ARR with Near-Zero Gas Unit Economics", 12)

timeline = [
    ("YEAR 1: PILOT CONSORTIUM", "BDT 35 Lakh", [
        "3 Founding Nodes (HSTU Dinajpur, BSMMU, Evercare)",
        "5,000 Biopsies Scanned",
        "Validation on Ethereum Sepolia Testnet",
        "Consortium charter ratified"
    ], DARK),
    ("YEAR 3: REGIONAL EXPANSION", "BDT 3.8 Crore", [
        "25 Hospital & Divisional Diagnostic Nodes",
        "50,000 Biopsies Scanned Annually",
        "Operating Break-even achieved",
        "DGHS formal accreditation secured"
    ], TEAL),
    ("YEAR 5: NATIONAL ADOPTION", "BDT 24.2 Crore", [
        "150 Hospital Consortium Nodes",
        "200,000+ Biopsies Scanned Annually",
        "68% EBITDA Margin",
        "~4,500 Lives Saved Annually across Bangladesh"
    ], GREEN)
]

for idx, (yr, rev, details, col) in enumerate(timeline):
    create_card(slide13, Inches(0.8 + idx * 4.0), Inches(1.35), Inches(3.7), Inches(3.7))
    tb = slide13.shapes.add_textbox(Inches(1.0 + idx * 4.0), Inches(1.55), Inches(3.3), Inches(3.3))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = yr
    p1.font.size = Pt(11)
    p1.font.bold = True
    p1.font.color.rgb = DARK
    p2 = tf.add_paragraph()
    p2.text = rev
    p2.font.size = Pt(28)
    p2.font.bold = True
    p2.font.color.rgb = col
    for line in details:
        p = tf.add_paragraph()
        p.text = "• " + line
        p.font.size = Pt(9)
        p.font.color.rgb = MUTED

create_card(slide13, Inches(0.8), Inches(5.25), Inches(11.7), Inches(1.4), GREEN_LIGHT, GREEN)
tb = slide13.shapes.add_textbox(Inches(1.1), Inches(5.4), Inches(11.1), Inches(1.1))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "BLOCKCHAIN UNIT ECONOMICS: LAYER-2 & CONSORTIUM ROLLUP"
p1.font.size = Pt(10.5)
p1.font.bold = True
p1.font.color.rgb = GREEN
p2 = tf.add_paragraph()
p2.text = "• Ethereum L1 (Sepolia baseline): ~$17.28 per training round at 30 gwei."
p2.font.size = Pt(9.5)
p2.font.color.rgb = DARK
p3 = tf.add_paragraph()
p3.text = "• Polygon / Arbitrum / Hyperledger Besu Rollup: Reduces transaction gas cost 100× to < BDT 2.00 (< $0.02) per round. Negligible network overhead ensures maximum operating profit margin."
p3.font.size = Pt(9.5)
p3.font.bold = True
p3.font.color.rgb = DARK

# ==============================================================================
# SLIDE 14: PRIVACY, RISK MITIGATION & REGULATORY COMPLIANCE (NATIVE TABLE)
# ==============================================================================
slide14 = prs.slides.add_slide(blank_layout)
add_header(slide14, "13 · SECURITY & REGULATORY COMPLIANCE", "Deterministic Defense Against Adversarial Attacks", 13)

# Native Table for Threat Matrix
t_shape = slide14.shapes.add_table(7, 3, Inches(0.8), Inches(1.35), Inches(11.7), Inches(4.0))
t_tbl = t_shape.table
t_tbl.columns[0].width = Inches(2.8)
t_tbl.columns[1].width = Inches(7.4)
t_tbl.columns[2].width = Inches(1.5)

t_headers = ["THREAT VECTOR", "ON-CHAIN & CRYPTOGRAPHIC DEFENSE", "STATUS"]
for c_idx, h in enumerate(t_headers):
    cell = t_tbl.cell(0, c_idx)
    cell.fill.solid()
    cell.fill.fore_color.rgb = MAGENTA
    cell.text_frame.margin_left = cell.text_frame.margin_right = Inches(0.1)
    p = cell.text_frame.paragraphs[0]
    p.text = h
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = WHITE

t_rows = [
    ("Model Poisoning Attack", "Encrypted FedProx + 3-Sigma Outlier Loss Rejection on Smart Contract", "MITIGATED"),
    ("Free-Riding Node", "Solidity Quorum Gate: Round Cannot Close Without Valid Enclave Update", "MITIGATED"),
    ("Sybil / Rogue Nodes", "OpenZeppelin Wallet-Bound KYC Identity & minSamples = 500 Threshold", "MITIGATED"),
    ("Patient Health Data Leak", "Enclave Air-Gap: 0 Bytes Raw Pixels Leave Hospital (PDPO 2025)", "MITIGATED"),
    ("Man-in-the-Middle Attack", "AES-256-CBC Encryption Under Fresh IV + Content-Addressed CIDs", "MITIGATED"),
    ("On-Chain Re-identification", "Zero Patient PHI: Only IPFS CIDs & Bit-Packed Integers on Ethereum", "MITIGATED")
]

for r_idx, (t_col1, t_col2, t_col3) in enumerate(t_rows, 1):
    for c_idx, val in enumerate([t_col1, t_col2, t_col3]):
        cell = t_tbl.cell(r_idx, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG if r_idx % 2 == 1 else WHITE
        cell.text_frame.margin_left = cell.text_frame.margin_right = Inches(0.1)
        p = cell.text_frame.paragraphs[0]
        p.text = val
        p.font.size = Pt(9)
        p.font.bold = (c_idx == 0 or c_idx == 2)
        p.font.color.rgb = GREEN if c_idx == 2 else DARK

create_card(slide14, Inches(0.8), Inches(5.55), Inches(11.7), Inches(1.1), CARD_BG, TEAL)
tb = slide14.shapes.add_textbox(Inches(1.1), Inches(5.7), Inches(11.1), Inches(0.8))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "BANGLADESH PERSONAL DATA PROTECTION ORDINANCE (PDPO) 2025 ALIGNMENT:"
p1.font.size = Pt(9.5)
p1.font.bold = True
p1.font.color.rgb = TEAL
p2 = tf.add_paragraph()
p2.text = "Full patient confidentiality guaranteed. Hospital sovereignty preserved. Zero data crosses borders. Provable audit log available for DGHS legal compliance inspection."
p2.font.size = Pt(9)
p2.font.color.rgb = DARK

# ==============================================================================
# SLIDE 15: THE VISION & ROADMAP
# ==============================================================================
slide15 = prs.slides.add_slide(blank_layout)
add_header(slide15, "14 · ROADMAP & CONCLUSION", "Decentralized Cancer Diagnostics for Every Citizen of Bangladesh", 14)

phases = [
    ("PHASE 1: NOW", "Sepolia Live Prototype", [
        "Working full-stack prototype",
        "Sepolia contract (0x1BE4...)",
        "Web enclave & cockpit live",
        "98.95% clinical accuracy"
    ], MAGENTA),
    ("PHASE 2: 6 MONTHS", "3-Hospital BD Pilot", [
        "HSTU Dinajpur, BSMMU, Evercare",
        "DGHS regulatory sandbox",
        "Establishing production gas SLA",
        "Ratify consortium charter"
    ], TEAL),
    ("PHASE 3: 18 MONTHS", "L2 Rollup & Scale", [
        "Migrate to Polygon / Besu L2",
        "Sub-2 Taka ($0.02) gas per round",
        "Multi-organ histopathology",
        "37 Govt medical colleges"
    ], GREEN)
]

for idx, (ph_title, ph_sub, ph_body, ph_col) in enumerate(phases):
    create_card(slide15, Inches(0.8 + idx * 4.0), Inches(1.35), Inches(3.7), Inches(3.7))
    tb = slide15.shapes.add_textbox(Inches(1.0 + idx * 4.0), Inches(1.55), Inches(3.3), Inches(3.3))
    tf = tb.text_frame
    p1 = tf.paragraphs[0]
    p1.text = ph_title
    p1.font.size = Pt(11.5)
    p1.font.bold = True
    p1.font.color.rgb = ph_col
    p2 = tf.add_paragraph()
    p2.text = ph_sub
    p2.font.size = Pt(10)
    p2.font.bold = True
    p2.font.color.rgb = DARK
    for line in ph_body:
        p = tf.add_paragraph()
        p.text = "• " + line
        p.font.size = Pt(9)
        p.font.color.rgb = MUTED

create_card(slide15, Inches(0.8), Inches(5.25), Inches(11.7), Inches(1.4))
tb = slide15.shapes.add_textbox(Inches(1.1), Inches(5.4), Inches(8.0), Inches(1.1))
tf = tb.text_frame
p1 = tf.paragraphs[0]
p1.text = "THANK YOU  ·  TEAM FEDGUARD"
p1.font.size = Pt(14)
p1.font.bold = True
p1.font.color.rgb = MAGENTA
p2 = tf.add_paragraph()
p2.text = "Shahriar Hasan  ·  Md. Taufiq Biswas  ·  Md Najib Ul Azam Mahi"
p2.font.size = Pt(10.5)
p2.font.bold = True
p2.font.color.rgb = DARK
p3 = tf.add_paragraph()
p3.text = "Dept. of Electronics and Communication Engineering (ECE), HSTU, Dinajpur, Bangladesh"
p3.font.size = Pt(9.5)
p3.font.color.rgb = MUTED

logo_path = os.path.join(IMG_DIR, "slide_15_img_15.png")
if os.path.exists(logo_path):
    slide15.shapes.add_picture(logo_path, Inches(9.8), Inches(5.4), width=Inches(2.5))

output_path = "/home/hs32/Desktop/medchain/thesis/paper/MedChain-FL_Condensed (1).pptx"
prs.save(output_path)
print(f"Successfully generated clean presentation at {output_path}")
