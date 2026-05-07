// Vaulx Pitch v13 — clean rebuild from locked spec
// 9 slides · spatial layouts only · NO tables · minimal text
// Dark mode: ink #0A0A0B / cream off-white / teal #0E7C7B / gold #C9A86A

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const fa = require("react-icons/fa");
const fa6 = require("react-icons/fa6");
const md = require("react-icons/md");

const OUT = "/Users/gogy/MyCODE/VAULX/docs/deck/Vaulx_Pitch_v13.pptx";
const ASSETS = "/Users/gogy/MyCODE/VAULX/.claude/worktrees/recursing-mcnulty-a36d0a/docs/colosseum";

const SW = 13.333, SH = 7.5;

const C = {
  ink:        "0A0A0B",
  inkSoft:    "12131A",
  inkLift:    "16171F",
  cream:      "F5F0E8",
  creamSoft:  "C8C2B2",
  teal:       "0E7C7B",
  tealLift:   "1A9C9A",
  gold:       "C9A86A",
  warn:       "B8412C",
  mute:       "6B6B70",
  muteDark:   "8A8A90",
  lineDark:   "1F1F25",
};

const F = { serif: "Georgia", sans: "Calibri", mono: "Consolas" };

async function iconPng(Icon, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

function hr(s, p, x, y, w, color, weight = 0.5) {
  s.addShape(p.shapes.LINE, { x, y, w, h: 0, line: { color, width: weight } });
}
function vr(s, p, x, y, h, color, weight = 0.5) {
  s.addShape(p.shapes.LINE, { x, y, w: 0, h, line: { color, width: weight } });
}

function eyebrow(s, p, x, y, w, text) {
  s.addShape(p.shapes.RECTANGLE, {
    x, y: y + 0.08, w: 0.12, h: 0.025,
    fill: { color: C.teal }, line: { color: C.teal, width: 0 },
  });
  s.addText(text, {
    x: x + 0.18, y, w: w - 0.18, h: 0.25,
    fontFace: F.mono, fontSize: 9.5, color: C.teal, bold: true,
    charSpacing: 4, valign: "middle", margin: 0,
  });
}

function pageNum(s, p, num, total) {
  s.addText(`${String(num).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: SW - 1.4, y: 0.3, w: 1.0, h: 0.25,
    fontFace: F.mono, fontSize: 9, color: C.muteDark,
    align: "right", charSpacing: 3, valign: "middle", margin: 0,
  });
}

// Headline + subhead helper
function headline(s, p, x, y, w, parts) {
  const runs = parts.map(pp => ({
    text: pp.text,
    options: { color: pp.color || C.cream, italic: !!pp.italic, bold: pp.bold !== false },
  }));
  s.addText(runs, {
    x, y, w, h: 0.85,
    fontFace: F.serif, fontSize: 30, margin: 0,
  });
}

async function main() {
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE";
  p.title = "Vaulx — On-chain credit rail";
  p.author = "Vaulx";
  p.company = "Vaulx";
  p.subject = "Colosseum Cypherpunk 2026 · Solana RWA";

  const ICO = {
    user:    await iconPng(fa.FaUserCheck,   "#" + C.teal),
    safe:    await iconPng(md.MdLock,        "#" + C.teal),
    layers:  await iconPng(fa.FaLayerGroup,  "#" + C.teal),
    dollar:  await iconPng(fa.FaDollarSign,  "#" + C.teal),
    scale:   await iconPng(fa6.FaScaleBalanced, "#" + C.teal),
    bank:    await iconPng(fa.FaUniversity,  "#" + C.teal),
    cctv:    await iconPng(md.MdVideocam,    "#" + C.teal),
    hand:    await iconPng(fa.FaHandshake,   "#" + C.teal),
    code:    await iconPng(fa.FaCode,        "#" + C.teal),
    watch:   await iconPng(md.MdWatch,       "#" + C.teal),
    chartUp: await iconPng(fa6.FaArrowTrendUp, "#" + C.teal),
    bolt:    await iconPng(fa.FaBolt,        "#" + C.teal),
    globe:   await iconPng(fa.FaGlobe,       "#" + C.teal),
    chain:   await iconPng(fa.FaLink,        "#" + C.teal),
    shield:  await iconPng(fa.FaShieldAlt,   "#" + C.teal),
  };

  const TOTAL = 9;

  // ============================================================
  // SLIDE 1 — THE ASYMMETRY (branching flowchart top→bottom)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };
    eyebrow(s, p, 0.7, 0.5, 6.0, "01  /  THE ASYMMETRY");
    pageNum(s, p, 1, TOTAL);

    // Headline
    s.addText("Asset-rich, credit-trapped — meets capital with nowhere to go.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 28, color: C.cream, margin: 0, lineSpacing: 36,
    });

    // Hero asset block at top center
    const heroImg = `${ASSETS}/hf/v13_rolex.jpg`;
    const fallbackImg = `${ASSETS}/hero_watch.png`;
    const useHero = fs.existsSync(heroImg) ? heroImg : fallbackImg;
    const heroX = SW/2 - 1.6, heroY = 1.95, heroW = 3.2, heroH = 1.6;
    if (fs.existsSync(useHero)) {
      s.addImage({
        path: useHero, x: heroX, y: heroY, w: heroW, h: heroH,
        sizing: { type: "cover", w: heroW, h: heroH },
      });
      // border around hero
      s.addShape(p.shapes.RECTANGLE, {
        x: heroX, y: heroY, w: heroW, h: heroH,
        fill: { color: C.ink, transparency: 100 }, line: { color: C.teal, width: 0.75 },
      });
    } else {
      s.addShape(p.shapes.RECTANGLE, {
        x: heroX, y: heroY, w: heroW, h: heroH,
        fill: { color: C.inkSoft }, line: { color: C.teal, width: 0.75 },
      });
      s.addText("[ Rolex Submariner ]", {
        x: heroX, y: heroY, w: heroW, h: heroH,
        fontFace: F.serif, fontSize: 20, italic: true, color: C.creamSoft,
        align: "center", valign: "middle", margin: 0,
      });
    }
    // Caption under hero
    s.addText("$14,000 Rolex Submariner  ·  Idle Asset", {
      x: heroX, y: heroY + heroH + 0.1, w: heroW, h: 0.35,
      fontFace: F.mono, fontSize: 11, color: C.creamSoft, italic: true,
      align: "center", margin: 0,
    });

    // Branch lines from hero down to 3 boxes
    const branchY1 = 4.05;
    const boxY = 4.55, boxH = 1.85;
    const boxW = 3.7;
    const boxXs = [0.7, SW/2 - boxW/2, SW - 0.7 - boxW];
    // vertical line from hero center
    s.addShape(p.shapes.LINE, {
      x: SW/2, y: heroY + heroH + 0.5, w: 0, h: 0.3,
      line: { color: C.teal, width: 1 },
    });
    // horizontal connector at branchY1
    s.addShape(p.shapes.LINE, {
      x: boxXs[0] + boxW/2, y: branchY1, w: boxXs[2] + boxW/2 - boxXs[0] - boxW/2, h: 0,
      line: { color: C.teal, width: 1 },
    });
    // 3 vertical drops
    boxXs.forEach(bx => {
      s.addShape(p.shapes.LINE, {
        x: bx + boxW/2, y: branchY1, w: 0, h: 0.5,
        line: { color: C.teal, width: 1 },
      });
    });

    const branches = [
      { label: "CREDIT CARD ROTATIVO", value: "~450%", suffix: "APR", note: "Unsecured · revolving balance", color: C.warn },
      { label: "CAIXA FEDERAL PAWN",   value: "~30%",  suffix: "APR · 20% LTV", note: "Evaluated as scrap metal",    color: C.creamSoft },
      { label: "GLOBAL DEFI",          value: "8–10%", suffix: "APR", note: "Institutional capital",                 color: C.teal },
    ];
    boxXs.forEach((bx, i) => {
      const b = branches[i];
      s.addShape(p.shapes.RECTANGLE, {
        x: bx, y: boxY, w: boxW, h: boxH,
        fill: { color: C.inkSoft }, line: { color: b.color, width: 0.75 },
      });
      // top tick on the box for extra hierarchy
      s.addShape(p.shapes.RECTANGLE, {
        x: bx, y: boxY, w: boxW, h: 0.04,
        fill: { color: b.color }, line: { color: b.color, width: 0 },
      });
      s.addText(b.label, {
        x: bx + 0.25, y: boxY + 0.2, w: boxW - 0.5, h: 0.3,
        fontFace: F.mono, fontSize: 10, color: b.color, bold: true,
        charSpacing: 4, margin: 0,
      });
      s.addText(b.value, {
        x: bx + 0.25, y: boxY + 0.55, w: boxW - 0.5, h: 0.7,
        fontFace: F.serif, fontSize: 36, bold: true, color: C.cream, margin: 0,
      });
      s.addText(b.suffix, {
        x: bx + 0.25, y: boxY + 1.2, w: boxW - 0.5, h: 0.3,
        fontFace: F.mono, fontSize: 11, color: C.creamSoft, margin: 0,
      });
      s.addText(b.note, {
        x: bx + 0.25, y: boxY + boxH - 0.45, w: boxW - 0.5, h: 0.3,
        fontFace: F.sans, fontSize: 11, color: C.creamSoft, italic: true, margin: 0,
      });
    });

    // Bottom callout
    hr(s, p, 0.7, 6.65, SW - 1.4, C.lineDark, 0.5);
    s.addText([
      { text: "The gap is not capital.   ", options: { color: C.cream, bold: true } },
      { text: "The gap is the ", options: { color: C.cream, bold: true } },
      { text: "rail", options: { color: C.gold, italic: true, bold: true } },
      { text: ".", options: { color: C.cream, bold: true } },
    ], {
      x: 0.7, y: 6.8, w: SW - 1.4, h: 0.5,
      fontFace: F.serif, fontSize: 18, align: "center", valign: "middle", margin: 0,
    });

    s.addNotes("Marcelo lives in São Paulo. He owns a fourteen-thousand-dollar Rolex, but he needs short-term liquidity. His options are fundamentally broken. His credit card charges him four hundred percent APR. If he goes to the state pawnshop, Caixa Federal, they evaluate his luxury watch as literal scrap metal — offering him barely twenty percent loan-to-value, and still charging him thirty percent APR. Meanwhile, right now on Solana, institutional capital is being offered at eight percent — and it has no way to reach him.");
  }

  // ============================================================
  // SLIDE 2 — PROTOCOL ARCHITECTURE (Hub-and-Spoke)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };
    eyebrow(s, p, 0.7, 0.5, 6.0, "02  /  PROTOCOL ARCHITECTURE");
    pageNum(s, p, 2, TOTAL);

    s.addText("The on-chain credit rail.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, color: C.cream, bold: true, margin: 0,
    });
    s.addText("Vaulx orchestrates licensed counterparties — we don't hold capital, we don't take custody.", {
      x: 0.7, y: 1.7, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.creamSoft, margin: 0,
    });
    hr(s, p, 0.7, 2.18, 1.0, C.teal, 1.2);

    // Hub center
    const cx = SW/2, cy = 4.85;
    const hubR = 0.95;

    // Spokes are 3 cards positioned: left, top, right
    const spokes = [
      { side: "left",  title: "BORROWERS",    sub: "Sumsub KYC",  body: "Crossmint social login\nReusable SAS attestation\n1-tap onchain identity" },
      { side: "top",   title: "LICENSED CUSTODY", sub: "Sekuro intake",   body: "Brinks-class network · Lloyd's insurance · IoT-monitored vaulting" },
      { side: "right", title: "YIELD MARKETS", sub: "Kamino · Loopscale", body: "Anchor CPI integration\nPyth + RedStone oracles\nGlobal USDC liquidity" },
    ];
    const cardW = 3.4, cardH = 1.85;
    const topCardH = 1.3;
    const positions = {
      left:  { x: 0.7,             y: cy - cardH/2,    h: cardH },
      top:   { x: cx - cardW/2,    y: 2.05,            h: topCardH },
      right: { x: SW - 0.7 - cardW, y: cy - cardH/2,   h: cardH },
    };

    // Connector lines — from hub EDGE to each card edge (so lines are visible outside hub)
    Object.entries(positions).forEach(([side, pos]) => {
      let fromX, fromY, toX, toY;
      const ch = pos.h;
      if (side === "left")  { fromX = cx - hubR; fromY = cy; toX = pos.x + cardW; toY = pos.y + ch/2; }
      if (side === "right") { fromX = cx + hubR; fromY = cy; toX = pos.x;          toY = pos.y + ch/2; }
      if (side === "top")   { fromX = cx;        fromY = cy - hubR; toX = pos.x + cardW/2; toY = pos.y + ch; }
      s.addShape(p.shapes.LINE, {
        x: fromX, y: fromY, w: toX - fromX, h: toY - fromY,
        line: { color: C.teal, width: 1.0 },
      });
    });

    // Hub circle (drawn on top of lines so lines hide behind it)
    s.addShape(p.shapes.OVAL, {
      x: cx - hubR, y: cy - hubR, w: hubR * 2, h: hubR * 2,
      fill: { color: C.inkSoft }, line: { color: C.teal, width: 1.5 },
    });
    s.addText("Vaulx", {
      x: cx - hubR, y: cy - hubR + 0.25, w: hubR * 2, h: 0.7,
      fontFace: F.serif, fontSize: 26, bold: true, color: C.cream,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText("ORCHESTRATOR", {
      x: cx - hubR, y: cy - hubR + 0.95, w: hubR * 2, h: 0.4,
      fontFace: F.mono, fontSize: 9, color: C.teal, bold: true,
      align: "center", valign: "middle", charSpacing: 4, margin: 0,
    });
    s.addText("4 Anchor programs", {
      x: cx - hubR, y: cy - hubR + 1.32, w: hubR * 2, h: 0.32,
      fontFace: F.mono, fontSize: 9, color: C.muteDark, italic: true,
      align: "center", valign: "middle", margin: 0,
    });

    // 3 spoke cards
    const spokeIcons = [ICO.user, ICO.safe, ICO.layers];
    spokes.forEach((sp, i) => {
      const pos = positions[sp.side];
      const ch = pos.h;
      s.addShape(p.shapes.RECTANGLE, {
        x: pos.x, y: pos.y, w: cardW, h: ch,
        fill: { color: C.inkSoft }, line: { color: C.teal, width: 0.75 },
      });
      s.addImage({ data: spokeIcons[i], x: pos.x + 0.25, y: pos.y + 0.22, w: 0.4, h: 0.4 });
      s.addText(sp.title, {
        x: pos.x + 0.8, y: pos.y + 0.22, w: cardW - 0.95, h: 0.3,
        fontFace: F.mono, fontSize: 10, color: C.teal, bold: true, charSpacing: 4, valign: "middle", margin: 0,
      });
      s.addText(sp.sub, {
        x: pos.x + 0.8, y: pos.y + 0.5, w: cardW - 0.95, h: 0.3,
        fontFace: F.serif, fontSize: 14, italic: true, color: C.cream, margin: 0,
      });
      hr(s, p, pos.x + 0.25, pos.y + 0.92, cardW - 0.5, C.lineDark, 0.5);
      s.addText(sp.body, {
        x: pos.x + 0.25, y: pos.y + 1.0, w: cardW - 0.5, h: ch - 1.05,
        fontFace: F.sans, fontSize: 11, color: C.creamSoft, margin: 0, lineSpacing: 16,
      });
    });

    // Footer mono
    s.addText("vault  ·  loan  ·  trdc  ·  auction", {
      x: 0.7, y: SH - 0.7, w: SW - 1.4, h: 0.3,
      fontFace: F.mono, fontSize: 11, color: C.teal, bold: true,
      align: "center", charSpacing: 6, margin: 0,
    });

    s.addNotes("Vaulx does not hold capital, and we do not take custody. We orchestrate licensed counterparties. Through our four Anchor programs, we enforce five strict gates: appraisal, custody, mint, borrow, and repay.");
  }

  // ============================================================
  // SLIDE 3 — THE ATOMIC GATE (5-step horizontal + emphasis box)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };
    eyebrow(s, p, 0.7, 0.5, 6.0, "03  /  THE ATOMIC GATE");
    pageNum(s, p, 3, TOTAL);

    s.addText("Five gates. One signature. No middleman.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, color: C.cream, bold: true, margin: 0,
    });
    s.addText("Atomic. Onchain. The licensed-custodian signature is the release trigger — same Solana transaction.", {
      x: 0.7, y: 1.7, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.creamSoft, margin: 0,
    });
    hr(s, p, 0.7, 2.18, 1.0, C.teal, 1.2);

    // 5 step boxes horizontal
    const steps = [
      { num: "1", label: "Appraisal",        icon: ICO.scale },
      { num: "2", label: "Custody",          icon: ICO.safe },
      { num: "3", label: "cNFT Mint",        icon: ICO.chain },
      { num: "4", label: "Borrow",           icon: ICO.dollar },
      { num: "5", label: "Repay / Default",  icon: ICO.code },
    ];
    const stY = 2.6, stH = 1.7;
    const arrowW = 0.4;
    const stW = (SW - 1.4 - 4 * arrowW) / 5;
    steps.forEach((st, i) => {
      const stx = 0.7 + i * (stW + arrowW);
      s.addShape(p.shapes.RECTANGLE, {
        x: stx, y: stY, w: stW, h: stH,
        fill: { color: C.inkSoft }, line: { color: C.teal, width: 0.75 },
      });
      // big number
      s.addText(st.num, {
        x: stx, y: stY + 0.2, w: stW, h: 0.5,
        fontFace: F.serif, fontSize: 32, bold: true, color: C.gold,
        align: "center", margin: 0,
      });
      s.addImage({ data: st.icon, x: stx + stW/2 - 0.22, y: stY + 0.78, w: 0.44, h: 0.44 });
      s.addText(st.label, {
        x: stx, y: stY + stH - 0.45, w: stW, h: 0.35,
        fontFace: F.serif, fontSize: 14, bold: true, color: C.cream,
        align: "center", margin: 0,
      });
      // arrow between steps
      if (i < steps.length - 1) {
        s.addText("→", {
          x: stx + stW, y: stY + stH/2 - 0.25, w: arrowW, h: 0.5,
          fontSize: 22, color: C.teal, fontFace: F.sans,
          align: "center", valign: "middle", margin: 0,
        });
      }
    });

    // EMPHASIS BOX — invariant
    const eY = 4.85, eH = 1.65;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: eY, w: SW - 1.4, h: eH,
      fill: { color: C.teal }, line: { color: C.teal, width: 0 },
    });
    s.addText("THE INVARIANT", {
      x: 0.95, y: eY + 0.22, w: SW - 1.85, h: 0.3,
      fontFace: F.mono, fontSize: 11, color: C.gold, bold: true, charSpacing: 6, margin: 0,
    });
    s.addText("No USDC is released until the licensed custodian confirms physical custody onchain — atomically, in the same transaction.", {
      x: 0.95, y: eY + 0.55, w: SW - 1.85, h: 1.0,
      fontFace: F.serif, fontSize: 22, italic: true, color: C.cream,
      margin: 0, lineSpacing: 32,
    });

    // Bottom mini line
    s.addText([
      { text: "→  ", options: { color: C.teal } },
      { text: "No competitor in physical-collateral lending has shipped this onchain.", options: { color: C.cream, italic: true } },
    ], {
      x: 0.7, y: SH - 0.55, w: SW - 1.4, h: 0.35,
      fontFace: F.serif, fontSize: 13, margin: 0,
    });

    s.addNotes("Our atomic contract enforces five strict gates. The killer invariant: no USDC is disbursed until the licensed Brinks-class custodian physically vaults the asset and signs the on-chain confirmation. It happens atomically, in the same transaction. No competitor in the real-world-asset space has shipped this.");
  }

  // ============================================================
  // SLIDE 4 — UNIT ECONOMICS (2 visual graphics, no tables)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };
    eyebrow(s, p, 0.7, 0.5, 6.0, "04  /  UNIT ECONOMICS");
    pageNum(s, p, 4, TOTAL);

    s.addText("Cheaper than formal credit. 2.5× more capital.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, color: C.cream, bold: true, margin: 0,
    });
    hr(s, p, 0.7, 1.85, 1.0, C.teal, 1.2);

    // ===== LEFT: LTV bar comparison =====
    const lX = 0.7, lY = 2.2, lW = 6.4;
    s.addText("CAPITAL PER ASSET  ·  $14k Rolex", {
      x: lX, y: lY, w: lW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.teal, bold: true, charSpacing: 4, margin: 0,
    });
    hr(s, p, lX, lY + 0.35, lW, C.lineDark, 0.5);

    // Caixa bar
    const cBarY = lY + 0.7, barH = 0.55;
    const maxBarW = 5.0;
    s.addText("Caixa Pawn", {
      x: lX, y: cBarY - 0.05, w: 1.6, h: 0.3,
      fontFace: F.serif, fontSize: 14, color: C.creamSoft, valign: "middle", margin: 0,
    });
    s.addText("20% LTV", {
      x: lX, y: cBarY + 0.25, w: 1.6, h: 0.25,
      fontFace: F.mono, fontSize: 10, color: C.muteDark, italic: true, valign: "middle", margin: 0,
    });
    // bar track
    s.addShape(p.shapes.RECTANGLE, {
      x: lX + 1.7, y: cBarY, w: maxBarW, h: barH,
      fill: { color: C.inkSoft }, line: { color: C.lineDark, width: 0 },
    });
    // filled bar 20% of max
    s.addShape(p.shapes.RECTANGLE, {
      x: lX + 1.7, y: cBarY, w: maxBarW * 0.2, h: barH,
      fill: { color: C.creamSoft }, line: { color: C.creamSoft, width: 0 },
    });
    s.addText("$2,800", {
      x: lX + 1.7 + maxBarW * 0.2 + 0.1, y: cBarY, w: 1.5, h: barH,
      fontFace: F.mono, fontSize: 12, color: C.cream, bold: true, valign: "middle", margin: 0,
    });

    // Vaulx bar
    const vBarY = cBarY + 1.05;
    s.addText("Vaulx", {
      x: lX, y: vBarY - 0.05, w: 1.6, h: 0.3,
      fontFace: F.serif, fontSize: 14, color: C.cream, bold: true, valign: "middle", margin: 0,
    });
    s.addText("50% LTV", {
      x: lX, y: vBarY + 0.25, w: 1.6, h: 0.25,
      fontFace: F.mono, fontSize: 10, color: C.teal, italic: true, valign: "middle", margin: 0,
    });
    s.addShape(p.shapes.RECTANGLE, {
      x: lX + 1.7, y: vBarY, w: maxBarW, h: barH,
      fill: { color: C.inkSoft }, line: { color: C.lineDark, width: 0 },
    });
    s.addShape(p.shapes.RECTANGLE, {
      x: lX + 1.7, y: vBarY, w: maxBarW * 0.5, h: barH,
      fill: { color: C.teal }, line: { color: C.teal, width: 0 },
    });
    s.addText("$7,000", {
      x: lX + 1.7 + maxBarW * 0.5 + 0.1, y: vBarY, w: 1.5, h: barH,
      fontFace: F.mono, fontSize: 12, color: C.cream, bold: true, valign: "middle", margin: 0,
    });

    // 2.5× callout below bars
    s.addText([
      { text: "2.5×", options: { color: C.gold, bold: true, fontFace: F.serif, fontSize: 36 } },
      { text: "  more capital per asset", options: { color: C.cream, fontFace: F.serif, fontSize: 18, italic: true } },
    ], {
      x: lX, y: vBarY + 1.0, w: lW, h: 0.7,
      align: "left", margin: 0,
    });

    // ===== RIGHT: Stacked bar 24% breakdown =====
    const rX = 8.0, rY = 2.2, rW = SW - 0.7 - rX;
    s.addText("BORROWER ALL-IN  ·  24% APR", {
      x: rX, y: rY, w: rW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.teal, bold: true, charSpacing: 4, margin: 0,
    });
    hr(s, p, rX, rY + 0.35, rW, C.lineDark, 0.5);

    // Stacked vertical bar (full = 24%, ratios: 8/12/4 = 33/50/17)
    const sbX = rX + 0.5, sbY = rY + 0.7, sbW = 1.0, sbH = 4.0;
    const segs = [
      { lbl: "Risk Margin",   pct: "4%",  ratio: 4/24,  color: C.warn,    sub: "POL + risk reserve" },
      { lbl: "Operations",    pct: "12%", ratio: 12/24, color: C.gold,    sub: "appraisal · custody · insurance · servicing" },
      { lbl: "LP Yield",      pct: "8%",  ratio: 8/24,  color: C.teal,    sub: "cost of capital" },
    ];
    let segCursor = 0;
    segs.forEach(seg => {
      const segH = sbH * seg.ratio;
      s.addShape(p.shapes.RECTANGLE, {
        x: sbX, y: sbY + segCursor, w: sbW, h: segH,
        fill: { color: seg.color }, line: { color: seg.color, width: 0 },
      });
      // pct label INSIDE segment
      s.addText(seg.pct, {
        x: sbX, y: sbY + segCursor, w: sbW, h: segH,
        fontFace: F.serif, fontSize: 18, bold: true, color: C.ink,
        align: "center", valign: "middle", margin: 0,
      });
      // descriptor to the right
      s.addText(seg.lbl, {
        x: sbX + sbW + 0.2, y: sbY + segCursor + segH/2 - 0.18, w: rW - sbW - 0.7, h: 0.3,
        fontFace: F.serif, fontSize: 14, color: C.cream, bold: true, valign: "middle", margin: 0,
      });
      s.addText(seg.sub, {
        x: sbX + sbW + 0.2, y: sbY + segCursor + segH/2 + 0.05, w: rW - sbW - 0.7, h: 0.25,
        fontFace: F.sans, fontSize: 10, color: C.muteDark, italic: true, valign: "middle", margin: 0,
      });
      segCursor += segH;
    });

    // Bottom strip — Vaulx revenue
    hr(s, p, 0.7, 6.95, SW - 1.4, C.lineDark, 0.5);
    s.addText([
      { text: "Vaulx revenue:  ", options: { color: C.creamSoft } },
      { text: "$300–600", options: { color: C.gold, bold: true } },
      { text: "  per asset / year  ·  ", options: { color: C.creamSoft } },
      { text: "LP net ~5% APR", options: { color: C.cream } },
      { text: "  (collateralized · insured)", options: { color: C.muteDark, italic: true } },
    ], {
      x: 0.7, y: 7.05, w: SW - 1.4, h: 0.35,
      fontFace: F.serif, fontSize: 14, align: "center", margin: 0,
    });

    s.addNotes("We offer borrowers 50% LTV at 24% APR. We beat the cheapest formal credit, provide 2.5× more capital, and value the watch as a watch — not scrap metal. Vaulx nets $300 to $600 per asset per year.");
  }

  // ============================================================
  // SLIDE 5 — LP TRANCHES & DEFAULT PATH (pyramid + timeline)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };
    eyebrow(s, p, 0.7, 0.5, 6.0, "05  /  RISK · LP TRANCHES · DEFAULT");
    pageNum(s, p, 5, TOTAL);

    s.addText("Risk is tiered. Default is choreographed.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, color: C.cream, bold: true, margin: 0,
    });
    hr(s, p, 0.7, 1.85, 1.0, C.teal, 1.2);

    // ===== LEFT: 3-layer pyramid =====
    const lX = 0.7, lW = 6.4;
    s.addText("LP CAPITAL STACK", {
      x: lX, y: 2.15, w: lW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.teal, bold: true, charSpacing: 4, margin: 0,
    });
    hr(s, p, lX, 2.5, lW, C.lineDark, 0.5);

    // Pyramid: top biggest (Senior 75%), middle (Junior 25%), bottom narrow (POL 5%)
    const pyrCx = lX + lW/2;
    const pyrTopY = 2.85;
    const layers = [
      { lbl: "SENIOR  ·  8% APR",    share: "~75% capital", note: "last to take losses",        widthRatio: 1.0, color: C.teal },
      { lbl: "JUNIOR  ·  12% APR",   share: "~25% capital", note: "first above POL",            widthRatio: 0.65, color: C.gold },
      { lbl: "VAULX POL  ·  —",      share: "5% of every loan", note: "absorbs first 5% of any default", widthRatio: 0.32, color: C.warn },
    ];
    const layerH = 0.85, layerGap = 0.12;
    const baseW = 5.0;
    layers.forEach((layer, i) => {
      const w = baseW * layer.widthRatio;
      const x = pyrCx - w/2;
      const y = pyrTopY + i * (layerH + layerGap);
      s.addShape(p.shapes.RECTANGLE, {
        x, y, w, h: layerH,
        fill: { color: i === 2 ? C.inkSoft : layer.color, transparency: i === 2 ? 0 : 0 },
        line: { color: layer.color, width: i === 2 ? 1.5 : 0 },
      });
      // text overlay
      s.addText(layer.lbl, {
        x, y: y + 0.08, w, h: 0.32,
        fontFace: F.serif, fontSize: 16, bold: true,
        color: i === 2 ? layer.color : C.ink,
        align: "center", valign: "middle", margin: 0,
      });
      s.addText(layer.share + "  ·  " + layer.note, {
        x, y: y + 0.45, w, h: 0.32,
        fontFace: F.mono, fontSize: 10,
        color: i === 2 ? C.creamSoft : C.ink,
        italic: true, align: "center", valign: "middle", margin: 0,
      });
    });

    // Loss waterfall arrow
    s.addText([
      { text: "LOSS WATERFALL  ·  ", options: { color: C.gold, bold: true, charSpacing: 3 } },
      { text: "Borrower equity  →  POL  →  Junior  →  Senior", options: { color: C.cream, italic: true } },
    ], {
      x: lX, y: pyrTopY + 3 * (layerH + layerGap) + 0.15, w: lW, h: 0.4,
      fontFace: F.serif, fontSize: 13, align: "center", margin: 0,
    });
    s.addText("Senior beats Maple syrupUSDC (~7%) by 100 bps.", {
      x: lX, y: pyrTopY + 3 * (layerH + layerGap) + 0.6, w: lW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.muteDark, italic: true, align: "center", margin: 0,
    });

    // ===== RIGHT: 14-day vertical timeline =====
    const rX = 7.7, rW = SW - 0.7 - rX;
    s.addText("14-DAY DEFAULT PATH", {
      x: rX, y: 2.15, w: rW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.teal, bold: true, charSpacing: 4, margin: 0,
    });
    hr(s, p, rX, 2.5, rW, C.lineDark, 0.5);

    const path = [
      { t: "T+0",  what: "Margin call",       sub: "24h to top up" },
      { t: "T+1",  what: "Pool LPs",          sub: "last appraisal floor" },
      { t: "T+3",  what: "Resellers",         sub: "authorized network" },
      { t: "T+7",  what: "Open Dutch auction",sub: "onchain decay" },
      { t: "T+14", what: "Offline backstop",  sub: "70% reserve" },
    ];
    const tStartY = 2.85;
    const stepGap = 0.7;
    path.forEach((step, i) => {
      const ty = tStartY + i * stepGap;
      // dot
      s.addShape(p.shapes.OVAL, {
        x: rX + 0.3, y: ty + 0.18, w: 0.18, h: 0.18,
        fill: { color: C.teal }, line: { color: C.teal, width: 0 },
      });
      // connector line down to next
      if (i < path.length - 1) {
        s.addShape(p.shapes.LINE, {
          x: rX + 0.39, y: ty + 0.36, w: 0, h: stepGap - 0.18,
          line: { color: C.teal, width: 1 },
        });
      }
      s.addText(step.t, {
        x: rX + 0.6, y: ty, w: 0.9, h: 0.32,
        fontFace: F.mono, fontSize: 12, color: C.gold, bold: true, valign: "middle", margin: 0,
      });
      s.addText(step.what, {
        x: rX + 1.5, y: ty, w: rW - 1.6, h: 0.32,
        fontFace: F.serif, fontSize: 14, bold: true, color: C.cream, valign: "middle", margin: 0,
      });
      s.addText(step.sub, {
        x: rX + 1.5, y: ty + 0.3, w: rW - 1.6, h: 0.28,
        fontFace: F.sans, fontSize: 10, color: C.muteDark, italic: true, margin: 0,
      });
    });

    s.addNotes("LPs are tranched to match risk. Senior LPs earn 8 percent fixed, while Junior LPs earn 12 percent, sitting safely above our 5 percent protocol-owned first-loss buffer. Every loan is over-collateralized, with a strict 14-day Dutch auction on default.");
  }

  // ============================================================
  // SLIDE 6 — TAM & DISTRIBUTION (funnel + 3 cards)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };
    eyebrow(s, p, 0.7, 0.5, 6.0, "06  /  TAM  ·  DISTRIBUTION");
    pageNum(s, p, 6, TOTAL);

    s.addText("Built to scale. Distribution is built-in.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, color: C.cream, bold: true, margin: 0,
    });
    hr(s, p, 0.7, 1.85, 1.0, C.teal, 1.2);

    // ===== LEFT: Inverted funnel =====
    const lX = 0.7, lW = 6.0;
    s.addText("ADDRESSABLE MARKET", {
      x: lX, y: 2.15, w: lW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.teal, bold: true, charSpacing: 4, margin: 0,
    });
    hr(s, p, lX, 2.5, lW, C.lineDark, 0.5);

    // 3 trapezoidal levels going narrow → narrower → narrowest
    const fX = lX + 0.5, fY = 2.85;
    const levels = [
      { val: "$90B",  lbl: "Watches in private hands",      sub: "high-credit-cost markets",      w: 5.0 },
      { val: "$20B",  lbl: "Realistically addressable",     sub: "5-yr horizon",                  w: 3.6 },
      { val: "$1–3B", lbl: "Year-5 origination target",     sub: "1–5% capture of pool",          w: 2.2 },
    ];
    const levelH = 1.15, levelGap = 0.05;
    levels.forEach((lv, i) => {
      const x = fX + (5.0 - lv.w) / 2;
      const y = fY + i * (levelH + levelGap);
      s.addShape(p.shapes.RECTANGLE, {
        x, y, w: lv.w, h: levelH,
        fill: { color: i === 0 ? C.teal : (i === 1 ? C.tealLift : C.gold) },
        line: { color: i === 0 ? C.teal : (i === 1 ? C.tealLift : C.gold), width: 0 },
      });
      s.addText(lv.val, {
        x, y: y + 0.1, w: lv.w, h: 0.5,
        fontFace: F.serif, fontSize: 28, bold: true, color: C.ink,
        align: "center", valign: "middle", margin: 0,
      });
      s.addText(lv.lbl, {
        x, y: y + 0.55, w: lv.w, h: 0.32,
        fontFace: F.mono, fontSize: 10, color: C.ink, bold: true,
        charSpacing: 2, align: "center", valign: "middle", margin: 0,
      });
      s.addText(lv.sub, {
        x, y: y + 0.85, w: lv.w, h: 0.25,
        fontFace: F.sans, fontSize: 9.5, color: C.ink, italic: true,
        align: "center", valign: "middle", margin: 0,
      });
    });

    // ===== RIGHT: 3 distribution cards =====
    const rX = 7.2, rW = SW - 0.7 - rX;
    s.addText("PROPRIETARY DISTRIBUTION", {
      x: rX, y: 2.15, w: rW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.teal, bold: true, charSpacing: 4, margin: 0,
    });
    hr(s, p, rX, 2.5, rW, C.lineDark, 0.5);

    const cards = [
      { name: "4p.finance",      sub: "São Paulo luxury watch flow on crypto rails today",            icon: ICO.watch },
      { name: "Gitel",           sub: "38-year Brazilian corporate electronic-security network",     icon: ICO.cctv },
      { name: "Kamino · Loopscale", sub: "Curated Solana yield audiences via Anchor CPI",            icon: ICO.layers },
    ];
    const ccY0 = 2.85, ccH = 1.25, ccGap = 0.18;
    cards.forEach((c, i) => {
      const ccy = ccY0 + i * (ccH + ccGap);
      s.addShape(p.shapes.RECTANGLE, {
        x: rX, y: ccy, w: rW, h: ccH,
        fill: { color: C.inkSoft }, line: { color: C.teal, width: 0.75 },
      });
      s.addImage({ data: c.icon, x: rX + 0.25, y: ccy + 0.4, w: 0.45, h: 0.45 });
      s.addText(c.name, {
        x: rX + 0.95, y: ccy + 0.2, w: rW - 1.1, h: 0.45,
        fontFace: F.serif, fontSize: 18, bold: true, color: C.cream, valign: "middle", margin: 0,
      });
      s.addText(c.sub, {
        x: rX + 0.95, y: ccy + 0.6, w: rW - 1.1, h: 0.55,
        fontFace: F.sans, fontSize: 11, color: C.creamSoft, margin: 0, lineSpacing: 14,
      });
    });

    // Bottom note
    s.addText([
      { text: "→  ", options: { color: C.teal } },
      { text: "Low CAC at launch.  ", options: { color: C.cream, bold: true } },
      { text: "Growth driven by partner-network multiplication, not paid acquisition.", options: { color: C.creamSoft, italic: true } },
    ], {
      x: 0.7, y: SH - 0.55, w: SW - 1.4, h: 0.35,
      fontFace: F.serif, fontSize: 13, align: "center", margin: 0,
    });

    s.addNotes("90 billion dollars in watches. 20 billion realistically addressable. 1 to 3 billion year-5. Distribution is built-in: 4p.finance already processes São Paulo luxury watch flow on crypto rails. Gitel brings a 38-year corporate network. Kamino and Loopscale pipe us into Solana yield audiences. Low CAC at launch.");
  }

  // ============================================================
  // SLIDE 7 — WHY NOW & COMPETITIVE VERTEX (2x2 grid)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };
    eyebrow(s, p, 0.7, 0.5, 6.0, "07  /  WHY NOW  ·  THE VERTEX");
    pageNum(s, p, 7, TOTAL);

    s.addText("The unoccupied vertex. The institutional window.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 30, color: C.cream, bold: true, margin: 0,
    });
    s.addText("Solana primitives are ready. Stablecoin rails went live. Competitors are stuck on the wrong vertex.", {
      x: 0.7, y: 1.7, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.creamSoft, margin: 0,
    });
    hr(s, p, 0.7, 2.18, 1.0, C.teal, 1.2);

    // 2x2 grid
    const cells = [
      { eyebrow: "01  ·  TECH",            big: "Solana primitives",       sub: "$1.82B RWA TVL · cNFTs at fractions of a cent · SAS for reusable KYC", icon: ICO.bolt },
      { eyebrow: "02  ·  RAILS",           big: "Stablecoin distribution", sub: "Western Union USDPT launched May 2026 · Visa · Stripe · PayPal live",   icon: ICO.dollar },
      { eyebrow: "03  ·  GEOGRAPHY",       big: "Emerging-market first",   sub: "Credit costs 60–400% in BR/MX/TR/IN · US-first competitors miss this",  icon: ICO.globe },
      { eyebrow: "04  ·  CUSTODY",         big: "Licensed third-party",    sub: "No closed black box · No self-custody risk · Brinks-class network",     icon: ICO.shield },
    ];
    const gX = 0.7, gY = 2.5, gw = (SW - 1.4 - 0.25) / 2, gh = (SH - gY - 0.7 - 0.25) / 2;
    cells.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx = gX + col * (gw + 0.25);
      const cy = gY + row * (gh + 0.25);
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: cy, w: gw, h: gh,
        fill: { color: C.inkSoft }, line: { color: C.teal, width: 0.75 },
      });
      s.addImage({ data: c.icon, x: cx + 0.3, y: cy + 0.3, w: 0.5, h: 0.5 });
      s.addText(c.eyebrow, {
        x: cx + 1.0, y: cy + 0.3, w: gw - 1.2, h: 0.3,
        fontFace: F.mono, fontSize: 10, color: C.teal, bold: true, charSpacing: 4, valign: "middle", margin: 0,
      });
      s.addText(c.big, {
        x: cx + 1.0, y: cy + 0.6, w: gw - 1.2, h: 0.55,
        fontFace: F.serif, fontSize: 22, bold: true, color: C.cream, margin: 0,
      });
      hr(s, p, cx + 0.3, cy + gh - 0.85, gw - 0.6, C.lineDark, 0.5);
      s.addText(c.sub, {
        x: cx + 0.3, y: cy + gh - 0.75, w: gw - 0.6, h: 0.65,
        fontFace: F.sans, fontSize: 12, color: C.creamSoft, margin: 0, lineSpacing: 16,
      });
    });

    s.addNotes("Why now? We could not have built this 18 months ago. Bubblegum gives us cNFTs for fractions of a penny. Sumsub's native Solana Attestation Service gives us reusable KYC. Western Union just launched on Solana. Competitors are on Ethereum or US-first. We sit in the unoccupied vertex.");
  }

  // ============================================================
  // SLIDE 8 — TEAM (5 minimal cards side by side)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };
    eyebrow(s, p, 0.7, 0.5, 6.0, "08  /  TEAM");
    pageNum(s, p, 8, TOTAL);

    s.addText("Operators, builders, and market access.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 30, color: C.cream, bold: true, margin: 0,
    });
    s.addText("Anyone can fork a smart contract. You cannot fork our real-world network.", {
      x: 0.7, y: 1.7, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.creamSoft, italic: true, margin: 0,
    });
    hr(s, p, 0.7, 2.18, 1.0, C.teal, 1.2);

    const team = [
      { icon: ICO.bank,  name: "George Dimitrov", role: "CEO / CTO",            body: "Global banking ops, corporate execution, regulatory acumen." },
      { icon: ICO.cctv,  name: "Marcelo Coelho",  role: "COO  ·  Gitel CEO",    body: "38 yrs Brazilian electronic-security & IoT infra — the stack behind Vaulx's custody invariant." },
      { icon: ICO.hand,  name: "Rodrigo Coelho",  role: "Chief Growth",         body: "LATAM institutional network, market entry, commercial partnerships." },
      { icon: ICO.code,  name: "Edson Pohren",    role: "Senior Solana Eng",    body: "Anchor, Bubblegum, oracle integration. Ships the on-chain stack." },
      { icon: ICO.watch, name: "Felipe Veloso",   role: "DeFi Advisor",         body: "4p.finance founder. São Paulo luxury watch flow on crypto rails. US/BR DeFi network." },
    ];
    const tY = 2.5, tH = SH - tY - 0.7;
    const tGap = 0.18;
    const tW = (SW - 1.4 - 4 * tGap) / 5;
    team.forEach((m, i) => {
      const tx = 0.7 + i * (tW + tGap);
      s.addShape(p.shapes.RECTANGLE, {
        x: tx, y: tY, w: tW, h: tH,
        fill: { color: C.inkSoft }, line: { color: C.teal, width: 0.75 },
      });
      // top tick
      s.addShape(p.shapes.RECTANGLE, {
        x: tx, y: tY, w: 0.06, h: 0.4,
        fill: { color: C.teal }, line: { color: C.teal, width: 0 },
      });
      // value icon in circle
      s.addShape(p.shapes.OVAL, {
        x: tx + tW/2 - 0.45, y: tY + 0.4, w: 0.9, h: 0.9,
        fill: { color: C.ink }, line: { color: C.teal, width: 0.75 },
      });
      s.addImage({ data: m.icon, x: tx + tW/2 - 0.28, y: tY + 0.57, w: 0.56, h: 0.56 });
      // name
      s.addText(m.name, {
        x: tx + 0.15, y: tY + 1.45, w: tW - 0.3, h: 0.4,
        fontFace: F.serif, fontSize: 15, bold: true, color: C.cream, align: "center", margin: 0,
      });
      // role
      s.addText(m.role, {
        x: tx + 0.15, y: tY + 1.83, w: tW - 0.3, h: 0.32,
        fontFace: F.mono, fontSize: 9.5, color: C.teal, bold: true, charSpacing: 2,
        align: "center", margin: 0,
      });
      hr(s, p, tx + 0.4, tY + 2.18, tW - 0.8, C.lineDark, 0.5);
      // body
      s.addText(m.body, {
        x: tx + 0.2, y: tY + 2.28, w: tW - 0.4, h: tH - 2.4,
        fontFace: F.sans, fontSize: 10.5, color: C.creamSoft, align: "center",
        margin: 0, lineSpacing: 14,
      });
    });

    s.addNotes("Anyone can fork a smart contract. You cannot fork our real-world network. Marcelo brings 38 years of Brazilian physical security infrastructure. Felipe already processes São Paulo's luxury watch flow on crypto rails. Our customer acquisition cost at launch is near zero. We bring the borrowers. Solana brings the capital.\n\nLinkedIn:\n· George Dimitrov — linkedin.com/in/gheorghedimitrov/\n· Marcelo Coelho — linkedin.com/in/marcelo-coelho-78564236/\n· Rodrigo Coelho — linkedin.com/in/rodrigo-coelho-2459a123/\n· Edson Pohren — linkedin.com/in/edson-pohren-19421ab5/\n· Felipe Veloso — 4p.finance");
  }

  // ============================================================
  // SLIDE 9 — ASK & ROADMAP (giant text + vertical timeline)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };
    eyebrow(s, p, 0.7, 0.5, 6.0, "09  /  ASK  ·  ROADMAP");
    pageNum(s, p, 9, TOTAL);

    s.addText("Mainnet in 90 days.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.95,
      fontFace: F.serif, fontSize: 36, bold: true, color: C.cream, margin: 0,
    });
    hr(s, p, 0.7, 1.95, 1.0, C.gold, 1.5);

    // ===== LEFT: giant ask =====
    const lX = 0.7, lY = 2.3, lW = 6.5, lH = 4.4;
    s.addShape(p.shapes.RECTANGLE, {
      x: lX, y: lY, w: lW, h: lH,
      fill: { color: C.inkSoft }, line: { color: C.gold, width: 1.5 },
    });
    // gold tick on left edge
    s.addShape(p.shapes.RECTANGLE, {
      x: lX, y: lY, w: 0.1, h: lH,
      fill: { color: C.gold }, line: { color: C.gold, width: 0 },
    });
    s.addText("OUR ASK", {
      x: lX + 0.4, y: lY + 0.3, w: lW - 0.6, h: 0.3,
      fontFace: F.mono, fontSize: 11, color: C.gold, bold: true, charSpacing: 5, margin: 0,
    });
    s.addText("$250K", {
      x: lX, y: lY + 0.7, w: lW, h: 2.2,
      fontFace: F.serif, fontSize: 130, bold: true, color: C.gold,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText("Colosseum RWA track  ·  pre-seed bridge", {
      x: lX, y: lY + 2.95, w: lW, h: 0.4,
      fontFace: F.serif, fontSize: 16, italic: true, color: C.cream,
      align: "center", margin: 0,
    });
    hr(s, p, lX + 0.6, lY + 3.5, lW - 1.2, C.lineDark, 0.5);
    s.addText([
      { text: "→  ", options: { color: C.gold } },
      { text: "audit our 4 Anchor programs", options: { color: C.cream } },
      { text: "      →  ", options: { color: C.gold } },
      { text: "sign first custodian", options: { color: C.cream } },
      { text: "      →  ", options: { color: C.gold } },
      { text: "first mainnet loan", options: { color: C.cream } },
    ], {
      x: lX + 0.4, y: lY + 3.7, w: lW - 0.8, h: 0.5,
      fontFace: F.sans, fontSize: 11, align: "center", valign: "middle", margin: 0,
    });

    // ===== RIGHT: vertical timeline =====
    const rX = 7.5, rY = 2.3, rW = SW - 0.7 - rX;
    s.addText("90-DAY PLAN", {
      x: rX, y: rY + 0.05, w: rW, h: 0.3,
      fontFace: F.mono, fontSize: 11, color: C.teal, bold: true, charSpacing: 5, margin: 0,
    });
    hr(s, p, rX, rY + 0.4, rW, C.lineDark, 0.5);

    const milestones = [
      { day: "DAY 0",   what: "Audit kickoff",          sub: "external review + bug bounty" },
      { day: "DAY 60",  what: "Custodian signed",       sub: "Lloyd's binder confirmed" },
      { day: "DAY 90",  what: "Mainnet launch",         sub: "first real loan · real watch" },
      { day: "Q3 2026", what: "50 customers",           sub: "tranches live" },
      { day: "Q4 2026", what: "100 customers",          sub: "seed close" },
    ];
    const mY0 = rY + 0.65;
    const mGap = 0.78;
    milestones.forEach((m, i) => {
      const my = mY0 + i * mGap;
      // dot
      s.addShape(p.shapes.OVAL, {
        x: rX + 0.05, y: my + 0.18, w: 0.18, h: 0.18,
        fill: { color: C.teal }, line: { color: C.teal, width: 0 },
      });
      // line connector down
      if (i < milestones.length - 1) {
        s.addShape(p.shapes.LINE, {
          x: rX + 0.14, y: my + 0.36, w: 0, h: mGap - 0.18,
          line: { color: C.teal, width: 1 },
        });
      }
      s.addText(m.day, {
        x: rX + 0.4, y: my, w: 1.2, h: 0.32,
        fontFace: F.mono, fontSize: 11, color: C.gold, bold: true, charSpacing: 3, valign: "middle", margin: 0,
      });
      s.addText(m.what, {
        x: rX + 0.4, y: my + 0.3, w: rW - 0.5, h: 0.32,
        fontFace: F.serif, fontSize: 14, bold: true, color: C.cream, valign: "middle", margin: 0,
      });
      s.addText(m.sub, {
        x: rX + 0.4, y: my + 0.55, w: rW - 0.5, h: 0.25,
        fontFace: F.sans, fontSize: 10, color: C.muteDark, italic: true, margin: 0,
      });
    });

    // Footer
    hr(s, p, 0.7, SH - 0.55, SW - 1.4, C.lineDark, 0.5);
    s.addText([
      { text: "github.com/Vaulxfi", options: { color: C.cream } },
      { text: "  ·  ", options: { color: C.teal } },
      { text: "vaulx.fi", options: { color: C.cream } },
      { text: "  ·  ", options: { color: C.teal } },
      { text: "Solana Devnet", options: { color: C.creamSoft } },
      { text: "  ·  ", options: { color: C.teal } },
      { text: "Come build with us.", options: { color: C.gold, bold: true, italic: true } },
    ], {
      x: 0.7, y: SH - 0.42, w: SW - 1.4, h: 0.35,
      fontFace: F.mono, fontSize: 11, align: "center", margin: 0,
    });

    s.addNotes("Today, our four Anchor programs are live on Devnet with passing CI tests. We are asking for the $250,000 Colosseum prize to audit our contracts, finalize our first Brinks-class custodian, and originate our first mainnet loans. Stop pricing luxury assets as scrap metal. We are Vaulx. Come build with us.");
  }

  const outDir = OUT.substring(0, OUT.lastIndexOf("/"));
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  await p.writeFile({ fileName: OUT });
  console.log("Wrote:", OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
