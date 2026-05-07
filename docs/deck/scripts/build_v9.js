// Vaulx Pitch v9 — editorial rebuild
// Archetype: Editorial / Magazine. Differentiator: lowercase wordmark + gold-on-black big-number callouts + warn-red ONLY for predatory rates.
// 8 slides, dark/light alternation, real logo files, fact-checked v8.1 substance.

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const fa = require("react-icons/fa");
const fa6 = require("react-icons/fa6");
const md = require("react-icons/md");
const si = require("react-icons/si");
const { watchSvg, svgToPngB64 } = require("./svg_assets");

const OUT = "/Users/gogy/MyCODE/VAULX/.claude/worktrees/recursing-mcnulty-a36d0a/docs/colosseum/Vaulx_Pitch_v9.pptx";
const ASSETS = "/Users/gogy/MyCODE/VAULX/.claude/worktrees/recursing-mcnulty-a36d0a/docs/colosseum";
const HTML_ASSETS = "/Users/gogy/Downloads/vaulx_editable_html_deck_v2/assets";

// Wide layout: 13.333 x 7.5 inches
const SW = 13.333, SH = 7.5;

// ====================================================================
// EDITORIAL PALETTE (locked)
// ====================================================================
const C = {
  ink:        "0A0A0B",   // dark bg
  inkSoft:    "12131A",   // dark card bg (slightly lifted)
  paper:      "FAFAF7",   // light bg
  paperCard:  "FFFFFF",   // light card bg
  cream:      "F5F0E8",   // text on dark
  creamSoft:  "D8D3C5",   // muted text on dark
  tealDeep:   "0E7C7B",   // primary structural teal
  tealSpark:  "0FB5A6",   // accent (callouts, dividers, bright moments)
  gold:       "C9A86A",   // big numbers, headline emphasis
  goldSoft:   "B8985A",
  warn:       "B8412C",   // RESERVED for predatory rates only
  mute:       "6B6B70",
  muteDark:   "8A8A90",
  lineDark:   "1F1F25",
  lineLight:  "E5E2D8",
  ink2:       "1A1A1D",   // body text on light
};

// Fonts
const F = {
  serif: "Georgia",
  sans: "Calibri",
  mono: "Consolas",
};

async function iconPng(Icon, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ====================================================================
// Helper utilities
// ====================================================================

// hairline horizontal line
function hr(s, p, x, y, w, color, weight = 0.5) {
  s.addShape(p.shapes.LINE, { x, y, w, h: 0, line: { color, width: weight } });
}

// hairline vertical line
function vr(s, p, x, y, h, color, weight = 0.5) {
  s.addShape(p.shapes.LINE, { x, y, w: 0, h, line: { color, width: weight } });
}

// editorial eyebrow (small mono caps with leading tick)
function eyebrow(s, p, x, y, w, text, color = C.tealSpark) {
  s.addShape(p.shapes.RECTANGLE, {
    x, y: y + 0.08, w: 0.12, h: 0.025,
    fill: { color }, line: { color, width: 0 },
  });
  s.addText(text, {
    x: x + 0.18, y, w: w - 0.18, h: 0.25,
    fontFace: F.mono, fontSize: 9.5, color, bold: true,
    charSpacing: 4, valign: "middle", margin: 0,
  });
}

// page number badge (top-right corner)
function pageNum(s, p, num, total, color, lineColor) {
  s.addText(`${String(num).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: SW - 1.4, y: 0.3, w: 1.0, h: 0.25,
    fontFace: F.mono, fontSize: 9, color,
    align: "right", charSpacing: 3, valign: "middle", margin: 0,
  });
}

// footer mark with small logo and url
function footer(s, p, isDark) {
  const c = isDark ? C.muteDark : C.mute;
  const logoPath = isDark ? `${ASSETS}/vaulx_logo_white.png` : `${ASSETS}/vaulx_logo_black.png`;
  // Small logo bottom-left (using actual logo file)
  s.addImage({
    path: logoPath,
    x: 0.55, y: SH - 0.45, w: 0.55, h: 0.15,
  });
  s.addText("·", {
    x: 1.15, y: SH - 0.5, w: 0.15, h: 0.25,
    fontFace: F.mono, fontSize: 11, color: c, valign: "middle", margin: 0, align: "center",
  });
  s.addText("github.com/Vaulxfi", {
    x: 1.3, y: SH - 0.5, w: 2.5, h: 0.25,
    fontFace: F.mono, fontSize: 9, color: c, valign: "middle", margin: 0,
  });
  s.addText("colosseum.cypherpunk · 2026", {
    x: SW - 3.5, y: SH - 0.5, w: 3.0, h: 0.25,
    fontFace: F.mono, fontSize: 9, color: c, valign: "middle", margin: 0, align: "right", charSpacing: 2,
  });
}

// ====================================================================
// MAIN
// ====================================================================
async function main() {
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE";
  p.title = "Vaulx — The on-chain credit protocol";
  p.author = "Vaulx";
  p.company = "Vaulx";
  p.subject = "Colosseum Cypherpunk Hackathon 2026";

  // Pre-render assets
  const watchPng = await svgToPngB64(watchSvg(`#${C.cream}`, 2.5));
  const watchPngDark = await svgToPngB64(watchSvg(`#${C.tealDeep}`, 2.5));

  // Pre-render icons (color-coded for context)
  const ICO = {
    // dark-slide icons (teal-spark)
    shieldT:    await iconPng(fa.FaShieldAlt, "#0FB5A6"),
    shieldChkT: await iconPng(md.MdVerifiedUser, "#0FB5A6"),
    globeT:     await iconPng(fa.FaGlobe, "#0FB5A6"),
    rocketT:    await iconPng(fa.FaRocket, "#0FB5A6"),
    diamondT:   await iconPng(fa6.FaGem, "#0FB5A6"),
    bankT:      await iconPng(fa.FaUniversity, "#0FB5A6"),
    solanaT:    await iconPng(si.SiSolana, "#0FB5A6"),
    dropT:      await iconPng(md.MdWaterDrop, "#0FB5A6"),
    tagT:       await iconPng(fa.FaTag, "#0FB5A6"),
    boltT:      await iconPng(fa.FaBolt, "#0FB5A6"),
    layersT:    await iconPng(fa.FaLayerGroup, "#0FB5A6"),
    chartT:     await iconPng(fa.FaChartLine, "#0FB5A6"),
    chartUpT:   await iconPng(fa6.FaArrowTrendUp, "#0FB5A6"),
    codeT:      await iconPng(fa.FaCode, "#0FB5A6"),
    githubT:    await iconPng(fa.FaGithub, "#0FB5A6"),
    userT:      await iconPng(fa.FaUser, "#0FB5A6"),
    calendarT:  await iconPng(fa.FaCalendarAlt, "#0FB5A6"),

    // dark-slide gold icons (for hero numbers)
    diamondG:   await iconPng(fa6.FaGem, "#C9A86A"),

    // light-slide icons (teal-deep)
    shieldD:    await iconPng(fa.FaShieldAlt, "#0E7C7B"),
    shieldChkD: await iconPng(md.MdVerifiedUser, "#0E7C7B"),
    globeD:     await iconPng(fa.FaGlobe, "#0E7C7B"),
    bankD:      await iconPng(fa.FaUniversity, "#0E7C7B"),
    solanaD:    await iconPng(si.SiSolana, "#0E7C7B"),
    searchD:    await iconPng(fa.FaSearch, "#0E7C7B"),
    safeD:      await iconPng(md.MdLock, "#0E7C7B"),
    dollarD:    await iconPng(fa.FaDollarSign, "#0E7C7B"),
    scaleD:     await iconPng(fa6.FaScaleBalanced, "#0E7C7B"),
    userChkD:   await iconPng(fa.FaUserCheck, "#0E7C7B"),
    clipD:      await iconPng(fa.FaClipboardCheck, "#0E7C7B"),
    linkD:      await iconPng(fa.FaLink, "#0E7C7B"),
    syncD:      await iconPng(fa.FaSyncAlt, "#0E7C7B"),
    handD:      await iconPng(fa.FaHandshake, "#0E7C7B"),
    codeD:      await iconPng(fa.FaCode, "#0E7C7B"),
    shareD:     await iconPng(fa.FaShareAlt, "#0E7C7B"),
    chartD:     await iconPng(fa.FaChartLine, "#0E7C7B"),
    watchD:     await iconPng(md.MdWatch, "#0E7C7B"),
    cctv:       await iconPng(md.MdVideocam, "#0E7C7B"),
  };

  const TOTAL = 8;

  // ============================================================
  // SLIDE 1 — COVER (dark)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    // Faded vx watermark large on right side (use HTML deck v2's vx.png if available)
    if (fs.existsSync(`${HTML_ASSETS}/vx.png`)) {
      s.addImage({
        path: `${HTML_ASSETS}/vx.png`,
        x: SW - 5.2, y: 0.5, w: 5.0, h: 4.5,
        transparency: 92,
      });
    }

    // Eyebrow row top-left
    eyebrow(s, p, 0.7, 0.5, 6.0, "VAULX  ·  COLOSSEUM CYPHERPUNK 2026  ·  SOLANA RWA TRACK", C.tealSpark);

    // The official lowercase logo (large, hero)
    s.addImage({
      path: `${ASSETS}/vaulx_logo_white.png`,
      x: 0.7, y: 1.1, w: 5.5, h: 1.5, // 2229/609 = 3.66 ratio → 5.5x1.5
    });

    // Hairline gold divider
    s.addShape(p.shapes.LINE, {
      x: 0.7, y: 2.85, w: 1.5, h: 0,
      line: { color: C.gold, width: 1.5 },
    });

    // Serif headline
    s.addText("The on-chain credit protocol.", {
      x: 0.7, y: 3.1, w: 9.5, h: 0.7,
      fontFace: F.serif, fontSize: 36, bold: false, color: C.cream, margin: 0,
    });

    // Body description
    s.addText("Connecting asset-rich individuals in high-rate markets to yield-seeking global capital — secured by verifiable physical luxury collateral with deterministic on-chain liquidation.", {
      x: 0.7, y: 3.9, w: 9.5, h: 1.0,
      fontFace: F.sans, fontSize: 15, color: C.creamSoft, margin: 0, lineSpacing: 24,
    });

    // Mono accent line — the killer one-liner
    s.addText([
      { text: "All in smart contracts.  ", options: { color: C.tealSpark, bold: true } },
      { text: "Vaulx doesn't take custody.  ", options: { color: C.cream } },
      { text: "Vaulx doesn't hold capital.", options: { color: C.cream } },
    ], {
      x: 0.7, y: 5.05, w: 11.0, h: 0.4,
      fontFace: F.mono, fontSize: 12, charSpacing: 1, margin: 0,
    });

    // Three pillar marks below
    const pillarY = 5.7, pillarH = 0.85;
    const pillars = [
      { lbl: "ATOMIC INVARIANT", desc: "no USDC disburses without licensed-custodian signature" },
      { lbl: "GLOBAL CORE",      desc: "8 of 10 modules ship globally · 2 swap per market" },
      { lbl: "DEVNET LIVE",      desc: "4 Anchor programs · 45+ tests · indexer + bridge" },
    ];
    const colW = (SW - 1.4) / 3;
    pillars.forEach((pl, i) => {
      const cx = 0.7 + i * colW;
      // hairline top divider
      hr(s, p, cx, pillarY, colW - 0.3, C.lineDark, 0.5);
      s.addText(pl.lbl, {
        x: cx, y: pillarY + 0.1, w: colW - 0.3, h: 0.3,
        fontFace: F.mono, fontSize: 10, color: C.tealSpark, bold: true, charSpacing: 4, margin: 0,
      });
      s.addText(pl.desc, {
        x: cx, y: pillarY + 0.42, w: colW - 0.3, h: 0.4,
        fontFace: F.sans, fontSize: 11, color: C.creamSoft, italic: false, margin: 0, lineSpacing: 14,
      });
    });

    // Bottom mono link strip
    hr(s, p, 0.7, SH - 0.85, SW - 1.4, C.lineDark, 0.5);
    s.addText([
      { text: "github.com/Vaulxfi", options: { color: C.cream } },
      { text: "   ·   ", options: { color: C.tealSpark } },
      { text: "vaulx.vercel.app", options: { color: C.cream } },
      { text: "   ·   ", options: { color: C.tealSpark } },
      { text: "Solana Devnet  ", options: { color: C.cream } },
      { text: "live today", options: { color: C.gold, bold: true } },
    ], {
      x: 0.7, y: SH - 0.7, w: SW - 1.4, h: 0.3,
      fontFace: F.mono, fontSize: 11, margin: 0, valign: "middle",
    });

    // Page number top-right
    pageNum(s, p, 1, TOTAL, C.muteDark, C.lineDark);
  }

  // ============================================================
  // SLIDE 2 — THE ASYMMETRY (dark)
  // 3-tier Brazilian rate stack + global onchain capital gap
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    eyebrow(s, p, 0.7, 0.5, 6.0, "02  /  THE ASYMMETRY", C.tealSpark);
    pageNum(s, p, 2, TOTAL, C.muteDark, C.lineDark);

    s.addText("Brazil's credit ladder is broken at every rung.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 36, color: C.cream, margin: 0,
    });
    s.addText("Asset-rich borrowers face punitive rates. Global onchain capital sits at single-digit yield with no rail to reach them.", {
      x: 0.7, y: 1.7, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.creamSoft, margin: 0,
    });
    hr(s, p, 0.7, 2.18, 1.0, C.gold, 1.2);

    // === LEFT COLUMN: rate ladder (worst → best) ===
    const lX = 0.7, lW = 7.6;
    s.addText("THE BRAZILIAN RATE STACK", {
      x: lX, y: 2.42, w: lW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.creamSoft, bold: true, charSpacing: 4, margin: 0,
    });

    // Rate ladder rows (worst → best)
    const ladder = [
      { tier: "PENALTY",  product: "Credit-card rotativo",        rate: "~450%", color: C.warn,    width: 6.6, note: "revolving balance, 50M Brazilians" },
      { tier: "STANDARD", product: "Consumer loan",               rate: "~61%",  color: C.warn,    width: 1.8, note: "general bank lending rate" },
      { tier: "CHEAPEST", product: "Caixa penhor",                rate: "~30%",  color: C.gold,    width: 0.9, note: "20% LTV · scrap-metal value" },
      { tier: "VAULX",    product: "Vaulx — physical, atomic",    rate: "24%",   color: C.tealSpark, width: 0.7, note: "50% LTV · full asset value · 2% / month" },
    ];
    const rowY0 = 2.85, rowH = 0.7, rowGap = 0.12;
    ladder.forEach((r, i) => {
      const ry = rowY0 + i * (rowH + rowGap);
      // tier label
      s.addText(r.tier, {
        x: lX, y: ry, w: 1.2, h: rowH,
        fontFace: F.mono, fontSize: 9.5, color: r.color, bold: true,
        charSpacing: 3, valign: "middle", margin: 0,
      });
      // product name
      s.addText(r.product, {
        x: lX + 1.2, y: ry, w: 2.6, h: rowH,
        fontFace: F.serif, fontSize: 14, color: C.cream, bold: false, valign: "middle", margin: 0,
      });
      // bar
      const barX = lX + 3.8, barMaxW = 2.6;
      const barW = (r.width / 6.6) * barMaxW;
      s.addShape(p.shapes.RECTANGLE, {
        x: barX, y: ry + rowH/2 - 0.12, w: barMaxW, h: 0.04,
        fill: { color: C.lineDark }, line: { color: C.lineDark, width: 0 },
      });
      s.addShape(p.shapes.RECTANGLE, {
        x: barX, y: ry + rowH/2 - 0.16, w: barW, h: 0.12,
        fill: { color: r.color }, line: { color: r.color, width: 0 },
      });
      // rate (mono, right of bar)
      s.addText(r.rate, {
        x: lX + 6.5, y: ry, w: 1.1, h: rowH,
        fontFace: F.mono, fontSize: 17, color: r.color, bold: true,
        valign: "middle", margin: 0, align: "right",
      });
      // note below product
      s.addText(r.note, {
        x: lX + 1.2, y: ry + 0.34, w: 5.0, h: 0.3,
        fontFace: F.sans, fontSize: 10, color: C.muteDark, italic: true, margin: 0,
      });
    });

    // Footnote
    s.addText("Sources: Banco Central do Brasil  ·  Trading Economics  ·  Caixa Federal published rates  ·  rotativo = revolving balance past 30-day grace.", {
      x: lX, y: rowY0 + 4 * (rowH + rowGap) + 0.05, w: lW, h: 0.3,
      fontFace: F.mono, fontSize: 8.5, color: C.mute, margin: 0,
    });

    // === RIGHT COLUMN: gap card with watch ===
    const rX = 8.6, rW = 4.1;
    // border
    s.addShape(p.shapes.RECTANGLE, {
      x: rX, y: 2.42, w: rW, h: 4.4,
      fill: { color: C.inkSoft }, line: { color: C.lineDark, width: 0.75 },
    });
    // top eyebrow
    s.addText("GLOBAL ONCHAIN CAPITAL", {
      x: rX, y: 2.6, w: rW, h: 0.3,
      fontFace: F.mono, fontSize: 9.5, color: C.tealSpark, bold: true,
      charSpacing: 5, align: "center", margin: 0,
    });
    // gold mega number
    s.addText("8–10%", {
      x: rX, y: 2.9, w: rW, h: 1.3,
      fontFace: F.serif, fontSize: 76, bold: true, color: C.gold,
      align: "center", margin: 0,
    });
    s.addText("APR  ·  institutional yield", {
      x: rX, y: 4.18, w: rW, h: 0.35,
      fontFace: F.sans, fontSize: 12, color: C.creamSoft, italic: true, align: "center", margin: 0,
    });
    // hairline
    hr(s, p, rX + 0.5, 4.65, rW - 1.0, C.lineDark, 0.5);
    // body
    s.addText("Cheap. Patient. Institutional. Global liquidity priced at single digits — and no trustable rail between this capital and Marcelo's Rolex.", {
      x: rX + 0.3, y: 4.8, w: rW - 0.6, h: 1.2,
      fontFace: F.sans, fontSize: 12, color: C.cream, align: "center", margin: 0, lineSpacing: 18,
    });
    // tiny mono caveat
    s.addText("BTC / ETH-as-collateral exists.  Not the use case.", {
      x: rX + 0.3, y: 6.3, w: rW - 0.6, h: 0.3,
      fontFace: F.mono, fontSize: 9, color: C.mute, italic: true, align: "center", margin: 0,
    });

    // Bottom strip — the gap framing
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: 6.95, w: SW - 1.4, h: 0.0,
      fill: { color: C.gold }, line: { color: C.gold, width: 0 },
    });
    hr(s, p, 0.7, 6.95, SW - 1.4, C.gold, 1.0);
    s.addText([
      { text: "→  ", options: { color: C.gold } },
      { text: "The gap is not capital.  ", options: { color: C.cream, bold: true } },
      { text: "The gap is the rail.", options: { color: C.gold, italic: true, bold: true } },
    ], {
      x: 0.7, y: 7.05, w: SW - 1.4, h: 0.35,
      fontFace: F.serif, fontSize: 16, margin: 0,
    });
  }

  // ============================================================
  // SLIDE 3 — WHY SOLANA, WHY NOW (dark)
  // 3 primitives + 4 institutional signals
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    eyebrow(s, p, 0.7, 0.5, 6.0, "03  /  WHY SOLANA  ·  WHY NOW", C.tealSpark);
    pageNum(s, p, 3, TOTAL, C.muteDark, C.lineDark);

    s.addText([
      { text: "Why Solana. Why now", options: { color: C.cream } },
      { text: ".", options: { color: C.tealSpark } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 36, bold: true, margin: 0,
    });
    s.addText("Three primitives × four institutional adoption signals. The institutional money is moving onchain — on Solana — this quarter.", {
      x: 0.7, y: 1.7, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.creamSoft, margin: 0,
    });
    hr(s, p, 0.7, 2.18, 1.0, C.gold, 1.2);

    // === Top row — WHY SOLANA (3 primitives) ===
    s.addText("WHY SOLANA", {
      x: 0.7, y: 2.42, w: SW - 1.4, h: 0.28,
      fontFace: F.mono, fontSize: 10, color: C.tealSpark, bold: true, charSpacing: 5, margin: 0,
    });
    const prims = [
      { icon: ICO.tagT,    h: "cNFT (Bubblegum)",  big: "$0.0005", lbl: "per mint",          sub: "Luxury class scales globally" },
      { icon: ICO.shieldT, h: "Native SAS",        big: "1×",      lbl: "KYC, infinite reads",sub: "Reusable across the Solana RWA stack" },
      { icon: ICO.layersT, h: "Composability",     big: "Anchor",  lbl: "CPI",               sub: "We originate. Kamino · Loopscale run lending markets." },
    ];
    const pY = 2.78, pH = 2.3;
    const pW = (SW - 1.4 - 0.4) / 3;
    prims.forEach((c, i) => {
      const cx = 0.7 + i * (pW + 0.2);
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: pY, w: pW, h: pH,
        fill: { color: C.inkSoft }, line: { color: C.lineDark, width: 0.75 },
      });
      s.addImage({ data: c.icon, x: cx + 0.3, y: pY + 0.3, w: 0.4, h: 0.4 });
      s.addText(c.h, {
        x: cx + 0.85, y: pY + 0.28, w: pW - 1.0, h: 0.45,
        fontFace: F.mono, fontSize: 11, color: C.creamSoft, bold: true, valign: "middle", margin: 0, charSpacing: 3,
      });
      // big number
      s.addText(c.big, {
        x: cx + 0.3, y: pY + 0.85, w: pW - 0.6, h: 0.55,
        fontFace: F.serif, fontSize: 30, bold: true, color: C.gold, margin: 0,
      });
      s.addText(c.lbl, {
        x: cx + 0.3, y: pY + 1.4, w: pW - 0.6, h: 0.3,
        fontFace: F.mono, fontSize: 10, color: C.creamSoft, italic: true, margin: 0,
      });
      // hairline
      hr(s, p, cx + 0.3, pY + 1.78, pW - 0.6, C.lineDark, 0.5);
      s.addText(c.sub, {
        x: cx + 0.3, y: pY + 1.85, w: pW - 0.6, h: 0.4,
        fontFace: F.sans, fontSize: 10.5, color: C.cream, margin: 0, lineSpacing: 14,
      });
    });

    // === Bottom row — WHY NOW (4 institutional signals) ===
    s.addText("WHY NOW  ·  INSTITUTIONAL ADOPTION", {
      x: 0.7, y: 5.25, w: SW - 1.4, h: 0.28,
      fontFace: F.mono, fontSize: 10, color: C.tealSpark, bold: true, charSpacing: 5, margin: 0,
    });
    const sigs = [
      { lbl: "RWA TVL ON SOLANA",     big: "$1.82B",  sub: "Mar 2026  ·  +90% MoM growth" },
      { lbl: "WESTERN UNION USDPT",   big: "Live",    sub: "Launched May 2026 via Anchorage" },
      { lbl: "PAYMENTS GIANTS",       big: "VS·SP·PP·FI", sub: "Visa · Stripe · PayPal · Fiserv" },
      { lbl: "TOKENIZED FUNDS",       big: "$2.3B+",  sub: "BlackRock BUIDL · Franklin FOBXX" },
    ];
    const sY = 5.55, sH = 1.3;
    const sW2 = (SW - 1.4 - 0.45) / 4;
    sigs.forEach((c, i) => {
      const cx = 0.7 + i * (sW2 + 0.15);
      // top-tick + label
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: sY, w: 0.18, h: 0.025,
        fill: { color: C.gold }, line: { color: C.gold, width: 0 },
      });
      s.addText(c.lbl, {
        x: cx, y: sY + 0.05, w: sW2, h: 0.3,
        fontFace: F.mono, fontSize: 9, color: C.gold, bold: true, charSpacing: 3, margin: 0,
      });
      s.addText(c.big, {
        x: cx, y: sY + 0.4, w: sW2, h: 0.65,
        fontFace: F.serif, fontSize: 26, bold: true, color: C.cream, margin: 0,
      });
      s.addText(c.sub, {
        x: cx, y: sY + sH - 0.45, w: sW2, h: 0.4,
        fontFace: F.sans, fontSize: 10.5, color: C.creamSoft, margin: 0, lineSpacing: 14,
      });
    });

    // Bottom callout
    hr(s, p, 0.7, 6.95, SW - 1.4, C.lineDark, 0.5);
    s.addText([
      { text: "→  ", options: { color: C.tealSpark } },
      { text: "Sumsub × Solana SAS integration (May 2025) gave us reusable KYC. None of this stack existed 18 months ago.", options: { color: C.cream } },
    ], {
      x: 0.7, y: 7.05, w: SW - 1.4, h: 0.35,
      fontFace: F.serif, fontSize: 13, italic: true, margin: 0,
    });
  }

  // ============================================================
  // SLIDE 4 — THE ATOMIC INVARIANT (light)
  // 5-step custody-gated flow — script's killer line
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "04  /  THE ATOMIC INVARIANT", C.tealDeep);
    pageNum(s, p, 4, TOTAL, C.mute, C.lineLight);

    s.addText([
      { text: "No custody signature. ", options: { color: C.ink2 } },
      { text: "No USDC.", options: { color: C.tealDeep } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 38, bold: true, margin: 0,
    });
    s.addText("Atomic. Onchain. The licensed-custodian signature is the release trigger — enforced in a single Solana transaction.", {
      x: 0.7, y: 1.75, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.22, 1.0, C.gold, 1.2);

    // 5 gates
    const gates = [
      { num: "G1", title: "Appraisal",      icon: ICO.searchD,  body: "independent valuation\n3-source median" },
      { num: "G2", title: "Custody",        icon: ICO.safeD,    body: "Sekuro · Brinks-class\nlicensed custodian vaults the asset" },
      { num: "G3", title: "cNFT mint",      icon: null, hex: "cNFT", body: "Bubblegum · onchain\ncollateral record" },
      { num: "G4", title: "Borrow",         icon: ICO.dollarD,  body: "USDC disburses\natomically · same tx" },
      { num: "G5", title: "Repay / default",icon: ICO.scaleD,   body: "auto-release  ·  or\n14-day Dutch auction" },
    ];
    const gY = 2.5, gH = 3.1;
    const totalW = SW - 1.4;
    const aW = 0.4;
    const gW = (totalW - 4 * aW) / 5;
    gates.forEach((g, i) => {
      const gx = 0.7 + i * (gW + aW);
      s.addShape(p.shapes.RECTANGLE, {
        x: gx, y: gY, w: gW, h: gH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      // gate marker
      s.addText(g.num, {
        x: gx, y: gY + 0.25, w: gW, h: 0.3,
        fontFace: F.mono, fontSize: 11, color: C.tealDeep, bold: true, charSpacing: 3, align: "center", margin: 0,
      });
      hr(s, p, gx + gW/2 - 0.18, gY + 0.55, 0.36, C.tealDeep, 1);
      s.addText(g.title, {
        x: gx, y: gY + 0.62, w: gW, h: 0.4,
        fontFace: F.serif, fontSize: 16, bold: true, color: C.ink2, align: "center", margin: 0,
      });
      // icon area
      if (g.icon) {
        s.addImage({ data: g.icon, x: gx + gW/2 - 0.45, y: gY + 1.15, w: 0.9, h: 0.9 });
      } else if (g.hex) {
        s.addShape(p.shapes.HEXAGON, {
          x: gx + gW/2 - 0.55, y: gY + 1.15, w: 1.1, h: 0.95,
          fill: { color: C.paperCard }, line: { color: C.tealDeep, width: 1.4 },
        });
        s.addText(g.hex, {
          x: gx + gW/2 - 0.55, y: gY + 1.15, w: 1.1, h: 0.95,
          fontFace: F.mono, fontSize: 13, color: C.tealDeep, bold: true,
          align: "center", valign: "middle", margin: 0,
        });
      }
      hr(s, p, gx + 0.2, gY + 2.3, gW - 0.4, C.lineLight, 0.5);
      s.addText(g.body, {
        x: gx + 0.15, y: gY + 2.4, w: gW - 0.3, h: 0.7,
        fontFace: F.sans, fontSize: 11, color: C.mute, align: "center", margin: 0, lineSpacing: 16,
      });

      // arrow between
      if (i < gates.length - 1) {
        s.addText("→", {
          x: gx + gW, y: gY + gH/2 - 0.25, w: aW, h: 0.5,
          fontSize: 20, color: C.tealDeep, fontFace: F.sans, align: "center", valign: "middle", margin: 0,
        });
      }
    });

    // Invariant strip — FULL DARK BAR
    const iY = 5.85, iH = 0.95;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: iY, w: SW - 1.4, h: iH,
      fill: { color: C.ink }, line: { color: C.ink, width: 0 },
    });
    // tick on left
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: iY, w: 0.08, h: iH,
      fill: { color: C.tealSpark }, line: { color: C.tealSpark, width: 0 },
    });
    s.addText("THE ATOMIC INVARIANT", {
      x: 1.05, y: iY + 0.12, w: 6.0, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.tealSpark, bold: true, charSpacing: 5, margin: 0,
    });
    s.addText("No USDC disburses until the licensed custodian's keypair signs custody-confirmation — atomically, in the same transaction.", {
      x: 1.05, y: iY + 0.35, w: SW - 2.4, h: 0.55,
      fontFace: F.serif, fontSize: 16, color: C.cream, margin: 0, italic: true, lineSpacing: 22,
    });

    // Bottom note
    s.addText([
      { text: "→  ", options: { color: C.tealDeep } },
      { text: "No competitor in physical-collateral lending has shipped this on-chain — Aave, Maple, Centrifuge, none.", options: { color: C.ink2 } },
    ], {
      x: 0.7, y: 7.05, w: SW - 1.4, h: 0.35,
      fontFace: F.mono, fontSize: 11, margin: 0,
    });
  }

  // ============================================================
  // SLIDE 5 — MODULAR ARCHITECTURE (light)
  // 8 of 10 modules global · 2 swap per market
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "05  /  MODULAR ARCHITECTURE", C.tealDeep);
    pageNum(s, p, 5, TOTAL, C.mute, C.lineLight);

    s.addText([
      { text: "Eight of ten modules ship ", options: { color: C.ink2 } },
      { text: "globally", options: { color: C.tealDeep } },
      { text: ".", options: { color: C.ink2 } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 36, bold: true, margin: 0,
    });
    s.addText("The credit core ships once. Only offline appraisal and licensed custodian swap per market — 60-to-90-day market entry.", {
      x: 0.7, y: 1.75, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.22, 1.0, C.gold, 1.2);

    // 5-step pipeline (the user-facing flow)
    const steps = [
      { num: "01", icon: ICO.userChkD, title: "Borrower\nonboarding", body: "Crossmint  ·  Sumsub KYC\nnative SAS attestation" },
      { num: "02", icon: ICO.clipD,    title: "Appraisal",            body: "Vaultik · Chrono24\n3-source median" },
      { num: "03", icon: ICO.safeD,    title: "Licensed\ncustody",    body: "Sekuro · Brinks-class\nLloyd's insurance" },
      { num: "04", icon: ICO.linkD,    title: "Onchain\nproof",       body: "Bubblegum cNFT  ·\nPyth + RedStone oracle" },
      { num: "05", icon: ICO.syncD,    title: "Borrow / repay /\nrelease", body: "Kamino V2 · Loopscale\nVaulx Trust noteholder" },
    ];
    const sY = 2.5, sH = 2.85;
    const totalW = SW - 1.4;
    const arrowW = 0.4;
    const stepW = (totalW - 4 * arrowW) / 5;
    steps.forEach((st, i) => {
      const sx = 0.7 + i * (stepW + arrowW);
      s.addShape(p.shapes.RECTANGLE, {
        x: sx, y: sY, w: stepW, h: sH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      s.addText(st.num, {
        x: sx + 0.2, y: sY + 0.18, w: 0.6, h: 0.3,
        fontFace: F.mono, fontSize: 11, color: C.tealDeep, bold: true, charSpacing: 2, margin: 0,
      });
      s.addImage({ data: st.icon, x: sx + stepW/2 - 0.4, y: sY + 0.55, w: 0.8, h: 0.8 });
      hr(s, p, sx + 0.25, sY + 1.5, stepW - 0.5, C.lineLight, 0.5);
      s.addText(st.title, {
        x: sx, y: sY + 1.6, w: stepW, h: 0.7,
        fontFace: F.serif, fontSize: 15, bold: true, color: C.ink2, align: "center", margin: 0, lineSpacing: 19,
      });
      s.addText(st.body, {
        x: sx + 0.1, y: sY + 2.25, w: stepW - 0.2, h: 0.5,
        fontFace: F.mono, fontSize: 9.5, color: C.mute, align: "center", margin: 0, lineSpacing: 13,
      });
      if (i < steps.length - 1) {
        s.addText("→", {
          x: sx + stepW, y: sY + sH/2 - 0.25, w: arrowW, h: 0.5,
          fontSize: 20, color: C.tealDeep, fontFace: F.sans, align: "center", valign: "middle", margin: 0,
        });
      }
    });

    // Bottom 2-col panel: GLOBAL CORE / LOCAL ADAPTERS
    const bY = 5.6, bH = 1.5;
    const halfW = (SW - 1.4 - 0.25) / 2;
    [
      { x: 0.7, icon: ICO.globeD, mark: "8 OF 10",  title: "Global core",     body: "Solana programs · cNFT logic · Sumsub KYC\nLloyd's insurance · oracles · Vaulx Trust\nonline appraisal · curated lending rails" },
      { x: 0.7 + halfW + 0.25, icon: ICO.bankD, mark: "2 OF 10",  title: "Local adapters",  body: "offline appraisal · licensed custodian\nswap per market in 60–90 days" },
    ].forEach((b, i) => {
      s.addShape(p.shapes.RECTANGLE, {
        x: b.x, y: bY, w: halfW, h: bH,
        fill: { color: C.paperCard }, line: { color: i === 0 ? C.tealDeep : C.lineLight, width: i === 0 ? 1.2 : 0.75 },
      });
      s.addText(b.mark, {
        x: b.x + 0.3, y: bY + 0.2, w: 1.2, h: 0.3,
        fontFace: F.mono, fontSize: 10, color: C.gold, bold: true, charSpacing: 4, margin: 0,
      });
      s.addImage({ data: b.icon, x: b.x + 0.3, y: bY + 0.6, w: 0.5, h: 0.5 });
      s.addText(b.title, {
        x: b.x + 1.0, y: bY + 0.5, w: halfW - 1.1, h: 0.45,
        fontFace: F.serif, fontSize: 22, bold: true, color: C.ink2, valign: "middle", margin: 0,
      });
      s.addText(b.body, {
        x: b.x + 1.0, y: bY + 0.95, w: halfW - 1.1, h: 0.5,
        fontFace: F.mono, fontSize: 9.5, color: C.mute, valign: "top", margin: 0, lineSpacing: 13,
      });
    });
  }

  // ============================================================
  // SLIDE 6 — CYCLE ECONOMICS (light)
  // Comparison table + 3-bucket cost
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "06  /  CYCLE ECONOMICS", C.tealDeep);
    pageNum(s, p, 6, TOTAL, C.mute, C.lineLight);

    s.addText("Cheaper than Brazil's cheapest formal credit. 2.5× more capital per asset.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 30, color: C.ink2, margin: 0,
    });
    s.addText("Side-by-side on a $14k Rolex Submariner, 12-month interest cost. Vaulx wins on rate AND on usable capital.", {
      x: 0.7, y: 1.75, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.22, 1.0, C.gold, 1.2);

    // Comparison table
    const head = ["Option", "APR", "LTV", "$ borrowable on $14k Rolex", "12-mo interest"];
    const rows = [
      ["Credit-card rotativo", "~450%", "n/a", "n/a", "massive"],
      ["Consumer loan",        "~61%",  "n/a", "n/a", "~$3,050 on $5k"],
      ["Caixa penhor",         "~30%",  "20% (scrap-metal)", "~$2,800", "~$840 on $2,800"],
    ];
    const vRow = ["VAULX (2% / month)", "24%", "50% (full asset value)", "$7,000", "~$1,680 on $7,000"];

    const td = [];
    td.push(head.map((h, i) => ({
      text: h,
      options: {
        color: C.tealDeep, bold: true, fontFace: F.mono, fontSize: 11,
        align: i === 0 ? "left" : "center", valign: "middle",
        fill: { color: C.paper }, margin: [0.1, 0.18, 0.1, 0.18],
        charSpacing: 3,
      },
    })));
    rows.forEach(row => {
      td.push(row.map((cell, i) => ({
        text: cell,
        options: {
          color: i === 1 && (cell === "~450%" || cell === "~61%") ? C.warn : (i === 0 ? C.ink2 : C.mute),
          bold: i === 0,
          fontFace: i === 0 ? F.serif : F.mono,
          fontSize: 12,
          align: i === 0 ? "left" : "center", valign: "middle",
          fill: { color: C.paper },
          margin: [0.08, 0.18, 0.08, 0.18],
        },
      })));
    });
    // Override VAULX last cell label (was: "~$1,680 on $7,000" wrapping)
    vRow[0] = "VAULX";
    vRow[4] = "~$1,680 / yr";
    td.push(vRow.map((cell, i) => ({
      text: cell,
      options: {
        color: C.cream, bold: i === 0, fontFace: i === 0 ? F.serif : F.mono,
        fontSize: 13, align: i === 0 ? "left" : "center", valign: "middle",
        fill: { color: C.tealDeep }, margin: [0.08, 0.18, 0.08, 0.18],
      },
    })));

    s.addTable(td, {
      x: 0.7, y: 2.5, w: SW - 1.4,
      colW: [2.7, 1.4, 2.7, 2.7, (SW - 1.4) - 2.7 - 1.4 - 2.7 - 2.7],
      rowH: 0.5,
      border: { type: "solid", pt: 0.5, color: C.lineLight },
    });

    // Three takeaways below table (left side)
    const tY = 5.05;
    s.addText([
      { text: "→  ", options: { color: C.tealDeep, bold: true } },
      { text: "Cheaper rate ", options: { color: C.ink2, bold: true } },
      { text: "than even Caixa penhor (24% vs 30%)", options: { color: C.mute } },
    ], {
      x: 0.7, y: tY, w: 7.0, h: 0.4,
      fontFace: F.serif, fontSize: 14, margin: 0,
    });
    s.addText([
      { text: "→  ", options: { color: C.tealDeep, bold: true } },
      { text: "2.5× more capital ", options: { color: C.ink2, bold: true } },
      { text: "per asset (50% LTV vs 20% scrap-metal LTV)", options: { color: C.mute } },
    ], {
      x: 0.7, y: tY + 0.45, w: 7.0, h: 0.4,
      fontFace: F.serif, fontSize: 14, margin: 0,
    });
    s.addText([
      { text: "→  ", options: { color: C.tealDeep, bold: true } },
      { text: "LP nets ~5% APR ", options: { color: C.ink2, bold: true } },
      { text: "(collateralized + insured)  ·  Vaulx earns $300–600 / asset / yr", options: { color: C.mute } },
    ], {
      x: 0.7, y: tY + 0.9, w: 7.0, h: 0.4,
      fontFace: F.serif, fontSize: 14, margin: 0,
    });
    // Reference math footnote
    s.addText("Reconciliation: 24% borrower all-in = 8% capital + 12% operations + 4% risk.", {
      x: 0.7, y: tY + 1.5, w: 7.0, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.mute, italic: true, margin: 0,
    });

    // 3-bucket cost panel — wider, includes economics summary at bottom
    const bX = 8.0, bY = 5.0, bW = SW - 0.7 - bX, bH = 2.1;
    s.addShape(p.shapes.RECTANGLE, {
      x: bX, y: bY, w: bW, h: bH,
      fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
    });
    s.addText("3-BUCKET COST OF CREDIT", {
      x: bX + 0.25, y: bY + 0.12, w: bW - 0.5, h: 0.3,
      fontFace: F.mono, fontSize: 9.5, color: C.tealDeep, bold: true, charSpacing: 4, margin: 0,
    });
    const buckets = [
      { name: "Cost of capital",     apr: "8%" },
      { name: "Cost of operations",  apr: "12%" },
      { name: "Cost of risk",        apr: "4%" },
    ];
    buckets.forEach((b, i) => {
      const by = bY + 0.5 + i * 0.3;
      s.addText(b.name, {
        x: bX + 0.25, y: by, w: bW - 0.5, h: 0.28,
        fontFace: F.serif, fontSize: 12, color: C.ink2, valign: "middle", margin: 0,
      });
      s.addText(b.apr, {
        x: bX + bW - 1.0, y: by, w: 0.7, h: 0.28,
        fontFace: F.mono, fontSize: 13, color: C.tealDeep, bold: true, align: "right", valign: "middle", margin: 0,
      });
    });
    hr(s, p, bX + 0.25, bY + 1.42, bW - 0.5, C.lineLight, 0.5);
    s.addText("BORROWER ALL-IN", {
      x: bX + 0.25, y: bY + 1.5, w: bW - 1.0, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.gold, bold: true, charSpacing: 4, valign: "middle", margin: 0,
    });
    s.addText("24%", {
      x: bX + bW - 1.2, y: bY + 1.45, w: 0.9, h: 0.35,
      fontFace: F.serif, fontSize: 22, color: C.gold, bold: true, align: "right", valign: "middle", margin: 0,
    });
    hr(s, p, bX + 0.25, bY + 1.85, bW - 0.5, C.lineLight, 0.5);
  }

  // ============================================================
  // SLIDE 7 — TEAM (light)
  // 5 founders w/ corrected Marcelo bio (Gitel = electronic security)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "07  /  TEAM", C.tealDeep);
    pageNum(s, p, 7, TOTAL, C.mute, C.lineLight);

    s.addText("Operators, builders, and market access.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.75,
      fontFace: F.serif, fontSize: 32, bold: true, color: C.ink2, margin: 0,
    });
    s.addText("Banking. Operational execution. Electronic-security infrastructure. Solana engineering. Live DeFi distribution.", {
      x: 0.7, y: 1.65, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.12, 1.0, C.gold, 1.2);

    const team = [
      { icon: ICO.shieldChkD, name: "George Dimitrov", role: "CEO / CTO",                body: "Global banking · corporate execution · regulatory affairs.\nDrives institutional partnerships on-chain and off-chain." },
      { icon: ICO.cctv,       name: "Marcelo",         role: "COO  ·  Gitel founder",    body: "38 years building Brazilian electronic-security infra:\nCCTV · IoT · access control · NOC. The exact stack behind Vaulx's atomic custody invariant." },
      { icon: ICO.handD,      name: "Rodrigo",         role: "Partnerships & BD",        body: "Proven BD across Brazil and LATAM. Owns Mercado\nBitcoin and other BR partnerships with Marcelo." },
      { icon: ICO.codeD,      name: "Edson",           role: "Senior Solana Engineer",   body: "All on-chain and protocol-level engineering.\nShipped 4 Anchor programs across Phase 1–3." },
      { icon: ICO.shareD,     name: "Felipe",          role: "DeFi & Community Advisor", body: "Founder of 4p.finance. Strong DeFi ties\nUS / Brazil. Advises on partnerships and community." },
    ];
    const tY = 2.4, tH = 3.4;
    const tW = (SW - 1.4 - 4 * 0.18) / 5;
    team.forEach((m, i) => {
      const tx = 0.7 + i * (tW + 0.18);
      s.addShape(p.shapes.RECTANGLE, {
        x: tx, y: tY, w: tW, h: tH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      // gold tick top-left
      s.addShape(p.shapes.RECTANGLE, {
        x: tx, y: tY, w: 0.08, h: 0.45,
        fill: { color: C.gold }, line: { color: C.gold, width: 0 },
      });
      // circle
      s.addShape(p.shapes.OVAL, {
        x: tx + tW/2 - 0.45, y: tY + 0.4, w: 0.9, h: 0.9,
        fill: { color: C.paper }, line: { color: C.lineLight, width: 0.75 },
      });
      s.addImage({ data: m.icon, x: tx + tW/2 - 0.28, y: tY + 0.57, w: 0.56, h: 0.56 });
      s.addText(m.name, {
        x: tx + 0.18, y: tY + 1.45, w: tW - 0.36, h: 0.4,
        fontFace: F.serif, fontSize: 16, bold: true, color: C.ink2, align: "left", margin: 0,
      });
      s.addText(m.role, {
        x: tx + 0.18, y: tY + 1.83, w: tW - 0.36, h: 0.32,
        fontFace: F.mono, fontSize: 10, color: C.tealDeep, bold: true, charSpacing: 3, margin: 0,
      });
      hr(s, p, tx + 0.18, tY + 2.2, tW - 0.36, C.lineLight, 0.5);
      s.addText(m.body, {
        x: tx + 0.18, y: tY + 2.28, w: tW - 0.36, h: 1.0,
        fontFace: F.sans, fontSize: 10, color: C.mute, margin: 0, lineSpacing: 13,
      });
    });

    // Bottom validator strip
    const vY = 6.0, vH = 0.5;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: vY, w: SW - 1.4, h: vH,
      fill: { color: C.paperCard }, line: { color: C.tealDeep, width: 1.0 },
    });
    s.addText([
      { text: "NO COMPETITOR CAN ASSEMBLE THIS TEAM.   ", options: { color: C.tealDeep, bold: true, charSpacing: 4 } },
      { text: "Active commercial conversations with appraisers, custodians, curators.", options: { color: C.mute, italic: true } },
    ], {
      x: 0.7, y: vY, w: SW - 1.4, h: vH,
      fontFace: F.mono, fontSize: 11, valign: "middle", align: "center", margin: 0,
    });

    // skill tag bar — placed BELOW validator with proper gap
    const tagY = 6.65, tagH = 0.45;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: tagY, w: SW - 1.4, h: tagH,
      fill: { color: C.ink }, line: { color: C.ink, width: 0 },
    });
    s.addText("BANKING   ·   ELECTRONIC SECURITY   ·   BD   ·   SOLANA   ·   DEFI", {
      x: 0.7, y: tagY, w: SW - 1.4, h: tagH,
      fontFace: F.mono, fontSize: 11, color: C.cream, bold: true, charSpacing: 6,
      align: "center", valign: "middle", margin: 0,
    });
  }

  // ============================================================
  // SLIDE 8 — BUILT · ASK · 90-DAY (dark)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    eyebrow(s, p, 0.7, 0.5, 6.0, "08  /  BUILT  ·  ASK  ·  ROADMAP", C.tealSpark);
    pageNum(s, p, 8, TOTAL, C.muteDark, C.lineDark);

    s.addText([
      { text: "Built ", options: { color: C.cream } },
      { text: "today", options: { color: C.tealSpark } },
      { text: ". Clear ", options: { color: C.cream } },
      { text: "ask", options: { color: C.gold } },
      { text: ". Mainnet ", options: { color: C.cream } },
      { text: "in 90 days", options: { color: C.tealSpark } },
      { text: ".", options: { color: C.cream } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, bold: true, margin: 0,
    });
    hr(s, p, 0.7, 1.85, 1.0, C.gold, 1.2);

    // 3 columns
    const colY = 2.05, colH = 4.3, gap = 0.25;
    const colW = (SW - 1.4 - 2 * gap) / 3;

    // === COL 1 — Built today ===
    const b1X = 0.7;
    s.addShape(p.shapes.RECTANGLE, {
      x: b1X, y: colY, w: colW, h: colH,
      fill: { color: C.inkSoft }, line: { color: C.lineDark, width: 0.75 },
    });
    s.addText("BUILT  ·  LIVE TODAY", {
      x: b1X + 0.3, y: colY + 0.25, w: colW - 0.6, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.tealSpark, bold: true, charSpacing: 4, margin: 0,
    });
    s.addText("Devnet.", {
      x: b1X + 0.3, y: colY + 0.55, w: colW - 0.6, h: 0.55,
      fontFace: F.serif, fontSize: 28, bold: true, color: C.cream, margin: 0,
    });
    hr(s, p, b1X + 0.3, colY + 1.18, 0.6, C.tealSpark, 1.2);
    const built = [
      ["4",   "Anchor programs",   "vault · loan · trdc · auction"],
      ["45+", "tests green",       "Anchor + CI gating"],
      ["1",   "frontend live",     "vaulx.vercel.app · /admin/demo"],
      ["1",   "indexer + bridge",  "Supabase event log"],
    ];
    built.forEach((b, i) => {
      const by = colY + 1.4 + i * 0.6;
      s.addText(b[0], {
        x: b1X + 0.3, y: by, w: 0.7, h: 0.4,
        fontFace: F.serif, fontSize: 22, bold: true, color: C.gold, margin: 0,
      });
      s.addText(b[1], {
        x: b1X + 1.05, y: by, w: colW - 1.15, h: 0.3,
        fontFace: F.serif, fontSize: 13, bold: true, color: C.cream, margin: 0,
      });
      s.addText(b[2], {
        x: b1X + 1.05, y: by + 0.28, w: colW - 1.15, h: 0.3,
        fontFace: F.mono, fontSize: 9, color: C.muteDark, margin: 0,
      });
    });

    // === COL 2 — Our ask (highlighted) ===
    const b2X = b1X + colW + gap;
    s.addShape(p.shapes.RECTANGLE, {
      x: b2X, y: colY, w: colW, h: colH,
      fill: { color: C.inkSoft }, line: { color: C.gold, width: 1.5 },
    });
    // gold tick
    s.addShape(p.shapes.RECTANGLE, {
      x: b2X, y: colY, w: 0.1, h: colH,
      fill: { color: C.gold }, line: { color: C.gold, width: 0 },
    });
    s.addText("OUR ASK  ·  COLOSSEUM PRIZE", {
      x: b2X + 0.3, y: colY + 0.25, w: colW - 0.6, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.gold, bold: true, charSpacing: 4, margin: 0,
    });
    s.addText("$250K", {
      x: b2X, y: colY + 0.55, w: colW, h: 1.2,
      fontFace: F.serif, fontSize: 76, bold: true, color: C.gold, align: "center", margin: 0,
    });
    s.addText("Solana RWA track  ·  pre-seed bridge", {
      x: b2X, y: colY + 1.85, w: colW, h: 0.3,
      fontFace: F.sans, fontSize: 12, color: C.creamSoft, italic: true, align: "center", margin: 0,
    });
    hr(s, p, b2X + 0.4, colY + 2.2, colW - 0.8, C.lineDark, 0.5);

    const askItems = [
      "audit our 4 Anchor programs",
      "close first custodian + appraiser + curator",
      "originate first 50 mainnet loans by Q3",
      "bridge to seed with traction + revenue",
    ];
    askItems.forEach((it, i) => {
      s.addText([
        { text: "→  ", options: { color: C.gold } },
        { text: it, options: { color: C.cream } },
      ], {
        x: b2X + 0.3, y: colY + 2.35 + i * 0.42, w: colW - 0.6, h: 0.36,
        fontFace: F.sans, fontSize: 11.5, valign: "middle", margin: 0, lineSpacing: 14,
      });
    });

    // === COL 3 — 90-day roadmap ===
    const b3X = b2X + colW + gap;
    s.addShape(p.shapes.RECTANGLE, {
      x: b3X, y: colY, w: colW, h: colH,
      fill: { color: C.inkSoft }, line: { color: C.lineDark, width: 0.75 },
    });
    s.addText("ROADMAP  ·  90-DAY PLAN", {
      x: b3X + 0.3, y: colY + 0.25, w: colW - 0.6, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.tealSpark, bold: true, charSpacing: 4, margin: 0,
    });
    s.addText("Mainnet by Day 90.", {
      x: b3X + 0.3, y: colY + 0.55, w: colW - 0.6, h: 0.55,
      fontFace: F.serif, fontSize: 22, bold: true, color: C.cream, margin: 0,
    });
    hr(s, p, b3X + 0.3, colY + 1.15, 0.6, C.tealSpark, 1.2);

    const road = [
      { day: "DAY 0",   what: "audit kickoff",        sub: "external review + bug bounty" },
      { day: "DAY 60",  what: "Sekuro signed",        sub: "Lloyd's binder confirmed" },
      { day: "DAY 90",  what: "mainnet launch",       sub: "first real loan · real watch · real USDC" },
      { day: "Q3 2026", what: "50 customers",         sub: "senior + junior LP cohort" },
      { day: "Q4 2026", what: "100 customers",        sub: "seed close · first LATAM market" },
    ];
    road.forEach((r, i) => {
      const ry = colY + 1.4 + i * 0.55;
      s.addText(r.day, {
        x: b3X + 0.3, y: ry, w: 1.2, h: 0.28,
        fontFace: F.mono, fontSize: 9.5, color: C.gold, bold: true, charSpacing: 3, margin: 0,
      });
      s.addText(r.what, {
        x: b3X + 1.5, y: ry, w: colW - 1.6, h: 0.28,
        fontFace: F.serif, fontSize: 13, bold: true, color: C.cream, margin: 0,
      });
      s.addText(r.sub, {
        x: b3X + 1.5, y: ry + 0.26, w: colW - 1.6, h: 0.28,
        fontFace: F.sans, fontSize: 10, color: C.muteDark, italic: true, margin: 0,
      });
    });

    // Closing line + CTA pill (clear of footer territory)
    const cY = 6.5;
    hr(s, p, 0.7, cY, SW - 1.4, C.lineDark, 0.5);
    s.addText([
      { text: "The rail between physical luxury and onchain capital.   ", options: { color: C.cream } },
      { text: "Built on Solana.", options: { color: C.tealSpark, bold: true } },
    ], {
      x: 0.7, y: cY + 0.15, w: 8.6, h: 0.5,
      fontFace: F.serif, fontSize: 14, italic: true, valign: "middle", margin: 0,
    });

    // CTA pill
    const btnX = SW - 4.0, btnY = cY + 0.12, btnW = 3.3, btnH = 0.5;
    s.addShape(p.shapes.RECTANGLE, {
      x: btnX, y: btnY, w: btnW, h: btnH,
      fill: { color: C.gold }, line: { color: C.gold, width: 0 },
    });
    s.addText([
      { text: "Come build with us.   ", options: { color: C.ink, bold: true } },
      { text: "→", options: { color: C.ink, bold: true } },
    ], {
      x: btnX, y: btnY, w: btnW, h: btnH,
      fontFace: F.serif, fontSize: 14, italic: true, align: "center", valign: "middle", margin: 0,
    });

    // Mini logo + url at bottom of cover page (closing footer)
    s.addImage({
      path: `${ASSETS}/vaulx_logo_white.png`,
      x: 0.55, y: SH - 0.42, w: 0.5, h: 0.135,
    });
    s.addText("github.com/Vaulxfi  ·  vaulx.vercel.app  ·  Solana Devnet", {
      x: 1.15, y: SH - 0.45, w: 6.0, h: 0.25,
      fontFace: F.mono, fontSize: 9, color: C.muteDark, valign: "middle", margin: 0,
    });
  }

  await p.writeFile({ fileName: OUT });
  console.log("Wrote:", OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
