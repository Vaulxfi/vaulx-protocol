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

const OUT = "/Users/gogy/MyCODE/VAULX/docs/deck/Vaulx_Pitch_v12.pptx";
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

  const TOTAL = 9;


  // ============================================================
  // S2 — ASYMMETRY / PROBLEM (DARK) · rate stack + capital gap
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    eyebrow(s, p, 0.7, 0.5, 6.0, "02  /  THE ASYMMETRY", C.tealMint);
    pageNum(s, p, 1, TOTAL, C.muteDark);

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
    s.addNotes("Meet Marco in São Paulo. He owns a fourteen-thousand-dollar Rolex, but his options for liquidity are predatory. The official pawn monopoly lends twenty-percent LTV at thirty percent APR. Consumer loans hit sixty. Credit-card rotativo hits four hundred percent. Meanwhile, physical-asset-rich individuals cannot access cheap global liquidity sitting on-chain at eight percent. (Pause 2.5 seconds.) Until now.");
  }

  // ============================================================
  // S2 — VAULX · TECH STACK HERO (DARK) · cinematic title card
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    eyebrow(s, p, 0.7, 0.5, 6.0, "02  /  THE RAIL", C.tealDeep);
    pageNum(s, p, 2, TOTAL, C.muteDark);

    // Left half: vaulx logo + tagline
    s.addImage({
      path: `${ASSETS}/vaulx_logo_white.png`,
      x: 0.7, y: 1.4, w: 4.6, h: 1.26,
    });
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: 2.95, w: 1.0, h: 0.03,
      fill: { color: C.cream }, line: { color: C.cream, width: 0 },
    });
    s.addText([
      { text: "The on-chain credit ", options: { color: C.cream } },
      { text: "rail", options: { color: C.tealDeep, italic: true } },
      { text: ".", options: { color: C.cream } },
    ], {
      x: 0.7, y: 3.2, w: 6.0, h: 0.8,
      fontFace: F.serif, fontSize: 32, margin: 0,
    });
    s.addText("Vaulx orchestrates off-chain complexity through licensed independent partners, wiring physical luxury collateral into Solana's onchain credit rails.", {
      x: 0.7, y: 4.1, w: 6.0, h: 1.2,
      fontFace: F.sans, fontSize: 14, color: C.creamSoft, margin: 0, lineSpacing: 22,
    });
    s.addText([
      { text: "Vaulx doesn't take custody.  ", options: { color: C.cream } },
      { text: "Vaulx doesn't hold capital.  ", options: { color: C.cream } },
      { text: "All in smart contracts.", options: { color: C.tealDeep, bold: true } },
    ], {
      x: 0.7, y: 5.5, w: 6.0, h: 0.8,
      fontFace: F.mono, fontSize: 11, charSpacing: 1, margin: 0, lineSpacing: 18,
    });

    // Right half: white card with two logo categories
    const tsX = 7.2, tsY = 1.0, tsW = SW - 0.7 - tsX, tsH = SH - 1.0 - 0.8;
    s.addShape(p.shapes.RECTANGLE, {
      x: tsX, y: tsY, w: tsW, h: tsH,
      fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.5 },
    });

    // Header 1
    s.addText("INFRASTRUCTURE & DATA", {
      x: tsX + 0.3, y: tsY + 0.25, w: tsW - 0.6, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.tealDeep, bold: true, charSpacing: 4, margin: 0,
    });
    hr(s, p, tsX + 0.3, tsY + 0.6, tsW - 0.6, C.lineLight, 0.5);

    // 6 infrastructure logos in 2x3 grid
    const infraLogos = ["solana-sol.png", "crossmint.png", "sumsub-horizontal-black.png", "kamino-cdn.png", "pyth.png", "chrono24.png"];
    const infraNames = ["Solana", "Crossmint", "Sumsub", "Kamino", "Pyth", "Chrono24"];
    const slotW = (tsW - 0.6) / 3;
    const slotH = 0.55;
    infraLogos.forEach((logo, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const lx = tsX + 0.3 + col * slotW;
      const ly = tsY + 0.85 + row * (slotH + 0.55);
      if (fs.existsSync(`${LOGOS}/${logo}`)) {
        s.addImage({
          path: `${LOGOS}/${logo}`,
          x: lx + 0.1, y: ly, h: slotH,
          sizing: { type: "contain", w: slotW - 0.2, h: slotH },
        });
      }
      s.addText(infraNames[i], {
        x: lx, y: ly + slotH + 0.05, w: slotW, h: 0.22,
        fontFace: F.mono, fontSize: 8, color: C.mute, align: "center", margin: 0,
      });
    });

    // Divider
    hr(s, p, tsX + 0.3, tsY + 3.1, tsW - 0.6, C.lineLight, 0.5);

    // Header 2
    s.addText("TARGET INTEGRATION NETWORK", {
      x: tsX + 0.3, y: tsY + 3.25, w: tsW - 0.6, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.mute, bold: true, charSpacing: 4, margin: 0,
    });
    hr(s, p, tsX + 0.3, tsY + 3.6, tsW - 0.6, C.lineLight, 0.5);

    // 4 target logos in single row (sekuro-white invisible on white card → text-only)
    const targetLogos = ["vaultik.png", "_skip_sekuro.png", "brinks.png", "loomis.png"];
    const targetNames = ["Vaultik", "Sekuro", "Brinks", "Loomis"];
    const tSlotW = (tsW - 0.6) / 4;
    const tSlotH = 0.5;
    targetLogos.forEach((logo, i) => {
      const lx = tsX + 0.3 + i * tSlotW;
      const ly = tsY + 3.85;
      if (fs.existsSync(`${LOGOS}/${logo}`)) {
        s.addImage({
          path: `${LOGOS}/${logo}`,
          x: lx + 0.1, y: ly, h: tSlotH,
          sizing: { type: "contain", w: tSlotW - 0.2, h: tSlotH },
        });
      } else {
        // Render the name as serif wordmark when logo file unavailable
        s.addText(targetNames[i], {
          x: lx, y: ly, w: tSlotW, h: tSlotH,
          fontFace: F.serif, fontSize: 18, bold: true, color: C.ink2,
          align: "center", valign: "middle", margin: 0,
        });
      }
      s.addText(targetNames[i], {
        x: lx, y: ly + tSlotH + 0.05, w: tSlotW, h: 0.22,
        fontFace: F.mono, fontSize: 8, color: C.mute, align: "center", margin: 0,
      });
    });

    // Bottom note inside card
    s.addText("Open-source primitives + active commercial conversations.", {
      x: tsX + 0.3, y: tsY + tsH - 0.45, w: tsW - 0.6, h: 0.3,
      fontFace: F.mono, fontSize: 8.5, color: C.mute, italic: true, align: "center", margin: 0,
    });

    s.addNotes("We are Vaulx. The on-chain credit rail. We don't hold capital and we don't take custody. We orchestrate off-chain complexity by wiring into the best infrastructure in the world — pulling watch pricing data from Chrono24, integrating compliance through Sumsub, embedded wallets through Crossmint, oracles through Pyth, and tapping directly into Kamino and Loopscale for Solana liquidity. Vaultik, Sekuro, Brinks, and Loomis are our target integration network for licensed custody.");
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
    s.addNotes("Our atomic contract enforces five strict gates. The killer invariant: no USDC is disbursed until the licensed custodian physically vaults the asset and signs on-chain — atomically, in the same transaction. Default is managed purely at the smart contract level via event-triggered auctions.");
  }



  // ============================================================
  // S5 — ECONOMICS (LIGHT) · table + per-loan + 3-bucket
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "05  /  CYCLE ECONOMICS", C.tealDeep);
    pageNum(s, p, 4, TOTAL, C.mute);

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
    s.addNotes("Our economics beat the market. We offer borrowers fifty percent LTV at twenty-four percent APR. We beat the cheapest formal credit, provide two-and-a-half times the capital, and value the watch as a watch — not scrap metal. Vaulx nets three to six hundred dollars per asset per year.");
  }

  // ============================================================
  // S6 — RISK + LP TRANCHES (LIGHT) · 3-col + waterfall
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "06  /  RISK · LIQUIDATION · LP TRANCHES", C.tealDeep);
    pageNum(s, p, 5, TOTAL, C.mute);

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
    s.addNotes("LPs are tranched to match risk. Senior LPs earn eight percent fixed, while Junior LPs earn twelve percent, sitting safely above our five-percent protocol-owned first-loss buffer. Every loan is over-collateralized, with a strict fourteen-day Dutch auction on default.");
  }

  // ============================================================
  // S6 — MODULAR BUSINESS ARCHITECTURE + SCALING + TAM (LIGHT)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "06  /  MODULAR BUSINESS ARCHITECTURE  ·  SCALE", C.tealDeep);
    pageNum(s, p, 6, TOTAL, C.mute);

    s.addText([
      { text: "Built to ", options: { color: C.ink2 } },
      { text: "scale", options: { color: C.tealDeep, italic: true } },
      { text: ".  ", options: { color: C.ink2 } },
      { text: "Brazil → LATAM → Global.", options: { color: C.mute } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.85,
      fontFace: F.serif, fontSize: 32, bold: true, margin: 0,
    });
    s.addText("Eight of ten modules ship globally. Two local adapters swap per market in 60–90 days. One credit core, every emerging market.", {
      x: 0.7, y: 1.75, w: SW - 1.4, h: 0.4,
      fontFace: F.sans, fontSize: 13, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 2.22, 1.0, C.tealDeep, 1.2);

    // ===== LEFT HALF — Modular Architecture (Global Core / Local Adapters) + Scale arrow =====
    const lX = 0.7, lW = 7.5;
    const archY = 2.5;

    // Global Core block
    s.addShape(p.shapes.RECTANGLE, {
      x: lX, y: archY, w: lW, h: 1.5,
      fill: { color: C.paperCard }, line: { color: C.tealDeep, width: 1.0 },
    });
    s.addText("8 OF 10  ·  GLOBAL CORE", {
      x: lX + 0.25, y: archY + 0.15, w: lW - 0.5, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.tealDeep, bold: true, charSpacing: 4, margin: 0,
    });
    s.addText("Solana programs  ·  cNFT logic  ·  Sumsub KYC  ·  Lloyd's master policy  ·  Pyth + RedStone oracles  ·  Vaulx Trust  ·  online appraisal API  ·  curated lending rails", {
      x: lX + 0.25, y: archY + 0.5, w: lW - 0.5, h: 0.95,
      fontFace: F.serif, fontSize: 14, color: C.ink2, margin: 0, lineSpacing: 22,
    });

    // Local Adapters block
    s.addShape(p.shapes.RECTANGLE, {
      x: lX, y: archY + 1.7, w: lW, h: 1.0,
      fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
    });
    s.addText("2 OF 10  ·  LOCAL ADAPTERS", {
      x: lX + 0.25, y: archY + 1.85, w: lW - 0.5, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.mute, bold: true, charSpacing: 4, margin: 0,
    });
    s.addText("Offline appraisal  ·  Licensed custody — swap per market in 60–90 days.", {
      x: lX + 0.25, y: archY + 2.2, w: lW - 0.5, h: 0.4,
      fontFace: F.serif, fontSize: 14, color: C.ink2, italic: false, margin: 0,
    });

    // Scale arrow strip — Brazil → LATAM → Global
    const arrowY = archY + 2.95;
    const arrowH = 0.7;
    s.addShape(p.shapes.RECTANGLE, {
      x: lX, y: arrowY, w: lW, h: arrowH,
      fill: { color: C.paperLift }, line: { color: C.lineLight, width: 0 },
    });
    const phases = ["Brazil", "LATAM", "Global"];
    const phaseSubs = ["São Paulo wedge · 2026", "Mexico · Argentina · 2026", "EM corridors · 2027+"];
    const pSlotW = lW / 3;
    phases.forEach((ph, i) => {
      const px = lX + i * pSlotW;
      // separator line between phases
      if (i > 0) {
        s.addText("→", {
          x: px - 0.2, y: arrowY, w: 0.4, h: arrowH,
          fontSize: 18, color: C.tealDeep, fontFace: F.sans, align: "center", valign: "middle", margin: 0,
        });
      }
      s.addText(ph, {
        x: px + 0.3, y: arrowY + 0.1, w: pSlotW - 0.6, h: 0.32,
        fontFace: F.serif, fontSize: 17, bold: true, color: C.ink2, align: "center", margin: 0,
      });
      s.addText(phaseSubs[i], {
        x: px + 0.3, y: arrowY + 0.42, w: pSlotW - 0.6, h: 0.22,
        fontFace: F.sans, fontSize: 9.5, color: C.mute, italic: true, align: "center", margin: 0,
      });
    });

    // ===== RIGHT HALF — TAM funnel =====
    const rX = lX + lW + 0.3;
    const rW = SW - 0.7 - rX;
    s.addShape(p.shapes.RECTANGLE, {
      x: rX, y: archY, w: rW, h: 4.15,
      fill: { color: C.paperCard }, line: { color: C.lineLight, width: 0.75 },
    });
    s.addText("ADDRESSABLE MARKET", {
      x: rX + 0.25, y: archY + 0.2, w: rW - 0.5, h: 0.3,
      fontFace: F.mono, fontSize: 10, color: C.tealDeep, bold: true, charSpacing: 4, margin: 0,
    });
    hr(s, p, rX + 0.25, archY + 0.6, rW - 0.5, C.lineLight, 0.5);

    const tam = [
      { val: "$90B", lbl: "watches in private hands",  sub: "high-credit-cost markets" },
      { val: "$20B", lbl: "realistically addressable", sub: "5-yr horizon" },
      { val: "$1–3B",lbl: "year-5 origination target", sub: "1–5% capture of pool" },
    ];
    tam.forEach((t, i) => {
      const ty = archY + 0.9 + i * 1.05;
      s.addText(t.val, {
        x: rX + 0.25, y: ty, w: rW - 0.5, h: 0.5,
        fontFace: F.serif, fontSize: 30, bold: true, color: C.ink2, margin: 0,
      });
      s.addText(t.lbl, {
        x: rX + 0.25, y: ty + 0.5, w: rW - 0.5, h: 0.25,
        fontFace: F.mono, fontSize: 10, color: C.tealDeep, bold: true, charSpacing: 2, margin: 0,
      });
      s.addText(t.sub, {
        x: rX + 0.25, y: ty + 0.72, w: rW - 0.5, h: 0.22,
        fontFace: F.sans, fontSize: 10, color: C.mute, italic: true, margin: 0,
      });
    });

    // Bottom note — distribution baked into team
    s.addText([
      { text: "→  ", options: { color: C.tealDeep, bold: true } },
      { text: "Distribution is built into the team:  ", options: { color: C.ink2, bold: true, fontFace: F.serif } },
      { text: "Felipe's luxury-reseller flow, Rodrigo's BD network, Marcelo's Brazilian corporate reach. Low CAC at launch.", options: { color: C.mute, italic: true, fontFace: F.serif } },
    ], {
      x: 0.7, y: 6.85, w: SW - 1.4, h: 0.4,
      fontSize: 13, margin: 0, valign: "middle",
    });

    s.addNotes("This is a ninety-billion-dollar addressable market. But our immediate advantage is distribution. We don't rely on paid ads. Off-chain, our founders already process São Paulo's luxury watch flow and bring a network of corporate clients. On-chain, Kamino and Loopscale pipe us directly into existing Solana yield audiences.");
  }

  // ============================================================
  // S8 — COMPETITION (LIGHT) · matrix + unoccupied vertex
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.paper };

    eyebrow(s, p, 0.7, 0.5, 6.0, "07  /  WHY NOW  ·  WHY US", C.tealDeep);

    s.addText([
      { text: "Why ", options: { color: C.ink2 } },
      { text: "now", options: { color: C.tealDeep, italic: true } },
      { text: ".  Why ", options: { color: C.ink2 } },
      { text: "us", options: { color: C.tealDeep, italic: true } },
      { text: ".", options: { color: C.ink2 } },
    ], {
      x: 0.7, y: 0.85, w: SW - 1.4, h: 0.7,
      fontFace: F.serif, fontSize: 30, bold: true, margin: 0,
    });
    s.addText("Solana RWA crossed institutional inflection. Competitors stuck on Ethereum. Nobody owns the LATAM-first wedge.", {
      x: 0.7, y: 1.55, w: SW - 1.4, h: 0.35,
      fontFace: F.sans, fontSize: 12, color: C.mute, margin: 0,
    });
    hr(s, p, 0.7, 1.95, 1.0, C.tealDeep, 1.2);

    // === WHY NOW strip — 4 institutional adoption signals ===
    const wnY = 2.15, wnH = 0.85;
    const wn = [
      { lbl: "RWA TVL ON SOLANA",   big: "$1.82B", sub: "Mar 2026 · +90% MoM" },
      { lbl: "WESTERN UNION USDPT", big: "Live",   sub: "Solana · May 2026" },
      { lbl: "PAYMENTS GIANTS",     big: "Visa·Stripe·PayPal", sub: "production stablecoin workflows" },
      { lbl: "TOKENIZED FUNDS",     big: "$2.3B+", sub: "BlackRock BUIDL · Franklin FOBXX" },
    ];
    const wnW = (SW - 1.4) / 4;
    wn.forEach((c, i) => {
      const wx = 0.7 + i * wnW;
      if (i > 0) vr(s, p, wx, wnY + 0.1, wnH - 0.2, C.lineLight, 0.5);
      s.addText(c.lbl, {
        x: wx + 0.15, y: wnY, w: wnW - 0.3, h: 0.22,
        fontFace: F.mono, fontSize: 8.5, color: C.tealDeep, bold: true, charSpacing: 3, margin: 0,
      });
      s.addText(c.big, {
        x: wx + 0.15, y: wnY + 0.22, w: wnW - 0.3, h: 0.4,
        fontFace: F.serif, fontSize: 16, bold: true, color: C.ink2, margin: 0,
      });
      s.addText(c.sub, {
        x: wx + 0.15, y: wnY + 0.6, w: wnW - 0.3, h: 0.22,
        fontFace: F.sans, fontSize: 10, color: C.mute, italic: true, margin: 0,
      });
    });

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
      x: 0.7, y: 3.2, w: SW - 1.4,
      colW: [2.0, 2.2, 1.7, 2.2, 2.2, (SW - 1.4) - 2.0 - 2.2 - 1.7 - 2.2 - 2.2],
      rowH: 0.42,
      border: { type: "solid", pt: 0.5, color: C.lineLight },
    });

    // Unoccupied vertex callout
    const uY = 5.85, uH = 1.25;
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
      { text: "The unoccupied vertex: Solana economics, LATAM-first geography, composable architecture, regulated-local issuance. Vaulx sits there.", options: { color: C.ink2, italic: true } },
    ], {
      x: 0.7, y: uY + uH + 0.05, w: SW - 1.4, h: 0.32,
      fontFace: F.serif, fontSize: 12, margin: 0,
    });
    s.addNotes("Why now? Solana RWA TVL crossed one-point-eight billion dollars, and Western Union launched their stablecoin on Solana this month. The institutional rails are here. Competitors exist on Ethereum, but none have Solana's economics, composability, or our LATAM-first focus where credit costs are highest.");
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
      { icon: ICO.bankD,   name: "George Dimitrov", role: "CEO / CTO",                  body: "Brings European banking operations management and regulatory acumen. 15+ years across global financial institutions." },
      { icon: ICO.cctv,    name: "Marcelo Coelho",  role: "COO  ·  Gitel CEO",          body: "Brings Brazilian business network and security excellence. Gitel: 38 years of CCTV / IoT / access control — the exact stack behind Vaulx's custody invariant." },
      { icon: ICO.handD,   name: "Rodrigo Coelho",  role: "Chief Growth Officer",       body: "Brings growth, partnerships, and market entry across Brazil and LATAM. Institutional commercial network." },
      { icon: ICO.codeD,   name: "Edson Pohren",    role: "Lead Engineer",              body: "Brings Solana protocol delivery — Anchor, Bubblegum, oracle integration. Ships the on-chain stack." },
      { icon: ICO.watchD,  name: "Felipe Veloso",   role: "DeFi Advisor · 4p.finance",  body: "Brings DeFi, crypto rails, and a luxury-reseller network across Brazil and the US. Founder of 4p.finance." },
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
    s.addNotes("Anyone can fork a smart contract. You cannot fork our team. I bring fifteen years of global banking. Marcelo brings thirty-eight years building Brazilian electronic-security infrastructure — the exact IoT tech stack powering our atomic custody. Rodrigo leads LATAM growth, Felipe bridges DeFi, and Edson ships our Solana architecture.\n\nTeam verifiable on LinkedIn:\n· George Dimitrov — linkedin.com/in/gheorghedimitrov/\n· Marcelo Coelho — linkedin.com/in/marcelo-coelho-78564236/\n· Rodrigo Coelho — linkedin.com/in/rodrigo-coelho-2459a123/\n· Edson Pohren — linkedin.com/in/edson-pohren-19421ab5/\n· Felipe Veloso — 4p.finance");
  }

  // ============================================================
  // S9 — BUILT · ASK · 90-DAY (DARK) · close
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.ink };

    eyebrow(s, p, 0.7, 0.5, 6.0, "09  /  BUILT  ·  ASK  ·  ROADMAP", C.tealMint);
    pageNum(s, p, 9, TOTAL, C.muteDark);

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
    s.addNotes("Today, four Anchor programs are live on Devnet with forty-five-plus tests passing. We're asking for the Colosseum prize to audit our contracts, sign our first custodian, originate fifty mainnet loans by Q3, one hundred by Q4, and bridge to seed. We are Vaulx. Come build with us.");
  }

  // Make sure output dir exists
  const outDir = OUT.substring(0, OUT.lastIndexOf("/"));
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await p.writeFile({ fileName: OUT });
  console.log("Wrote:", OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
