// Vaulx Pitch v10 — 9-slide editorial rebuild with hero photo + partner logos
// Archetype: Editorial / Magazine. Differentiator: lowercase wordmark + italic accent on ONE keyword per title.
// Rhythm: D D L L L L L L D — dark hooks bookend a light editorial body.

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const fa = require("react-icons/fa");
const fa6 = require("react-icons/fa6");
const md = require("react-icons/md");
const si = require("react-icons/si");

const OUT = "/Users/gogy/MyCODE/VAULX/docs/deck/Vaulx_Pitch_v11.pptx";
const ASSETS = "/Users/gogy/MyCODE/VAULX/.claude/worktrees/recursing-mcnulty-a36d0a/docs/colosseum";
const HTML_ASSETS = "/Users/gogy/Downloads/vaulx_editable_html_deck_v2/assets";
const LOGOS = "/tmp/vaulx_pptx/logo_pngs";

const SW = 13.333, SH = 7.5;

// EDITORIAL PALETTE — locked
const C = {
  ink:        "0A0A0B",
  inkSoft:    "12131A",
  inkLift:    "16171F",
  paper:      "FAFAF7",
  paperCard:  "FFFFFF",
  paperLift:  "F2F0E8",
  cream:      "F5F0E8",
  creamSoft:  "C8C2B2",
  tealDeep:   "0E7C7B",
  tealSpark:  "0E7C7B",   // unified to single teal tone
  tealMint:   "0E7C7B",   // unified to single teal tone
  gold:       "C9A86A",
  goldSoft:   "B89556",
  warn:       "B8412C",
  mute:       "6B6B70",
  muteDark:   "8A8A90",
  lineDark:   "1F1F25",
  lineLight:  "E5E2D8",
  ink2:       "1A1A1D",
};

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
// Layout helpers
// ====================================================================
function hr(s, p, x, y, w, color, weight = 0.5) {
  s.addShape(p.shapes.LINE, { x, y, w, h: 0, line: { color, width: weight } });
}
function vr(s, p, x, y, h, color, weight = 0.5) {
  s.addShape(p.shapes.LINE, { x, y, w: 0, h, line: { color, width: weight } });
}

// editorial eyebrow with leading tick
function eyebrow(s, p, x, y, w, text, color) {
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

function pageNum(s, p, num, total, color) {
  s.addText(`${String(num).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: SW - 1.4, y: 0.3, w: 1.0, h: 0.25,
    fontFace: F.mono, fontSize: 9, color,
    align: "right", charSpacing: 3, valign: "middle", margin: 0,
  });
}

// Title with one italic accent word
function titleWithAccent(s, p, x, y, w, parts, isDark) {
  // parts: array of {text, italic, color}
  const runs = parts.map(pp => ({
    text: pp.text,
    options: {
      color: pp.color || (isDark ? C.cream : C.ink2),
      italic: !!pp.italic,
    }
  }));
  s.addText(runs, {
    x, y, w, h: 1.3,
    fontFace: F.serif, fontSize: 38, bold: false, margin: 0, lineSpacing: 46,
  });
}

// small partner logo clipped to height
function logoOn(s, x, y, h, fileName, w = null) {
  const logoPath = `${LOGOS}/${fileName}`;
  if (!fs.existsSync(logoPath)) return;
  s.addImage({
    path: logoPath,
    x, y, h,
    ...(w ? { w } : { sizing: { type: "contain", w: 1.2, h } }),
  });
}

// ====================================================================
async function main() {
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE";
  p.title = "Vaulx — The on-chain credit protocol";
  p.author = "Vaulx";
  p.company = "Vaulx";
  p.subject = "Colosseum Cypherpunk Hackathon 2026 · Solana RWA";

  // Pre-render functional icons
  const ICO = {
    // dark-slide icons (mint/spark)
    arrowT:   await iconPng(fa.FaArrowRight, "#0E7C7B"),
    checkT:   await iconPng(fa6.FaCircleCheck, "#0E7C7B"),
    diamondG: await iconPng(fa6.FaGem, "#C9A86A"),
    // light-slide icons (deep teal)
    userD:    await iconPng(fa.FaUserCheck, "#0E7C7B"),
    safeD:    await iconPng(md.MdLock, "#0E7C7B"),
    linkD:    await iconPng(fa.FaLink, "#0E7C7B"),
    layersD:  await iconPng(fa.FaLayerGroup, "#0E7C7B"),
    dollarD:  await iconPng(fa.FaDollarSign, "#0E7C7B"),
    shieldD:  await iconPng(fa.FaShieldAlt, "#0E7C7B"),
    handD:    await iconPng(fa.FaHandshake, "#0E7C7B"),
    codeD:    await iconPng(fa.FaCode, "#0E7C7B"),
    cctv:     await iconPng(md.MdVideocam, "#0E7C7B"),
    chartD:   await iconPng(fa.FaChartLine, "#0E7C7B"),
    chartUp:  await iconPng(fa6.FaArrowTrendUp, "#0E7C7B"),
    boltD:    await iconPng(fa.FaBolt, "#0E7C7B"),
    tagD:     await iconPng(fa.FaTag, "#0E7C7B"),
    globeD:   await iconPng(fa.FaGlobe, "#0E7C7B"),
    bankD:    await iconPng(fa.FaUniversity, "#0E7C7B"),
    watchD:   await iconPng(md.MdWatch, "#0E7C7B"),
    scaleD:   await iconPng(fa6.FaScaleBalanced, "#0E7C7B"),
    rocketD:  await iconPng(fa.FaRocket, "#0E7C7B"),
    calD:     await iconPng(fa.FaCalendarAlt, "#0E7C7B"),
    rocketT:  await iconPng(fa.FaRocket, "#0E7C7B"),
    calT:     await iconPng(fa.FaCalendarAlt, "#0E7C7B"),
    shieldT:  await iconPng(fa.FaShieldAlt, "#0E7C7B"),
    codeT:    await iconPng(fa.FaCode, "#0E7C7B"),
    userT:    await iconPng(fa.FaUser, "#0E7C7B"),
    chartT:   await iconPng(fa.FaChartLine, "#0E7C7B"),
  };

  const TOTAL = 10;

  // ============================================================
  // S1 — COVER (DARK) · hero photo right · clean
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    // Hero watch photo — full-bleed right half, with dark gradient overlay (overlay simulated via dark rect on left edge of photo)
    s.addImage({
      path: `${ASSETS}/hero_watch.png`,
      x: 5.8, y: 0, w: 7.6, h: SH,
      sizing: { type: "cover", w: 7.6, h: SH },
    });
    // dark gradient bridge — left edge of photo fades to ink
    s.addShape(p.shapes.RECTANGLE, {
      x: 5.6, y: 0, w: 1.2, h: SH,
      fill: { color: C.ink, transparency: 35 }, line: { color: C.ink, width: 0 },
    });

    // Eyebrow
    eyebrow(s, p, 0.7, 0.55, 6.5, "VAULX  ·  COLOSSEUM CYPHERPUNK 2026", C.tealMint);

    // Lowercase logo (large)
    s.addImage({
      path: `${ASSETS}/vaulx_logo_white.png`,
      x: 0.7, y: 1.15, w: 4.6, h: 1.26,
    });

    // Hairline divider
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: 2.7, w: 1.0, h: 0.03,
      fill: { color: C.cream }, line: { color: C.cream, width: 0 },
    });

    // Serif headline with italic accent
    s.addText([
      { text: "The ", options: { color: C.cream } },
      { text: "rail ", options: { color: C.tealMint, italic: true } },
      { text: "between physical luxury\nand onchain capital.", options: { color: C.cream } },
    ], {
      x: 0.7, y: 2.95, w: 7.4, h: 1.5,
      fontFace: F.serif, fontSize: 32, margin: 0, lineSpacing: 40,
    });

    // Subline with small Solana mark
    if (fs.existsSync(`${LOGOS}/solana-sol.png`)) {
      s.addImage({
        path: `${LOGOS}/solana-sol.png`,
        x: 0.7, y: 4.7, h: 0.28, sizing: { type: "contain", w: 0.28, h: 0.28 },
      });
    }
    s.addText("Built on Solana.  Live on Devnet today.", {
      x: 1.05, y: 4.65, w: 7.0, h: 0.4,
      fontFace: F.sans, fontSize: 14, color: C.creamSoft, italic: false, margin: 0,
    });

    // Mono accent line
    s.addText([
      { text: "Vaulx doesn't take custody.  ", options: { color: C.cream } },
      { text: "Vaulx doesn't hold capital.  ", options: { color: C.cream } },
      { text: "All in smart contracts.", options: { color: C.tealMint, bold: true } },
    ], {
      x: 0.7, y: 5.2, w: 7.4, h: 0.4,
      fontFace: F.mono, fontSize: 11, charSpacing: 1, margin: 0,
    });

    // Bottom hairline + link strip + page nav
    hr(s, p, 0.7, SH - 0.85, 7.0, C.lineDark, 0.5);
    s.addText([
      { text: "github.com/Vaulxfi", options: { color: C.cream } },
      { text: "   ·   ", options: { color: C.tealMint } },
      { text: "vaulx.fi", options: { color: C.cream } },
      { text: "   ·   ", options: { color: C.tealMint } },
      { text: "Solana Devnet", options: { color: C.cream } },
    ], {
      x: 0.7, y: SH - 0.7, w: 7.0, h: 0.3,
      fontFace: F.mono, fontSize: 11, margin: 0, valign: "middle",
    });

    pageNum(s, p, 1, TOTAL, C.muteDark);
  }

  // ============================================================
  // S2 — ASYMMETRY / PROBLEM (DARK) · rate stack + capital gap
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    eyebrow(s, p, 0.7, 0.5, 6.0, "02  /  THE ASYMMETRY", C.tealMint);
    pageNum(s, p, 2, TOTAL, C.muteDark);

    s.addText([
      { text: "Luxury collateral.  Broken credit ", options: { color: C.cream } },
      { text: "rail", options: { color: C.tealMint, italic: true } },
      { text: ".", options: { color: C.cream } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.95,
      fontFace: F.serif, fontSize: 36, bold: true, margin: 0,
    });
    s.addText("Asset-rich borrowers face punitive credit. Onchain capital earns single digits. The missing piece is the rail.", {
      x: 0.7, y: 1.85, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.creamSoft, margin: 0,
    });
    hr(s, p, 0.7, 2.32, 1.0, C.gold, 1.2);

    // === LEFT — Demand side ===
    const lX = 0.7, lW = 6.4;
    s.addText("DEMAND SIDE", {
      x: lX, y: 2.55, w: lW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.creamSoft, bold: true, charSpacing: 4, margin: 0,
    });

    // Rate stack rows (4 tiers with bars)
    const ladder = [
      { tier: "PENALTY",  product: "Credit-card rotativo", note: "revolving balance · 50M Brazilians", rate: "~450%", color: C.warn,    width: 1.0 },
      { tier: "STANDARD", product: "Consumer loan",        note: "general bank lending rate",         rate: "~61%",  color: C.warn,    width: 0.27 },
      { tier: "CHEAPEST", product: "Caixa penhor",         note: "20% LTV · scrap-metal value",       rate: "~30%",  color: C.creamSoft, width: 0.13 },
      { tier: "VAULX",    product: "Vaulx",                note: "50% LTV · full asset value",        rate: "24%",   color: C.tealMint,width: 0.105 },
    ];
    const rowY0 = 2.95, rowH = 0.62, rowGap = 0.08;
    ladder.forEach((r, i) => {
      const ry = rowY0 + i * (rowH + rowGap);
      s.addText(r.tier, {
        x: lX, y: ry + 0.05, w: 1.0, h: 0.25,
        fontFace: F.mono, fontSize: 9, color: r.color, bold: true,
        charSpacing: 3, valign: "middle", margin: 0,
      });
      s.addText(r.product, {
        x: lX, y: ry + 0.28, w: 2.4, h: 0.3,
        fontFace: F.serif, fontSize: 14, color: C.cream, valign: "middle", margin: 0,
      });
      s.addText(r.note, {
        x: lX + 2.4, y: ry + 0.32, w: 4.0, h: 0.25,
        fontFace: F.sans, fontSize: 10, color: C.muteDark, italic: true, margin: 0,
      });
      // bar — full width track
      const barX = lX, barMaxW = lW - 0.9;
      s.addShape(p.shapes.RECTANGLE, {
        x: barX, y: ry + rowH - 0.04, w: barMaxW, h: 0.03,
        fill: { color: C.lineDark }, line: { color: C.lineDark, width: 0 },
      });
      s.addShape(p.shapes.RECTANGLE, {
        x: barX, y: ry + rowH - 0.07, w: barMaxW * r.width, h: 0.09,
        fill: { color: r.color }, line: { color: r.color, width: 0 },
      });
      // rate label right
      s.addText(r.rate, {
        x: lX + lW - 0.9, y: ry, w: 0.9, h: rowH,
        fontFace: F.mono, fontSize: 16, color: r.color, bold: true,
        valign: "middle", margin: 0, align: "right",
      });
    });

    // Footnote
    s.addText("Sources: Banco Central do Brasil  ·  Caixa Federal published rates  ·  rotativo = balance carried past 30-day grace.", {
      x: lX, y: 5.95, w: lW, h: 0.3,
      fontFace: F.mono, fontSize: 8.5, color: C.mute, margin: 0,
    });

    // === RIGHT — Supply side ===
    const rX = 7.7, rW = SW - 0.7 - rX;
    s.addText("SUPPLY SIDE", {
      x: rX, y: 2.55, w: rW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.creamSoft, bold: true, charSpacing: 4, margin: 0,
    });
    // Card
    s.addShape(p.shapes.RECTANGLE, {
      x: rX, y: 2.95, w: rW, h: 3.3,
      fill: { color: C.inkSoft }, line: { color: C.tealDeep, width: 0.75 },
    });
    s.addText("ONCHAIN USDC YIELD", {
      x: rX, y: 3.1, w: rW, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.tealMint, bold: true,
      charSpacing: 5, align: "center", margin: 0,
    });
    s.addText("8–10%", {
      x: rX, y: 3.5, w: rW, h: 1.3,
      fontFace: F.serif, fontSize: 76, bold: true, color: C.cream,
      align: "center", margin: 0,
    });
    s.addText("APR  ·  cheap  ·  patient  ·  global", {
      x: rX, y: 4.85, w: rW, h: 0.3,
      fontFace: F.sans, fontSize: 11, color: C.creamSoft, italic: true, align: "center", margin: 0,
    });
    hr(s, p, rX + 0.4, 5.25, rW - 0.8, C.lineDark, 0.5);
    s.addText("capital available  ·  rail missing", {
      x: rX, y: 5.4, w: rW, h: 0.3,
      fontFace: F.mono, fontSize: 11, color: C.tealMint, italic: true, align: "center", margin: 0,
    });
    s.addText("BTC / ETH-as-collateral exists.  Not the use case.", {
      x: rX, y: 5.8, w: rW, h: 0.3,
      fontFace: F.mono, fontSize: 8.5, color: C.mute, italic: true, align: "center", margin: 0,
    });

    // Bottom strip — gap framing
    hr(s, p, 0.7, 6.55, SW - 1.4, C.cream, 0.75);
    s.addText([
      { text: "→  ", options: { color: C.tealMint } },
      { text: "The gap is not capital.   ", options: { color: C.cream, bold: true } },
      { text: "→  ", options: { color: C.tealMint } },
      { text: "The gap is the ", options: { color: C.cream, bold: true } },
      { text: "rail.", options: { color: C.tealMint, italic: true, bold: true } },
    ], {
      x: 0.7, y: 6.7, w: SW - 1.4, h: 0.55,
      fontFace: F.serif, fontSize: 18, margin: 0, valign: "middle",
    });
  }

  // ============================================================
  // S3 — ATOMIC RAIL / SOLUTION (LIGHT) · 5 gates with partner logos
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "03  /  THE ATOMIC RAIL", C.tealDeep);
    pageNum(s, p, 3, TOTAL, C.mute);

    s.addText([
      { text: "One atomic ", options: { color: C.ink2 } },
      { text: "rail ", options: { color: C.tealDeep, italic: true } },
      { text: "from vault to USDC.", options: { color: C.ink2 } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.95,
      fontFace: F.serif, fontSize: 34, bold: true, margin: 0,
    });
    s.addText("Borrower demand, licensed custody, onchain proof, and Solana liquidity — stitched into one transaction-safe system.", {
      x: 0.7, y: 1.8, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.27, 1.0, C.gold, 1.2);

    // 5 gates — clean, no per-card logos
    const gates = [
      { num: "01", title: "Borrower\nonboarding", icon: ICO.userD,  body: "social login\nSumsub KYC\nappraisal" },
      { num: "02", title: "Licensed\ncustody",    icon: ICO.safeD,  body: "Sekuro intake\nBrinks-class network\nLloyd's insurance" },
      { num: "03", title: "Onchain\nproof",       icon: ICO.linkD,  body: "Metaplex cNFT\nSAS attestation\nPyth + RedStone" },
      { num: "04", title: "Lending\nrails",       icon: ICO.layersD,body: "vault · loan · auction\nKamino · Loopscale\ncurated USDC liquidity" },
      { num: "05", title: "Outcome",              icon: ICO.dollarD,body: "instant USDC\nor 14-day Dutch\ndefault recovery" },
    ];
    const gY = 2.5, gH = 3.4;
    const totalW = SW - 1.4;
    const aW = 0.35;
    const gW = (totalW - 4 * aW) / 5;
    gates.forEach((g, i) => {
      const gx = 0.7 + i * (gW + aW);
      // card
      s.addShape(p.shapes.RECTANGLE, {
        x: gx, y: gY, w: gW, h: gH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      // gate marker top
      s.addText(g.num, {
        x: gx + 0.18, y: gY + 0.18, w: 0.5, h: 0.3,
        fontFace: F.mono, fontSize: 11, color: C.tealDeep, bold: true, charSpacing: 2, margin: 0,
      });
      // icon
      s.addImage({ data: g.icon, x: gx + gW - 0.7, y: gY + 0.18, w: 0.45, h: 0.45 });
      // title
      s.addText(g.title, {
        x: gx + 0.2, y: gY + 0.75, w: gW - 0.4, h: 0.7,
        fontFace: F.serif, fontSize: 16, bold: true, color: C.ink2, margin: 0, lineSpacing: 20,
      });
      // body — extended to use space previously held by logos
      s.addText(g.body, {
        x: gx + 0.2, y: gY + 1.5, w: gW - 0.4, h: 1.7,
        fontFace: F.mono, fontSize: 11, color: C.mute, margin: 0, lineSpacing: 18,
      });
      // arrow
      if (i < gates.length - 1) {
        s.addText("→", {
          x: gx + gW, y: gY + gH/2 - 0.25, w: aW, h: 0.5,
          fontSize: 18, color: C.tealDeep, fontFace: F.sans, align: "center", valign: "middle", margin: 0,
        });
      }
    });

    // Invariant strip — full dark band with mint accent
    const iY = 6.1, iH = 0.65;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: iY, w: SW - 1.4, h: iH,
      fill: { color: C.ink }, line: { color: C.ink, width: 0 },
    });
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: iY, w: 0.08, h: iH,
      fill: { color: C.tealMint }, line: { color: C.tealMint, width: 0 },
    });
    s.addText([
      { text: "INVARIANT  ·  ", options: { color: C.tealMint, bold: true, charSpacing: 4 } },
      { text: "no USDC is released until the licensed custodian confirms physical custody onchain.", options: { color: C.cream } },
    ], {
      x: 1.0, y: iY, w: SW - 2.0, h: iH,
      fontFace: F.serif, fontSize: 14, italic: true, valign: "middle", margin: 0,
    });

    // 3-stat strip
    const sY = 6.95;
    const stats = [
      { mark: "01", text: "Global modules ship once" },
      { mark: "02", text: "Local modules swap per market" },
      { mark: "03", text: "Vaulx posts 5% first-loss POL on every loan" },
    ];
    const sW = (SW - 1.4) / 3;
    stats.forEach((st, i) => {
      const sx = 0.7 + i * sW;
      s.addText(st.mark, {
        x: sx + 0.1, y: sY, w: 0.5, h: 0.3,
        fontFace: F.mono, fontSize: 10, color: C.tealDeep, bold: true, charSpacing: 3, margin: 0,
      });
      s.addText(st.text, {
        x: sx + 0.6, y: sY, w: sW - 0.7, h: 0.3,
        fontFace: F.sans, fontSize: 11, color: C.ink2, valign: "middle", margin: 0,
      });
    });
  }

  // ============================================================
  // S4 — WHY NOW (LIGHT) · 6-card grid + "the stack finally exists"
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "04  /  WHY NOW", C.tealDeep);
    pageNum(s, p, 4, TOTAL, C.mute);

    s.addText([
      { text: "Why now: the ", options: { color: C.ink2 } },
      { text: "stack ", options: { color: C.tealDeep, italic: true } },
      { text: "finally exists.", options: { color: C.ink2 } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.95,
      fontFace: F.serif, fontSize: 34, bold: true, margin: 0,
    });
    s.addText("Low-cost Solana primitives, reusable compliance rails, and real RWA momentum make this window real.", {
      x: 0.7, y: 1.8, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.27, 1.0, C.gold, 1.2);

    // 6 cards — 2 rows × 3 cols (clean: header + big + tagline only)
    const cards = [
      { icon: ICO.tagD,    h: "cNFT",                big: "$0.0005",   sub: "per mint  ·  scales globally" },
      { icon: ICO.shieldD, h: "SAS",                 big: "1×",        sub: "reusable onchain KYC" },
      { icon: ICO.layersD, h: "Composable lending",  big: "Anchor",    sub: "→ Kamino · Loopscale" },
      { icon: ICO.chartUp, h: "RWA on Solana",       big: ">$1.82B",   sub: "+90% MoM  ·  Mar 2026" },
      { icon: ICO.dollarD, h: "Stablecoin rails",    big: "USDPT",     sub: "Western Union  ·  May 2026" },
      { icon: ICO.bankD,   h: "Tokenized funds",     big: "$2.3B+",    sub: "BlackRock · Franklin · live" },
    ];
    const gridX = 0.7, gridY = 2.5, gx = 0.18, gy = 0.18;
    const cellW = (SW - 1.4 - 2 * gx) / 3, cellH = (SH - 0.7 - gridY - 0.55 - gy) / 2;
    cards.forEach((c, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const cx = gridX + col * (cellW + gx);
      const cy = gridY + row * (cellH + gy);
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: cy, w: cellW, h: cellH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      s.addImage({ data: c.icon, x: cx + 0.3, y: cy + 0.25, w: 0.42, h: 0.42 });
      s.addText(c.h, {
        x: cx + 0.85, y: cy + 0.22, w: cellW - 1.0, h: 0.4,
        fontFace: F.mono, fontSize: 11, color: C.tealDeep, bold: true, valign: "middle", charSpacing: 3, margin: 0,
      });
      hr(s, p, cx + 0.3, cy + 0.78, cellW - 0.6, C.lineLight, 0.5);
      s.addText(c.big, {
        x: cx + 0.3, y: cy + 0.9, w: cellW - 0.6, h: 0.6,
        fontFace: F.serif, fontSize: 28, bold: true, color: C.ink2, margin: 0,
      });
      s.addText(c.sub, {
        x: cx + 0.3, y: cy + cellH - 0.45, w: cellW - 0.6, h: 0.32,
        fontFace: F.sans, fontSize: 11, color: C.ink2, margin: 0, lineSpacing: 14,
      });
    });

    // Bottom mono one-liner
    hr(s, p, 0.7, SH - 0.55, SW - 1.4, C.lineLight, 0.5);
    s.addText([
      { text: "→  ", options: { color: C.tealDeep } },
      { text: "Sumsub × Solana SAS integration (May 2025) gave us reusable KYC.  None of this stack existed 18 months ago.", options: { color: C.ink2, italic: true } },
    ], {
      x: 0.7, y: SH - 0.42, w: SW - 1.4, h: 0.35,
      fontFace: F.serif, fontSize: 13, margin: 0,
    });
  }

  // ============================================================
  // S4b — WHY NOW · v8b DARK EDITORIAL STYLE (alternative)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    eyebrow(s, p, 0.7, 0.5, 6.0, "04b  /  WHY NOW  ·  ALT", C.tealMint);
    s.addText("9b / 10", {
      x: SW - 1.4, y: 0.3, w: 1.0, h: 0.25,
      fontFace: F.mono, fontSize: 9, color: C.muteDark,
      align: "right", charSpacing: 3, valign: "middle", margin: 0,
    });

    // Title with teal period
    s.addText([
      { text: "Why Solana. Why now", options: { color: C.cream } },
      { text: ".", options: { color: C.tealMint } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.95,
      fontFace: F.serif, fontSize: 36, bold: true, margin: 0,
    });
    s.addText("The primitives now exist to make custody-gated physical collateral practical.", {
      x: 0.7, y: 1.85, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.creamSoft, margin: 0,
    });
    hr(s, p, 0.7, 2.32, 1.0, C.tealDeep, 1.2);

    // 6-card grid (2 rows × 3 cols) — v8b style
    const cells = [
      { icon: ICO.tagD,    h: "cNFTs",                big: "cheap collateral records",     sub: "cost-efficient at scale" },
      { icon: ICO.boltD,   h: "Fast settlement",      big: "real-time loan UX",             sub: "custody-gated disbursement in seconds" },
      { icon: ICO.layersD, h: "Composable liquidity", big: "originate here, liquidity there", sub: "open lending rails" },
      { icon: ICO.shieldD, h: "Physical collateral",  big: "asset-backed, not unsecured",   sub: "" },
      { icon: ICO.globeD,  h: "Modular architecture", big: "global core, local partners",   sub: "" },
      { icon: ICO.chartUp, h: "Emerging-market wedge",big: "pain is highest where\nrates are punitive", sub: "" },
    ];
    // Render icons in tealMint for v8b look (will need teal-colored icons)
    // We have tealDeep ones already — we'll re-render in tealMint inline:

    const gridX = 0.7, gridY = 2.55, cellW = (SW - 1.4 - 0.4) / 3, cellH = 1.85, gx = 0.2, gy = 0.18;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const col = i % 3, row = Math.floor(i / 3);
      const cx = gridX + col * (cellW + gx);
      const cy = gridY + row * (cellH + gy);
      // dark card with hairline teal border
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: cy, w: cellW, h: cellH,
        fill: { color: C.inkSoft }, line: { color: C.tealDeep, width: 0.75 },
      });
      // Need a teal-mint version of the icon — render inline
      const teal_icon = await iconPng(
        i === 0 ? fa.FaTag :
        i === 1 ? fa.FaBolt :
        i === 2 ? fa.FaLayerGroup :
        i === 3 ? fa.FaShieldAlt :
        i === 4 ? fa.FaGlobe : fa6.FaArrowTrendUp,
        "#0E7C7B"
      );
      s.addImage({ data: teal_icon, x: cx + 0.25, y: cy + 0.25, w: 0.42, h: 0.42 });
      // italic teal header (centered)
      s.addText(c.h, {
        x: cx + 0.85, y: cy + 0.22, w: cellW - 1.0, h: 0.45,
        fontFace: F.serif, fontSize: 16, color: C.tealMint, italic: true,
        valign: "middle", align: "center", margin: 0,
      });
      // small underline below header
      s.addShape(p.shapes.LINE, {
        x: cx + cellW/2 - 0.25, y: cy + 0.78, w: 0.5, h: 0,
        line: { color: C.tealDeep, width: 1 },
      });
      // big serif cream statement
      s.addText(c.big, {
        x: cx + 0.2, y: cy + 0.85, w: cellW - 0.4, h: 0.7,
        fontFace: F.serif, fontSize: 18, color: C.cream, align: "center",
        valign: "middle", margin: 0, lineSpacing: 22,
      });
      // small sub footer
      if (c.sub) {
        s.addText(c.sub, {
          x: cx + 0.2, y: cy + 1.5, w: cellW - 0.4, h: 0.3,
          fontFace: F.sans, fontSize: 10, color: C.muteDark,
          align: "center", italic: true, margin: 0,
        });
      }
    }

    // Bottom callout band — V letterform | quote
    const bX = 0.7, bY = gridY + 2 * (cellH + gy), bW = SW - 1.4, bH = 0.85;
    s.addShape(p.shapes.RECTANGLE, {
      x: bX, y: bY, w: bW, h: bH,
      fill: { color: C.inkSoft }, line: { color: C.tealDeep, width: 1.0 },
    });
    s.addText("V", {
      x: bX + 0.3, y: bY + 0.1, w: 0.7, h: 0.65,
      fontFace: F.serif, fontSize: 36, bold: true, color: C.tealMint,
      align: "center", valign: "middle", margin: 0,
    });
    s.addShape(p.shapes.LINE, {
      x: bX + 1.1, y: bY + 0.18, w: 0, h: bH - 0.36,
      line: { color: C.tealDeep, width: 1 },
    });
    s.addText([
      { text: "Vaulx is ", options: { color: C.cream } },
      { text: "Solana-native", options: { color: C.tealMint, italic: true } },
      { text: " by design, not a port from another chain.", options: { color: C.cream } },
    ], {
      x: bX + 1.3, y: bY, w: bW - 1.5, h: bH,
      fontFace: F.serif, fontSize: 17, italic: true, valign: "middle", margin: 0,
    });
  }

  // ============================================================
  // S5 — ECONOMICS (LIGHT) · table + per-loan + 3-bucket
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "05  /  CYCLE ECONOMICS", C.tealDeep);
    pageNum(s, p, 6, TOTAL, C.mute);

    s.addText("Cheaper than formal credit. More capital per asset.", {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 30, bold: true, color: C.ink2, margin: 0,
    });
    s.addText("At 24% APR and 50% LTV, Vaulx undercuts the cheapest formal option in Brazil and lends far more per watch.", {
      x: 0.7, y: 1.7, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.18, 1.0, C.gold, 1.2);

    // Comparison table
    const head = ["Option", "APR", "LTV", "$ from $14k Rolex", "12-mo cost"];
    const rows = [
      ["Credit-card rotativo", "~450%", "—",                   "n/a",      "massive"],
      ["Consumer loan",        "~61%",  "—",                   "n/a",      "~$3,050 on $5k"],
      ["Caixa penhor",         "~30%",  "20%",                 "~$2,800",  "~$840"],
    ];
    const vRow = ["VAULX",     "24%",   "50%",                 "$7,000",   "~$1,680"];

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
    td.push(vRow.map((cell, i) => ({
      text: cell,
      options: {
        color: C.cream, bold: i === 0, fontFace: i === 0 ? F.serif : F.mono,
        fontSize: 13, align: i === 0 ? "left" : "center", valign: "middle",
        fill: { color: C.tealDeep }, margin: [0.08, 0.18, 0.08, 0.18],
      },
    })));

    s.addTable(td, {
      x: 0.7, y: 2.45, w: SW - 1.4,
      colW: [3.0, 1.4, 1.6, 3.0, (SW - 1.4) - 3.0 - 1.4 - 1.6 - 3.0],
      rowH: 0.46,
      border: { type: "solid", pt: 0.5, color: C.lineLight },
    });

    // 3 cards below: per-loan / 2.5x / borrower-win
    const cY = 4.85, cH = 1.7, cGap = 0.18;
    const cW = (SW - 1.4 - 2 * cGap) / 3;

    // Card 1 — per loan & 3-bucket
    {
      const cx = 0.7;
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: cY, w: cW, h: cH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      s.addText("PER 3-MO LOAN  ·  $7K BORROWED", {
        x: cx + 0.25, y: cY + 0.15, w: cW - 0.5, h: 0.3,
        fontFace: F.mono, fontSize: 9.5, color: C.tealDeep, bold: true, charSpacing: 3, margin: 0,
      });
      // borrower interest
      s.addText("Interest:", {
        x: cx + 0.25, y: cY + 0.5, w: 1.5, h: 0.25,
        fontFace: F.serif, fontSize: 12, color: C.ink2, valign: "middle", margin: 0,
      });
      s.addText("$420", {
        x: cx + cW - 1.0, y: cY + 0.5, w: 0.7, h: 0.25,
        fontFace: F.mono, fontSize: 13, color: C.ink2, bold: true, align: "right", valign: "middle", margin: 0,
      });
      // 3-bucket allocation
      const bk = [
        { name: "LP yield (8%)",  val: "$140" },
        { name: "Operations (12%)", val: "$210" },
        { name: "Risk margin (4%)", val: "$70" },
      ];
      bk.forEach((b, i) => {
        const by = cY + 0.85 + i * 0.24;
        s.addText("· " + b.name, {
          x: cx + 0.4, y: by, w: cW - 1.4, h: 0.22,
          fontFace: F.sans, fontSize: 10.5, color: C.mute, valign: "middle", margin: 0,
        });
        s.addText(b.val, {
          x: cx + cW - 1.0, y: by, w: 0.7, h: 0.22,
          fontFace: F.mono, fontSize: 10.5, color: C.mute, align: "right", valign: "middle", margin: 0,
        });
      });
    }

    // Card 2 — 2.5× more capital
    {
      const cx = 0.7 + cW + cGap;
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: cY, w: cW, h: cH,
        fill: { color: C.tealDeep }, line: { color: C.tealDeep, width: 0 },
      });
      s.addText("CAPITAL EFFICIENCY", {
        x: cx, y: cY + 0.15, w: cW, h: 0.3,
        fontFace: F.mono, fontSize: 9.5, color: C.tealMint, bold: true, charSpacing: 3, align: "center", margin: 0,
      });
      s.addText("2.5×", {
        x: cx, y: cY + 0.4, w: cW, h: 0.85,
        fontFace: F.serif, fontSize: 64, bold: true, color: C.cream, align: "center", margin: 0,
      });
      s.addText("more capital per asset", {
        x: cx, y: cY + 1.2, w: cW, h: 0.3,
        fontFace: F.serif, fontSize: 14, italic: true, color: C.cream, align: "center", margin: 0,
      });
      s.addText("50% LTV vs 20% scrap-metal LTV", {
        x: cx, y: cY + 1.45, w: cW, h: 0.25,
        fontFace: F.mono, fontSize: 10, color: C.creamSoft, align: "center", margin: 0,
      });
    }

    // Card 3 — Borrower win
    {
      const cx = 0.7 + 2 * (cW + cGap);
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: cY, w: cW, h: cH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      s.addText("BORROWER WIN", {
        x: cx + 0.25, y: cY + 0.15, w: cW - 0.5, h: 0.3,
        fontFace: F.mono, fontSize: 9.5, color: C.tealDeep, bold: true, charSpacing: 3, margin: 0,
      });
      s.addText([
        { text: "Cheaper", options: { color: C.ink2, bold: true, fontFace: F.serif } },
        { text: " than Caixa.\n", options: { color: C.mute, fontFace: F.sans } },
        { text: "19×", options: { color: C.tealDeep, bold: true, fontFace: F.serif } },
        { text: " cheaper than rotativo.", options: { color: C.mute, fontFace: F.sans } },
      ], {
        x: cx + 0.25, y: cY + 0.55, w: cW - 0.5, h: 0.65,
        fontSize: 14, margin: 0, lineSpacing: 24,
      });
      hr(s, p, cx + 0.25, cY + 1.25, cW - 0.5, C.lineLight, 0.5);
      s.addText([
        { text: "Vaulx revenue:  ", options: { color: C.mute, fontFace: F.mono, fontSize: 10 } },
        { text: "$300–600/yr", options: { color: C.tealDeep, fontFace: F.mono, fontSize: 11, bold: true } },
      ], {
        x: cx + 0.25, y: cY + 1.35, w: cW - 0.5, h: 0.25,
        margin: 0, valign: "middle",
      });
    }

    // Bottom 4-pill summary
    const pY = 6.85;
    const pills = [
      { lbl: "Borrower all-in",     val: "24% APR" },
      { lbl: "Vaulx revenue / asset", val: "$300–600 / yr" },
      { lbl: "LP net (post EL)",    val: "~5% APR" },
      { lbl: "Use case",            val: "short-term liquidity" },
    ];
    const pW = (SW - 1.4) / 4;
    pills.forEach((q, i) => {
      const px = 0.7 + i * pW;
      s.addText(q.lbl, {
        x: px + 0.15, y: pY, w: pW - 0.3, h: 0.22,
        fontFace: F.mono, fontSize: 8.5, color: C.mute, charSpacing: 3, bold: true, margin: 0,
      });
      s.addText(q.val, {
        x: px + 0.15, y: pY + 0.22, w: pW - 0.3, h: 0.3,
        fontFace: F.serif, fontSize: 13, color: C.ink2, bold: true, margin: 0,
      });
    });
  }

  // ============================================================
  // S6 — RISK + LP TRANCHES (LIGHT) · 3-col + waterfall
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "06  /  RISK · LIQUIDATION · LP TRANCHES", C.tealDeep);
    pageNum(s, p, 7, TOTAL, C.mute);

    s.addText([
      { text: "Risk is tiered.  ", options: { color: C.ink2 } },
      { text: "Default ", options: { color: C.tealDeep, italic: true } },
      { text: "is choreographed.", options: { color: C.ink2 } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, bold: true, margin: 0,
    });
    s.addText("Every loan is over-collateralized by process, then protected by tranches, liquidation discipline, and protocol-owned first loss.", {
      x: 0.7, y: 1.7, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 12, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.18, 1.0, C.gold, 1.2);

    // 3 columns
    const cY = 2.4, cH = 3.5;
    const cGap = 0.2;
    const cW = (SW - 1.4 - 2 * cGap) / 3;

    // === COL 1 — LTV by asset class ===
    {
      const cx = 0.7;
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: cY, w: cW, h: cH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      s.addText("LTV BY ASSET CLASS", {
        x: cx + 0.25, y: cY + 0.18, w: cW - 0.5, h: 0.3,
        fontFace: F.mono, fontSize: 10, color: C.tealDeep, bold: true, charSpacing: 3, margin: 0,
      });
      hr(s, p, cx + 0.25, cY + 0.55, cW - 0.5, C.lineLight, 0.5);
      // header — relabel to avoid overlap
      s.addText("Origin", {
        x: cx + 1.85, y: cY + 0.65, w: 0.9, h: 0.28,
        fontFace: F.mono, fontSize: 9, color: C.mute, charSpacing: 2, margin: 0,
      });
      s.addText("Threshold", {
        x: cx + 2.95, y: cY + 0.65, w: 1.2, h: 0.28,
        fontFace: F.mono, fontSize: 9, color: C.mute, charSpacing: 2, margin: 0,
      });
      const tiers = [
        { name: "Steel sport watches",  o: "50%", t: "70%" },
        { name: "Gold / precious",      o: "40%", t: "60%" },
        { name: "Handbags",             o: "35%", t: "55%" },
        { name: "Art / one-offs",       o: "25%", t: "45%" },
      ];
      tiers.forEach((t, i) => {
        const ty = cY + 1.0 + i * 0.5;
        s.addText(t.name, {
          x: cx + 0.25, y: ty, w: 1.5, h: 0.3,
          fontFace: F.serif, fontSize: 11, color: C.ink2, valign: "middle", margin: 0,
        });
        s.addText(t.o, {
          x: cx + 1.85, y: ty, w: 0.9, h: 0.3,
          fontFace: F.mono, fontSize: 12, color: C.tealDeep, bold: true, valign: "middle", margin: 0,
        });
        s.addText(t.t, {
          x: cx + 2.95, y: ty, w: 0.9, h: 0.3,
          fontFace: F.mono, fontSize: 12, color: C.mute, valign: "middle", margin: 0,
        });
      });
    }

    // === COL 2 — 14-day Dutch path ===
    {
      const cx = 0.7 + cW + cGap;
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: cY, w: cW, h: cH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      s.addText("14-DAY DEFAULT PATH", {
        x: cx + 0.25, y: cY + 0.18, w: cW - 0.5, h: 0.3,
        fontFace: F.mono, fontSize: 10, color: C.tealDeep, bold: true, charSpacing: 3, margin: 0,
      });
      hr(s, p, cx + 0.25, cY + 0.55, cW - 0.5, C.lineLight, 0.5);
      const path = [
        { t: "T+0",  what: "Margin call",         sub: "24h to top up" },
        { t: "T+1",  what: "Pool LPs",            sub: "last appraisal floor" },
        { t: "T+3",  what: "Resellers",           sub: "authorized network" },
        { t: "T+7",  what: "Open Dutch auction",  sub: "onchain decay" },
        { t: "T+14", what: "Offline backstop",    sub: "70% reserve" },
      ];
      path.forEach((step, i) => {
        const py = cY + 0.75 + i * 0.5;
        // tick + line
        s.addShape(p.shapes.OVAL, {
          x: cx + 0.3, y: py + 0.13, w: 0.13, h: 0.13,
          fill: { color: C.tealDeep }, line: { color: C.tealDeep, width: 0 },
        });
        if (i < path.length - 1) {
          s.addShape(p.shapes.LINE, {
            x: cx + 0.365, y: py + 0.26, w: 0, h: 0.34,
            line: { color: C.lineLight, width: 1 },
          });
        }
        s.addText(step.t, {
          x: cx + 0.55, y: py, w: 0.7, h: 0.28,
          fontFace: F.mono, fontSize: 11, color: C.tealDeep, bold: true, valign: "middle", margin: 0,
        });
        s.addText(step.what, {
          x: cx + 1.25, y: py, w: cW - 1.45, h: 0.28,
          fontFace: F.serif, fontSize: 12, bold: true, color: C.ink2, valign: "middle", margin: 0,
        });
        s.addText(step.sub, {
          x: cx + 1.25, y: py + 0.24, w: cW - 1.45, h: 0.24,
          fontFace: F.sans, fontSize: 9.5, color: C.mute, italic: true, margin: 0,
        });
      });
    }

    // === COL 3 — LP tranches ===
    {
      const cx = 0.7 + 2 * (cW + cGap);
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: cY, w: cW, h: cH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      s.addText("LP TRANCHES", {
        x: cx + 0.25, y: cY + 0.18, w: cW - 0.5, h: 0.3,
        fontFace: F.mono, fontSize: 10, color: C.tealDeep, bold: true, charSpacing: 3, margin: 0,
      });
      hr(s, p, cx + 0.25, cY + 0.55, cW - 0.5, C.lineLight, 0.5);
      // header
      s.addText("APY", {
        x: cx + 1.5, y: cY + 0.65, w: 0.7, h: 0.28,
        fontFace: F.mono, fontSize: 9, color: C.mute, charSpacing: 2, margin: 0,
      });
      s.addText("Share", {
        x: cx + 2.2, y: cY + 0.65, w: 0.8, h: 0.28,
        fontFace: F.mono, fontSize: 9, color: C.mute, charSpacing: 2, margin: 0,
      });
      const tranches = [
        { name: "Senior",     apy: "8%",  share: "~75%",  loss: "last to take losses",     color: C.tealDeep, bold: false },
        { name: "Junior",     apy: "12%", share: "~25%",  loss: "first above POL",         color: C.ink2,    bold: true },
        { name: "Vaulx POL",  apy: "—",   share: "5%",    loss: "absorbs first 5%",        color: C.tealMint, bold: true },
      ];
      tranches.forEach((t, i) => {
        const ty = cY + 1.05 + i * 0.7;
        s.addText(t.name, {
          x: cx + 0.25, y: ty, w: 1.3, h: 0.3,
          fontFace: F.serif, fontSize: 13, bold: true, color: t.color, valign: "middle", margin: 0,
        });
        s.addText(t.apy, {
          x: cx + 1.5, y: ty, w: 0.8, h: 0.3,
          fontFace: F.mono, fontSize: 13, bold: true, color: t.color, valign: "middle", margin: 0,
        });
        s.addText(t.share, {
          x: cx + 2.2, y: ty, w: 0.8, h: 0.3,
          fontFace: F.mono, fontSize: 12, color: C.mute, valign: "middle", margin: 0,
        });
        s.addText(t.loss, {
          x: cx + 0.25, y: ty + 0.3, w: cW - 0.5, h: 0.28,
          fontFace: F.sans, fontSize: 10, color: C.mute, italic: true, margin: 0,
        });
      });
    }

    // Loss waterfall strip
    const wY = 6.1, wH = 0.55;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: wY, w: SW - 1.4, h: wH,
      fill: { color: C.paperCard }, line: { color: C.tealDeep, width: 1.0 },
    });
    s.addText([
      { text: "LOSS WATERFALL  ·  ", options: { color: C.tealDeep, bold: true, italic: true, charSpacing: 3 } },
      { text: "Borrower equity", options: { color: C.ink2, bold: true } },
      { text: "  →  ", options: { color: C.tealDeep } },
      { text: "POL first-loss", options: { color: C.tealMint, bold: true } },
      { text: "  →  ", options: { color: C.tealDeep } },
      { text: "Junior tranche", options: { color: C.ink2, bold: true } },
      { text: "  →  ", options: { color: C.tealDeep } },
      { text: "Senior tranche", options: { color: C.tealDeep, bold: true } },
    ], {
      x: 0.7, y: wY, w: SW - 1.4, h: wH,
      fontFace: F.serif, fontSize: 13, valign: "middle", align: "center", margin: 0,
    });

    // Bottom note
    s.addText([
      { text: "→  ", options: { color: C.tealDeep } },
      { text: "Senior beats Maple syrupUSDC (~7%) by 100 bps. Insurance covers theft & damage to trustee — never default risk.", options: { color: C.ink2, italic: true } },
    ], {
      x: 0.7, y: wY + 0.7, w: SW - 1.4, h: 0.35,
      fontFace: F.sans, fontSize: 12, margin: 0,
    });
  }

  // ============================================================
  // S7 — TEAM (LIGHT) · 5 founders · electronic-security framing
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "07  /  TEAM", C.tealDeep);
    pageNum(s, p, 8, TOTAL, C.mute);

    s.addText([
      { text: "Operators, builders, and market ", options: { color: C.ink2 } },
      { text: "access", options: { color: C.tealDeep, italic: true } },
      { text: ".", options: { color: C.ink2 } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, bold: true, margin: 0,
    });
    s.addText("The team combines banking, electronic-security infrastructure, Solana engineering, and live DeFi distribution.", {
      x: 0.7, y: 1.7, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 12, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.18, 1.0, C.gold, 1.2);

    const team = [
      { icon: ICO.shieldD, name: "George Dimitrov", role: "CEO / CTO",                body: "Corporate execution, global banking operations, governance, legal and regulatory alignment." },
      { icon: ICO.cctv,    name: "Marcelo",         role: "COO  ·  Gitel founder",    body: "38 years building Brazilian electronic-security infra: CCTV · IoT · access control · NOC. The exact tech behind Vaulx's atomic custody invariant." },
      { icon: ICO.handD,   name: "Rodrigo",         role: "Partnerships & BD",        body: "Institutional network, market entry, and commercial partnerships across Brazil and LATAM." },
      { icon: ICO.codeD,   name: "Edson",           role: "Senior Solana Engineer",   body: "Anchor, Bubblegum, oracle integration. Ensures the on-chain stack is solid." },
      { icon: ICO.userD,   name: "Felipe",          role: "DeFi & Community Advisor", body: "Founder of 4p.finance. Connected to US and São Paulo luxury-watch flow, crypto network, and community." },
    ];
    const tY = 2.45, tH = 3.4;
    const tW = (SW - 1.4 - 4 * 0.18) / 5;
    team.forEach((m, i) => {
      const tx = 0.7 + i * (tW + 0.18);
      s.addShape(p.shapes.RECTANGLE, {
        x: tx, y: tY, w: tW, h: tH,
        fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
      });
      // tick top-left
      s.addShape(p.shapes.RECTANGLE, {
        x: tx, y: tY, w: 0.06, h: 0.4,
        fill: { color: C.tealDeep }, line: { color: C.tealDeep, width: 0 },
      });
      // circle for icon
      s.addShape(p.shapes.OVAL, {
        x: tx + tW/2 - 0.45, y: tY + 0.4, w: 0.9, h: 0.9,
        fill: { color: C.paper }, line: { color: C.lineLight, width: 0.75 },
      });
      s.addImage({ data: m.icon, x: tx + tW/2 - 0.28, y: tY + 0.57, w: 0.56, h: 0.56 });
      // name
      s.addText(m.name, {
        x: tx + 0.2, y: tY + 1.45, w: tW - 0.4, h: 0.35,
        fontFace: F.serif, fontSize: 15, bold: true, color: C.ink2, align: "center", margin: 0,
      });
      // role
      s.addText(m.role, {
        x: tx + 0.2, y: tY + 1.78, w: tW - 0.4, h: 0.3,
        fontFace: F.mono, fontSize: 9.5, color: C.tealDeep, bold: true, align: "center", charSpacing: 2, margin: 0,
      });
      hr(s, p, tx + 0.4, tY + 2.13, tW - 0.8, C.lineLight, 0.5);
      s.addText(m.body, {
        x: tx + 0.2, y: tY + 2.2, w: tW - 0.4, h: 1.15,
        fontFace: F.sans, fontSize: 10, color: C.mute, align: "center", margin: 0, lineSpacing: 13,
      });
    });

    // Validator strip
    const vY = 6.05, vH = 0.5;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: vY, w: SW - 1.4, h: vH,
      fill: { color: C.paperCard }, line: { color: C.tealDeep, width: 1.0 },
    });
    s.addText([
      { text: "NO COMPETITOR CAN ASSEMBLE THIS TEAM.   ", options: { color: C.tealDeep, bold: true, charSpacing: 4 } },
      { text: "Active commercial conversations with appraisers, custodians, curators.", options: { color: C.mute, italic: true } },
    ], {
      x: 0.7, y: vY, w: SW - 1.4, h: vH,
      fontFace: F.mono, fontSize: 10.5, valign: "middle", align: "center", margin: 0,
    });

    // skill tag bar
    const tagY = 6.75, tagH = 0.4;
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
  // S8 — COMPETITION (LIGHT) · matrix + unoccupied vertex
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "08  /  COMPETITIVE LANDSCAPE", C.tealDeep);
    pageNum(s, p, 9, TOTAL, C.mute);

    s.addText([
      { text: "A different market.  A different ", options: { color: C.ink2 } },
      { text: "stack", options: { color: C.tealDeep, italic: true } },
      { text: ".", options: { color: C.ink2 } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, bold: true, margin: 0,
    });
    s.addText("Others proved demand. Vaulx occupies the Solana + physical luxury + licensed-partner + emerging-market wedge.", {
      x: 0.7, y: 1.7, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 12, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.18, 1.0, C.gold, 1.2);

    // Competition matrix
    const head = ["Player", "Asset class", "Chain", "Custody", "Geography", "Status"];
    const compRows = [
      ["Kettle Finance", "Watches",          "Blast L2",        "Own NYC vault",      "US-first",  "$4M raised · live"],
      ["4K Protocol",    "Physical luxury",  "Ethereum / Polygon","Own guardians",     "Global",    "Live · luxury loans"],
      ["Tangible",       "Real estate + watches","Polygon",      "Various SPVs",      "Global",    "Live · broader RWA"],
      ["Arcade.xyz",     "Wrapped NFTs",     "Ethereum",        "n/a digital",       "Global",    "NFT lending"],
    ];
    const vRow = ["VAULX", "Luxury physical", "Solana", "Independent licensed", "Brazil → modular global", "Devnet · mainnet after audit"];

    const td = [];
    td.push(head.map((h, i) => ({
      text: h,
      options: {
        color: C.tealDeep, bold: true, fontFace: F.mono, fontSize: 10,
        align: i === 0 ? "left" : "left", valign: "middle",
        fill: { color: C.paper }, margin: [0.1, 0.18, 0.1, 0.18], charSpacing: 3,
      },
    })));
    compRows.forEach(row => {
      td.push(row.map((cell, i) => ({
        text: cell,
        options: {
          color: i === 0 ? C.ink2 : C.mute, bold: i === 0,
          fontFace: i === 0 ? F.serif : F.sans, fontSize: 11,
          align: "left", valign: "middle",
          fill: { color: C.paper },
          margin: [0.08, 0.18, 0.08, 0.18],
        },
      })));
    });
    td.push(vRow.map((cell, i) => ({
      text: cell,
      options: {
        color: C.tealDeep, bold: true, fontFace: i === 0 ? F.serif : F.sans, fontSize: 12,
        align: "left", valign: "middle",
        fill: { color: C.paperLift }, margin: [0.08, 0.18, 0.08, 0.18],
      },
    })));

    s.addTable(td, {
      x: 0.7, y: 2.45, w: SW - 1.4,
      colW: [2.0, 2.2, 1.7, 2.2, 2.2, (SW - 1.4) - 2.0 - 2.2 - 1.7 - 2.2 - 2.2],
      rowH: 0.45,
      border: { type: "solid", pt: 0.5, color: C.lineLight },
    });

    // Unoccupied vertex callout
    const uY = 5.4, uH = 1.5;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: uY, w: SW - 1.4, h: uH,
      fill: { color: C.paperCard }, line: { color: C.tealDeep, width: 1.2 },
    });
    s.addText("THE UNOCCUPIED VERTEX", {
      x: 0.95, y: uY + 0.18, w: 4.0, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.tealDeep, bold: true, charSpacing: 4, margin: 0,
    });
    const verts = [
      { h: "Solana",                sub: "lower-cost composability" },
      { h: "Emerging-market first", sub: "where credit costs 60–400%" },
      { h: "Licensed third-party custody", sub: "no closed black box" },
      { h: "Joint issuance",        sub: "with regulated local partner" },
    ];
    const vW = (SW - 1.4 - 0.5) / 4;
    verts.forEach((v, i) => {
      const vx = 0.95 + i * vW;
      s.addText(v.h, {
        x: vx, y: uY + 0.55, w: vW - 0.3, h: 0.4,
        fontFace: F.serif, fontSize: 14, bold: true, color: C.ink2, margin: 0,
      });
      s.addText(v.sub, {
        x: vx, y: uY + 0.95, w: vW - 0.3, h: 0.4,
        fontFace: F.sans, fontSize: 11, color: C.mute, italic: true, margin: 0,
      });
    });

    // Bottom note
    s.addText([
      { text: "→  ", options: { color: C.tealDeep } },
      { text: "Vaulx sits in that vertex. Solana economics, LATAM-first geography, composable architecture, regulated-local issuance.", options: { color: C.ink2, italic: true } },
    ], {
      x: 0.7, y: uY + uH + 0.1, w: SW - 1.4, h: 0.35,
      fontFace: F.serif, fontSize: 13, margin: 0,
    });
  }

  // ============================================================
  // S9 — BUILT · ASK · 90-DAY (DARK) · close
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    eyebrow(s, p, 0.7, 0.5, 6.0, "09  /  BUILT  ·  ASK  ·  ROADMAP", C.tealMint);
    pageNum(s, p, 10, TOTAL, C.muteDark);

    s.addText([
      { text: "Built ", options: { color: C.cream } },
      { text: "today", options: { color: C.tealMint, italic: true } },
      { text: ". Clear ", options: { color: C.cream } },
      { text: "ask", options: { color: C.gold, italic: true } },
      { text: ". Mainnet in ", options: { color: C.cream } },
      { text: "90 days", options: { color: C.tealMint, italic: true } },
      { text: ".", options: { color: C.cream } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, bold: true, margin: 0,
    });
    hr(s, p, 0.7, 1.85, 1.0, C.gold, 1.2);

    // 3 columns — slightly shorter to make room for partner strip
    const colY = 2.05, colH = 3.65, gap = 0.25;
    const colW = (SW - 1.4 - 2 * gap) / 3;

    // === COL 1 — Built today ===
    {
      const cx = 0.7;
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: colY, w: colW, h: colH,
        fill: { color: C.inkSoft }, line: { color: C.lineDark, width: 0.75 },
      });
      s.addImage({ data: ICO.codeT, x: cx + 0.3, y: colY + 0.3, w: 0.45, h: 0.45 });
      s.addText("Built today", {
        x: cx + 0.85, y: colY + 0.32, w: colW - 1.0, h: 0.45,
        fontFace: F.serif, fontSize: 20, bold: true, color: C.cream, valign: "middle", margin: 0,
      });
      hr(s, p, cx + 0.3, colY + 0.85, colW - 0.6, C.tealMint, 1);

      const built = [
        ["4",   "Anchor programs",  "vault · loan · trdc · auction"],
        ["45+", "tests green",      "Anchor + CI gating"],
        ["1",   "frontend live",    "vaulx.fi · /admin/demo"],
        ["1",   "indexer + bridge", "Supabase event log"],
      ];
      built.forEach((b, i) => {
        const by = colY + 1.1 + i * 0.65;
        s.addText(b[0], {
          x: cx + 0.3, y: by, w: 0.7, h: 0.4,
          fontFace: F.serif, fontSize: 22, bold: true, color: C.cream, margin: 0,
        });
        s.addText(b[1], {
          x: cx + 1.0, y: by + 0.05, w: colW - 1.1, h: 0.3,
          fontFace: F.serif, fontSize: 13, bold: true, color: C.cream, margin: 0,
        });
        s.addText(b[2], {
          x: cx + 1.0, y: by + 0.32, w: colW - 1.1, h: 0.28,
          fontFace: F.mono, fontSize: 9, color: C.muteDark, margin: 0,
        });
      });
    }

    // === COL 2 — Our ask (highlighted) ===
    {
      const cx = 0.7 + colW + gap;
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: colY, w: colW, h: colH,
        fill: { color: C.inkSoft }, line: { color: C.gold, width: 1.5 },
      });
      // gold tick
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: colY, w: 0.1, h: colH,
        fill: { color: C.gold }, line: { color: C.gold, width: 0 },
      });
      s.addImage({ data: ICO.diamondG, x: cx + 0.3, y: colY + 0.3, w: 0.45, h: 0.45 });
      s.addText("Our ask", {
        x: cx + 0.85, y: colY + 0.32, w: colW - 1.0, h: 0.45,
        fontFace: F.serif, fontSize: 20, bold: true, color: C.gold, valign: "middle", margin: 0,
      });
      hr(s, p, cx + 0.3, colY + 0.85, colW - 0.6, C.gold, 1.2);

      s.addText("$250K", {
        x: cx, y: colY + 1.1, w: colW, h: 1.1,
        fontFace: F.serif, fontSize: 70, bold: true, color: C.gold, align: "center", margin: 0,
      });
      s.addText("Colosseum RWA track  ·  pre-seed bridge", {
        x: cx, y: colY + 2.25, w: colW, h: 0.3,
        fontFace: F.sans, fontSize: 11, italic: true, color: C.tealMint, align: "center", margin: 0,
      });
      hr(s, p, cx + 0.4, colY + 2.65, colW - 0.8, C.lineDark, 0.5);

      const askItems = [
        "audit our 4 Anchor programs",
        "first custodian + appraiser + curator",
        "originate first 50 loans by Q3",
        "bridge to seed with traction",
      ];
      askItems.forEach((it, i) => {
        s.addText([
          { text: "→  ", options: { color: C.gold } },
          { text: it, options: { color: C.cream } },
        ], {
          x: cx + 0.3, y: colY + 2.55 + i * 0.24, w: colW - 0.6, h: 0.26,
          fontFace: F.sans, fontSize: 10.5, valign: "middle", margin: 0,
        });
      });
    }

    // === COL 3 — 90-day roadmap ===
    {
      const cx = 0.7 + 2 * (colW + gap);
      s.addShape(p.shapes.RECTANGLE, {
        x: cx, y: colY, w: colW, h: colH,
        fill: { color: C.inkSoft }, line: { color: C.lineDark, width: 0.75 },
      });
      s.addImage({ data: ICO.calT, x: cx + 0.3, y: colY + 0.3, w: 0.45, h: 0.45 });
      s.addText("90-day plan", {
        x: cx + 0.85, y: colY + 0.32, w: colW - 1.0, h: 0.45,
        fontFace: F.serif, fontSize: 20, bold: true, color: C.cream, valign: "middle", margin: 0,
      });
      hr(s, p, cx + 0.3, colY + 0.85, colW - 0.6, C.tealMint, 1);

      const road = [
        { day: "DAY 0",   what: "audit kickoff",       sub: "external review + bug bounty" },
        { day: "DAY 60",  what: "custodian signed",    sub: "Lloyd's binder confirmed" },
        { day: "DAY 90",  what: "mainnet launch",      sub: "first real loan" },
        { day: "Q3 2026", what: "50 customers",        sub: "tranches live" },
        { day: "Q4 2026", what: "100 customers",       sub: "seed close" },
      ];
      road.forEach((r, i) => {
        const ry = colY + 1.1 + i * 0.55;
        s.addText(r.day, {
          x: cx + 0.3, y: ry, w: 1.2, h: 0.28,
          fontFace: F.mono, fontSize: 9.5, color: C.tealMint, bold: true, charSpacing: 3, valign: "middle", margin: 0,
        });
        s.addText(r.what, {
          x: cx + 1.5, y: ry, w: colW - 1.6, h: 0.28,
          fontFace: F.serif, fontSize: 12, bold: true, color: C.cream, valign: "middle", margin: 0,
        });
        s.addText(r.sub, {
          x: cx + 1.5, y: ry + 0.26, w: colW - 1.6, h: 0.25,
          fontFace: F.sans, fontSize: 9.5, color: C.muteDark, italic: true, margin: 0,
        });
      });
    }

    // Subtle stack mention (no logos — clean text, partners already named on S3)
    const psY = 5.95;
    s.addText([
      { text: "THE STACK   ", options: { color: C.muteDark, charSpacing: 4 } },
      { text: "Solana  ·  Sumsub  ·  Sekuro  ·  Lloyd's  ·  Kamino  ·  Crossmint", options: { color: C.cream } },
    ], {
      x: 0.7, y: psY, w: SW - 1.4, h: 0.3,
      fontFace: F.mono, fontSize: 10, bold: false, valign: "middle", margin: 0,
    });

    // Closing strip + CTA
    const cY = 6.4;
    hr(s, p, 0.7, cY, SW - 1.4, C.lineDark, 0.5);
    s.addText([
      { text: "The rail between physical luxury and onchain capital.   ", options: { color: C.cream, italic: true } },
      { text: "Built on Solana.", options: { color: C.tealMint, bold: true } },
    ], {
      x: 0.7, y: cY + 0.15, w: 8.6, h: 0.5,
      fontFace: F.serif, fontSize: 14, valign: "middle", margin: 0,
    });

    const btnX = SW - 4.0, btnY = cY + 0.12, btnW = 3.3, btnH = 0.5;
    s.addShape(p.shapes.RECTANGLE, {
      x: btnX, y: btnY, w: btnW, h: btnH,
      fill: { color: C.cream }, line: { color: C.cream, width: 0 },
    });
    s.addText([
      { text: "Come build with us.   ", options: { color: C.ink, bold: true } },
      { text: "→", options: { color: C.ink, bold: true } },
    ], {
      x: btnX, y: btnY, w: btnW, h: btnH,
      fontFace: F.serif, fontSize: 14, italic: true, align: "center", valign: "middle", margin: 0,
    });

    // Footer
    s.addImage({
      path: `${ASSETS}/vaulx_logo_white.png`,
      x: 0.55, y: SH - 0.4, w: 0.5, h: 0.135,
    });
    s.addText("github.com/Vaulxfi  ·  vaulx.fi  ·  Solana Devnet", {
      x: 1.2, y: SH - 0.42, w: 5.0, h: 0.25,
      fontFace: F.mono, fontSize: 9, color: C.muteDark, valign: "middle", margin: 0,
    });
  }

  // Make sure output dir exists
  const outDir = OUT.substring(0, OUT.lastIndexOf("/"));
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await p.writeFile({ fileName: OUT });
  console.log("Wrote:", OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
