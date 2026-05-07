"""
Vaulx — 1-page company brief (for Mercado Bitcoin meeting)

v4 — REFRAMED: this is a Vaulx company one-pager, not a partnership memorandum.
The MB cooperation is ONE section near the end, not the framing of the document.

Structure:
  Header   · vaulx logo + tagline + meeting context
  1. THE PROBLEM             · Brazilian credit asymmetry
  2. WHAT IS VAULX           · what we built, the protocol, traction
  3. HOW IT WORKS            · 4-step mechanism flow
  4. UNIT ECONOMICS          · borrower 24% / 50% LTV · LP 8% senior / 12% junior
  5. WHERE MB FITS           · 3 areas of cooperation
  Team + footer
"""

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
import os


# === Palette =============================================================
INK         = Color(0.10,  0.10,  0.114)
INK_DARK    = Color(0.039, 0.039, 0.043)
PAPER       = Color(1.0,   1.0,   1.0)
PAPER_2     = Color(0.972, 0.969, 0.961)
ACCENT      = Color(0.055, 0.486, 0.482)   # #0E7C7B
ACCENT_2    = Color(0.169, 0.627, 0.620)
ACCENT_TINT = Color(0.055, 0.486, 0.482, alpha=0.05)
RULE        = Color(0.85,  0.85,  0.86)
MUTE        = Color(0.42,  0.42,  0.439)
WARN        = Color(0.722, 0.255, 0.173)


# === Setup ===============================================================
W, H = A4
LM, RM, TM, BM = 38, 38, 36, 32
CW = W - LM - RM

PDF_PATH = "Vaulx_MB_OnePager.pdf"
LOGO_BLACK = "vaulx_logo_black.png"

c = canvas.Canvas(PDF_PATH, pagesize=A4)
c.setTitle("Vaulx — Company Brief")
c.setAuthor("Vaulx Protocol")


# === Helpers =============================================================
def wrap_text(text, font, size, max_w):
    words = text.split()
    lines, line = [], ""
    for word in words:
        test = (line + " " + word).strip()
        if pdfmetrics.stringWidth(test, font, size) > max_w:
            lines.append(line)
            line = word
        else:
            line = test
    if line:
        lines.append(line)
    return lines


def draw_paragraph(text, x, y, max_w, size=9, leading=12, color=INK, font="Helvetica"):
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap_text(text, font, size, max_w):
        c.drawString(x, y, line)
        y -= leading
    return y


def section(label, y, num=None, gap_above=12):
    """Numbered section label in teal, hairline below."""
    y -= gap_above
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(ACCENT)
    if num is not None:
        c.drawString(LM, y, f"0{num}")
        c.setFont("Helvetica-Bold", 9.5)
        c.setFillColor(INK_DARK)
        c.drawString(LM + 22, y, label.upper())
    else:
        c.drawString(LM, y, label.upper())
    c.setStrokeColor(RULE)
    c.setLineWidth(0.4)
    c.line(LM, y - 5, W - RM, y - 5)
    return y - 14


# ============================================================================
# HEADER
# ============================================================================
header_top = H - TM

# Logo
if os.path.exists(LOGO_BLACK):
    logo = ImageReader(LOGO_BLACK)
    lw_o, lh_o = logo.getSize()
    lh = 32
    lw = lh * (lw_o / lh_o)
    c.drawImage(
        logo, LM, header_top - lh, width=lw, height=lh,
        mask="auto", preserveAspectRatio=True,
    )

# Tagline below logo
c.setFont("Helvetica", 9)
c.setFillColor(MUTE)
c.drawString(LM, header_top - 48, "On-chain credit, secured by physical luxury collateral.")

# Right-aligned meta line
c.setFont("Helvetica", 8.5)
c.setFillColor(MUTE)
c.drawRightString(W - RM, header_top - 6, "Prepared for Mercado Bitcoin  ·  May 2026")

c.setFont("Helvetica", 8)
c.setFillColor(MUTE)
c.drawRightString(W - RM, header_top - 20, "vaulx.fi  ·  github.com/Vaulxfi")

# Top-right small accent dot
c.setFillColor(ACCENT)
c.circle(W - RM - 3, header_top - 4, 1.8, fill=1, stroke=0)

# Horizontal rule under header
y = header_top - 60
c.setStrokeColor(INK_DARK)
c.setLineWidth(1.2)
c.line(LM, y, W - RM, y)


# ============================================================================
# 1. THE PROBLEM
# ============================================================================
y = section("The asymmetry we solve", y, num=1, gap_above=18)

# Headline
c.setFont("Times-Bold", 13)
c.setFillColor(INK_DARK)
c.drawString(LM, y, "Asset-rich. Credit-trapped.")

# Body
y -= 16
y = draw_paragraph(
    "A São Paulo Rolex owner with a US$ 14,000 watch faces three credit options — all bad. "
    "Caixa Federal pawn lends 20% LTV at ~30% APR (scrap-metal valuation). A consumer loan starts "
    "at ~60% APR. A revolving credit-card balance hits ~400% APR. Meanwhile, on-chain USDC liquidity "
    "sits idle at 8% APR with no trustable rail to physical collateral.",
    LM, y, CW, size=9, leading=12,
)

# Mini rate strip below text — 3 quick numbers, 1 row
y -= 8
strip_h = 24
n_cells = 3
cell_w = (CW) / n_cells
rates = [
    ("Caixa pawn (20% LTV)",     "~30% APR"),
    ("Consumer loan",             "~60% APR"),
    ("Credit-card revolving",     "~400% APR"),
]
for i, (label, val) in enumerate(rates):
    cx = LM + i * cell_w
    c.setFillColor(PAPER_2)
    c.rect(cx + 1, y - strip_h, cell_w - 2, strip_h, fill=1, stroke=0)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(MUTE)
    c.drawString(cx + 8, y - 10, label.upper())
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(WARN)
    c.drawRightString(cx + cell_w - 8, y - 16, val)
y -= strip_h + 6


# ============================================================================
# 2. WHAT IS VAULX
# ============================================================================
y = section("What is Vaulx", y, num=2)

y = draw_paragraph(
    "Vaulx is an on-chain credit protocol on Solana that connects asset-rich individuals in "
    "emerging markets with global on-chain liquidity — secured by physical luxury collateral "
    "(luxury watches first, then jewelry, gold, art) with deterministic on-chain liquidation.",
    LM, y, CW, size=9.5, leading=13,
)

y -= 4
y = draw_paragraph(
    "We do not take custody. We do not hold capital. We orchestrate licensed counterparties — "
    "independent custodians, certified appraisers, Lloyd's-class insurance — and route the loan "
    "through Solana smart contracts that release USDC only after the custodian signs custody-confirmation "
    "atomically on-chain.",
    LM, y, CW, size=9.5, leading=13,
)

# Traction strip — 4 quick stats inline
y -= 10
trac_h = 22
n = 4
gap = 8
cell_w = (CW - (n-1)*gap) / n
stats = [
    ("4",        "Anchor programs · live on Devnet"),
    ("45+",      "tests · all green · CI gating"),
    ("vaulx.fi", "frontend live · admin cockpit"),
    ("Q3 '26",   "mainnet target · 50 borrowers"),
]
for i, (big, sub) in enumerate(stats):
    cx = LM + i * (cell_w + gap)
    # left teal accent strip
    c.setFillColor(ACCENT)
    c.rect(cx, y - trac_h, 2.5, trac_h, fill=1, stroke=0)
    # big number
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(INK_DARK)
    c.drawString(cx + 8, y - 11, big)
    # sub label
    c.setFont("Helvetica", 7.5)
    c.setFillColor(MUTE)
    c.drawString(cx + 8, y - 20, sub)
y -= trac_h + 6


# ============================================================================
# 3. HOW IT WORKS  (4 horizontal step cards)
# ============================================================================
y = section("How it works", y, num=3)

n_steps = 4
arrow_w = 16
total_arrows = (n_steps - 1) * arrow_w
step_w = (CW - total_arrows) / n_steps
step_h = 56

steps = [
    ("01", "Vault & appraise",     "Asset goes into licensed custody. Trilateral appraisal sets fair value."),
    ("02", "Mint cNFT on Solana",  "Compressed NFT issued — embeds custody, appraisal, insurance, redemption rights."),
    ("03", "Lock collateral",      "cNFT locked into Vaulx smart contract. Atomic gates verify custody on-chain."),
    ("04", "Disburse USDC",        "USDC drawn from Solana LPs, paid to borrower. BRL via Pix on/off-ramp."),
]

step_top = y - step_h
for i, (num, title, desc) in enumerate(steps):
    sx = LM + i * (step_w + arrow_w)
    sy = step_top
    # Box
    c.setFillColor(PAPER_2)
    c.rect(sx, sy, step_w, step_h, fill=1, stroke=0)
    # Top accent strip
    c.setFillColor(ACCENT)
    c.rect(sx, sy + step_h - 2, step_w, 2, fill=1, stroke=0)
    # Step number top-right
    c.setFont("Courier-Bold", 8)
    c.setFillColor(MUTE)
    c.drawRightString(sx + step_w - 8, sy + step_h - 13, num)
    # Title
    c.setFont("Helvetica-Bold", 8.7)
    c.setFillColor(INK_DARK)
    c.drawString(sx + 8, sy + step_h - 13, title)
    # Description
    c.setFont("Helvetica", 7.4)
    c.setFillColor(INK)
    desc_lines = wrap_text(desc, "Helvetica", 7.4, step_w - 16)
    dy = sy + step_h - 25
    for ln in desc_lines:
        c.drawString(sx + 8, dy, ln)
        dy -= 9
    # Arrow
    if i < n_steps - 1:
        ax = sx + step_w + 2
        ay = sy + step_h / 2
        c.setStrokeColor(ACCENT)
        c.setLineWidth(1.0)
        c.line(ax, ay, ax + arrow_w - 4, ay)
        c.line(ax + arrow_w - 4, ay, ax + arrow_w - 8, ay + 3)
        c.line(ax + arrow_w - 4, ay, ax + arrow_w - 8, ay - 3)

y = step_top


# ============================================================================
# 4. UNIT ECONOMICS
# ============================================================================
y = section("Unit economics", y, num=4)

# Two-column: Borrower | Capital providers
col_gap = 14
col_w = (CW - col_gap) / 2
left_x = LM
right_x = LM + col_w + col_gap

# LEFT — Borrower
c.setFillColor(INK_DARK)
c.setFont("Helvetica-Bold", 9)
c.drawString(left_x, y, "BORROWER")
y_l = y - 14

bo_rows = [
    ("All-in APR (2% / month)",   "24%"),
    ("LTV (vs Caixa 20% scrap)",  "Up to 50%"),
    ("Term",                      "3-month, renewable"),
    ("vs credit-card revolving",  "16× cheaper"),
]
for label, val in bo_rows:
    c.setFont("Helvetica", 8.7)
    c.setFillColor(INK)
    c.drawString(left_x, y_l, label)
    c.setFont("Helvetica-Bold", 8.7)
    c.setFillColor(ACCENT)
    c.drawRightString(left_x + col_w, y_l, val)
    y_l -= 12

# RIGHT — Capital providers (LP tranches)
c.setFillColor(INK_DARK)
c.setFont("Helvetica-Bold", 9)
c.drawString(right_x, y, "CAPITAL PROVIDERS")
y_r = y - 14

lp_rows = [
    ("Senior tranche (USDC, fixed)",       "8% APR"),
    ("Junior tranche (USDC, fixed)",       "12% APR"),
    ("Vaulx protocol-owned first-loss",    "5% buffer"),
    ("vs Maple syrupUSDC senior",          "+100 bps"),
]
for label, val in lp_rows:
    c.setFont("Helvetica", 8.7)
    c.setFillColor(INK)
    c.drawString(right_x, y_r, label)
    c.setFont("Helvetica-Bold", 8.7)
    c.setFillColor(ACCENT)
    c.drawRightString(right_x + col_w, y_r, val)
    y_r -= 12

y = min(y_l, y_r) - 4

# Vaulx revenue line
c.setFillColor(ACCENT_TINT)
c.rect(LM, y - 18, CW, 18, fill=1, stroke=0)
c.setStrokeColor(ACCENT)
c.setLineWidth(0.6)
c.line(LM, y - 18, LM, y)
c.setFont("Helvetica-Bold", 8.7)
c.setFillColor(ACCENT)
c.drawString(LM + 8, y - 13, "VAULX REVENUE")
c.setFont("Helvetica", 8.7)
c.setFillColor(INK_DARK)
c.drawString(LM + 92, y - 13,
             "~$300–600 per asset / year (6–12% of borrowed). Origination + servicing + curator fees.")
y -= 24


# ============================================================================
# 5. WHERE MERCADO BITCOIN FITS
# ============================================================================
y = section("Where Mercado Bitcoin fits", y, num=5)

intro = ("Vaulx has built the protocol, the custody layer, and the borrower funnel. "
         "To operate compliantly in Brazil at scale, we need a regulated counterparty. "
         "Three areas where MB and Vaulx could cooperate:")
y = draw_paragraph(intro, LM, y, CW, size=9, leading=12)

y -= 4

mb_areas = [
    ("Regulated tokenization",
     "MB issues the on-chain representation (cNFT) of the vaulted asset under its existing license."),
    ("Fiat rails · BRL ↔ USDC",
     "MB acts as the primary on/off-ramp for borrower disbursement and repayment via Pix."),
    ("Yield product distribution",
     "Vaulx senior tranche (8% USDC, physical collateral, insured) listed for MB institutional / retail."),
]
for label, desc in mb_areas:
    c.setFillColor(ACCENT)
    c.rect(LM + 1, y - 1, 4, 4, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 8.8)
    c.setFillColor(INK_DARK)
    c.drawString(LM + 14, y, label)
    label_w = pdfmetrics.stringWidth(label + "  ", "Helvetica-Bold", 8.8)
    c.setFont("Helvetica", 8.7)
    c.setFillColor(INK)
    desc_x = LM + 14 + label_w
    desc_max = CW - (desc_x - LM)
    desc_lines = wrap_text(desc, "Helvetica", 8.7, desc_max)
    c.drawString(desc_x, y, desc_lines[0])
    yy = y
    for line in desc_lines[1:]:
        yy -= 11
        c.drawString(LM + 14, yy, line)
    y = yy - 13


# ============================================================================
# 6. INDICATIVE COMMERCIAL TERMS  +  SAFEGUARDS  (two columns side by side)
# ============================================================================
y = section("Indicative terms & safeguards", y, num=6, gap_above=8)

col_gap = 14
col_w = (CW - col_gap) / 2
left_x = LM
right_x = LM + col_w + col_gap

# LEFT COLUMN — COMMERCIAL TERMS
c.setFont("Helvetica-Bold", 8.5)
c.setFillColor(INK_DARK)
c.drawString(left_x, y, "INDICATIVE COMMERCIAL TERMS")
y_l = y - 13

terms = [
    ("Issuance fee to MB",                 "~R$ 200–500 / cNFT"),
    ("Net-revenue share on BR loans",      "10–15% MB · 85–90% Vaulx"),
    ("BRL ↔ USDC settlement",              "MB standard spread"),
    ("LP yield-product listing (opt.)",    "20–30% rev-share on spread"),
    ("Pilot",                              "Non-exclusive · 60d · 10 watches"),
]
for label, val in terms:
    c.setFont("Helvetica", 7.8)
    c.setFillColor(INK)
    c.drawString(left_x, y_l, label)
    c.setFont("Helvetica-Bold", 7.8)
    c.setFillColor(ACCENT)
    c.drawRightString(left_x + col_w, y_l, val)
    y_l -= 11

# RIGHT COLUMN — SAFEGUARDS
c.setFont("Helvetica-Bold", 8.5)
c.setFillColor(INK_DARK)
c.drawString(right_x, y, "WHAT PROTECTS THE PARTNERSHIP")
y_r = y - 13

safeguards = [
    ("Atomic invariant",            "No USDC disburses until custodian signs on-chain — same tx."),
    ("Independent licensed custody", "Brinks / Loomis-class — not Vaulx, not MB."),
    ("Lloyd's-class insurance",      "Theft + damage to the trustee on every vaulted asset."),
    ("5% protocol-owned first-loss", "Vaulx posts capital below LP tranches — we eat losses first."),
]
for label, desc in safeguards:
    c.setFillColor(ACCENT)
    c.rect(right_x, y_r + 1, 3, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 7.6)
    c.setFillColor(INK_DARK)
    c.drawString(right_x + 8, y_r, label)
    label_w = pdfmetrics.stringWidth(label + "  ", "Helvetica-Bold", 7.6)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(INK)
    desc_x = right_x + 8 + label_w
    desc_max = col_w - (desc_x - right_x) - 2
    desc_lines = wrap_text(desc, "Helvetica", 7.5, desc_max)
    c.drawString(desc_x, y_r, desc_lines[0])
    yy = y_r
    for line in desc_lines[1:]:
        yy -= 9.5
        c.drawString(right_x + 8, yy, line)
    y_r = yy - 9.5

y = min(y_l, y_r) - 2


# ============================================================================
# 7. NEXT STEPS  (slim teal-tinted strip with left accent bar)
# ============================================================================
y -= 10
strip_h = 20
# tinted background
c.setFillColor(ACCENT_TINT)
c.rect(LM, y - strip_h, CW, strip_h, fill=1, stroke=0)
# left teal accent stripe
c.setFillColor(ACCENT)
c.rect(LM, y - strip_h, 3, strip_h, fill=1, stroke=0)

# label
c.setFont("Helvetica-Bold", 7.5)
c.setFillColor(ACCENT)
c.drawString(LM + 10, y - 13, "FROM THIS MEETING")

# 4 next-step items inline
ns_items = [
    "Alignment on fit",
    "Named legal / product counterpart",
    "14-day scoping call",
    "60-day pilot · 10 watches",
]
items_text = "   ·   ".join(ns_items)
c.setFont("Helvetica", 7.8)
c.setFillColor(INK_DARK)
label_w = pdfmetrics.stringWidth("FROM THIS MEETING", "Helvetica-Bold", 7.5)
c.drawString(LM + 10 + label_w + 14, y - 13, items_text)

y = y - strip_h - 2


# ============================================================================
# FOOTER
# ============================================================================
footer_y = BM + 14
c.setStrokeColor(RULE)
c.setLineWidth(0.4)
c.line(LM, footer_y + 8, W - RM, footer_y + 8)

team_line = ("George Dimitrov  CEO/CTO   ·   Marcelo  COO  (Gitel — 38 yrs BR electronic-security)   ·   "
             "Rodrigo  Head BD   ·   Edson  Sr. Solana Eng.   ·   Felipe  DeFi Advisor (4p.finance)")
c.setFont("Helvetica", 7)
c.setFillColor(MUTE)
c.drawString(LM, footer_y - 4, team_line)

c.setFont("Helvetica-Bold", 7)
c.setFillColor(INK_DARK)
c.drawString(LM, footer_y - 16, "vaulx.fi   ·   github.com/Vaulxfi")
c.setFont("Helvetica", 7)
c.setFillColor(MUTE)
c.drawRightString(W - RM, footer_y - 16, "Built. Tested. Live on Solana Devnet today.   ·   STRICTLY CONFIDENTIAL")


# === Save ================================================================
c.showPage()
c.save()
print(f"Generated: {PDF_PATH}")
