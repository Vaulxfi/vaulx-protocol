const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const fa6 = require("react-icons/fa6");
const md = require("react-icons/md");
const si = require("react-icons/si");

const OUT = "/Users/gogy/MyCODE/VAULX/.claude/worktrees/recursing-mcnulty-a36d0a/docs/colosseum/Vaulx_Pitch_v8.pptx";
const SW = 13.333, SH = 7.5;

// Exact palette per user spec
const C = {
  darkBg: "0A0A0B",
  darkCard: "131316",
  darkBorder: "1F1F25",
  darkBorderSoft: "16161B",
  lightBg: "FAFAF7",
  lightCard: "FFFFFF",
  lightBorder: "E5E2D8",
  lightBorderSoft: "ECE9DE",
  tealDeep: "0E7C7B",      // primary accent
  tealBright: "2BA09E",    // secondary, italic l
  warn: "B8412C",          // penalty / predatory rates
  mute: "6B6B70",
  cream: "F5F0E8",
  creamMute: "C9C5BA",
  darkText: "0A0A0B",
  textOnDark: "F5F0E8",
  textMuteOnDark: "9A9AA0",
  white: "FFFFFF",
};

async function iconPng(Icon, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// Vaulx wordmark text (italic 'l' in tealBright)
function vaulxRich(creamColor, tealColor, fontSize, bold = true) {
  return [
    { text: "Vau", options: { color: creamColor, fontSize, fontFace: "Georgia", bold } },
    { text: "l", options: { color: tealColor, fontSize, fontFace: "Georgia", bold, italic: true } },
    { text: "x", options: { color: creamColor, fontSize, fontFace: "Georgia", bold } },
  ];
}

// Small Vaulx header for top of each non-cover slide
function addHeaderMark(s, dark) {
  const cream = dark ? C.cream : C.darkText;
  const teal = C.tealBright;
  s.addText(vaulxRich(cream, teal, 16, true), {
    x: 0.5, y: 0.22, w: 1.2, h: 0.4, margin: 0,
  });
}

async function main() {
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE";
  p.title = "Vaulx Pitch v8.1";
  p.author = "Vaulx";

  // Pre-render icons in needed colors
  const ICO = {
    shieldT:    await iconPng(md.MdVerifiedUser, "#" + C.tealBright),
    shieldD:    await iconPng(md.MdVerifiedUser, "#" + C.tealDeep),
    globeT:     await iconPng(fa.FaGlobe, "#" + C.tealBright),
    globeD:     await iconPng(fa.FaGlobe, "#" + C.tealDeep),
    rocketT:    await iconPng(fa.FaRocket, "#" + C.tealBright),
    rocketD:    await iconPng(fa.FaRocket, "#" + C.tealDeep),
    diamondT:   await iconPng(fa6.FaGem, "#" + C.tealBright),
    bankT:      await iconPng(fa.FaUniversity, "#" + C.tealBright),
    bankD:      await iconPng(fa.FaUniversity, "#" + C.tealDeep),
    solanaT:    await iconPng(si.SiSolana, "#" + C.tealBright),
    solanaD:    await iconPng(si.SiSolana, "#" + C.tealDeep),
    boltT:      await iconPng(fa.FaBolt, "#" + C.tealBright),
    boltD:      await iconPng(fa.FaBolt, "#" + C.tealDeep),
    chartT:     await iconPng(fa.FaChartLine, "#" + C.tealBright),
    chartD:     await iconPng(fa.FaChartLine, "#" + C.tealDeep),
    watchT:     await iconPng(md.MdWatch, "#" + C.tealBright),
    watchD:     await iconPng(md.MdWatch, "#" + C.tealDeep),
    safeD:      await iconPng(md.MdLock, "#" + C.tealDeep),
    dollarT:    await iconPng(fa.FaDollarSign, "#" + C.tealBright),
    scaleT:     await iconPng(fa6.FaScaleBalanced, "#" + C.tealBright),
    scaleD:     await iconPng(fa6.FaScaleBalanced, "#" + C.tealDeep),
    userT:      await iconPng(fa.FaUser, "#" + C.tealBright),
    userD:      await iconPng(fa.FaUser, "#" + C.tealDeep),
    handD:      await iconPng(fa.FaHandshake, "#" + C.tealDeep),
    codeT:      await iconPng(fa.FaCode, "#" + C.tealBright),
    codeD:      await iconPng(fa.FaCode, "#" + C.tealDeep),
    githubT:    await iconPng(fa.FaGithub, "#" + C.tealBright),
    githubM:    await iconPng(fa.FaGithub, "#" + C.mute),
    layersD:    await iconPng(fa.FaLayerGroup, "#" + C.tealDeep),
    tagD:       await iconPng(fa.FaTag, "#" + C.tealDeep),
    calT:       await iconPng(fa.FaCalendarAlt, "#" + C.tealBright),
    cogD:       await iconPng(fa.FaCog, "#" + C.tealDeep),
    networkD:   await iconPng(fa.FaProjectDiagram, "#" + C.tealDeep),
    upT:        await iconPng(fa6.FaArrowTrendUp, "#" + C.tealBright),
    upD:        await iconPng(fa6.FaArrowTrendUp, "#" + C.tealDeep),
    warnT:      await iconPng(fa.FaExclamationTriangle, "#" + C.warn),
    mapD:       await iconPng(md.MdMap, "#" + C.tealDeep),
    mapT:       await iconPng(md.MdMap, "#" + C.tealBright),
    keyD:       await iconPng(fa.FaKey, "#" + C.tealDeep),
    chainD:     await iconPng(fa.FaLink, "#" + C.tealDeep),
    chainT:     await iconPng(fa.FaLink, "#" + C.tealBright),
  };

  // ============================================================
  // SLIDE 1 — Cover
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.darkBg };

    // Eyebrow
    s.addText("VAULX  ·  COLOSSEUM 2026", {
      x: 0, y: 0.55, w: SW, h: 0.4,
      fontFace: "Consolas", fontSize: 12, color: C.tealBright,
      align: "center", charSpacing: 8, margin: 0, bold: true,
    });

    // Wordmark (very large, centered)
    s.addText(vaulxRich(C.cream, C.tealBright, 200, true), {
      x: 0, y: 1.2, w: SW, h: 2.6,
      align: "center", margin: 0,
    });

    // Serif sub-headline
    s.addText("The on-chain credit protocol.", {
      x: 0, y: 3.95, w: SW, h: 0.65,
      fontFace: "Georgia", fontSize: 30, color: C.cream,
      align: "center", margin: 0,
    });

    // Body paragraph
    s.addText("Connecting asset-rich individuals in high-rate markets to yield-seeking global capital — secured by\nverifiable physical luxury collateral with deterministic on-chain liquidation.", {
      x: 1.5, y: 4.75, w: SW - 3.0, h: 1.0,
      fontFace: "Calibri", fontSize: 15, color: C.creamMute,
      align: "center", margin: 0, lineSpacing: 22, italic: true,
    });

    // Mono accent line
    s.addText("All in smart contracts.  Vaulx doesn't take custody.  Vaulx doesn't hold capital.", {
      x: 0, y: 5.85, w: SW, h: 0.4,
      fontFace: "Consolas", fontSize: 13, color: C.tealBright,
      align: "center", margin: 0, bold: true,
    });

    // Footer links
    s.addText("github.com/Vaulxfi   ·   Solana Devnet   ·   Live today", {
      x: 0, y: 6.85, w: SW, h: 0.35,
      fontFace: "Consolas", fontSize: 11, color: C.mute,
      align: "center", margin: 0, charSpacing: 4,
    });

    s.addNotes("Vaulx is the on-chain credit protocol that connects asset-rich individuals in high-rate markets to global onchain capital — secured by verifiable physical luxury collateral with deterministic on-chain liquidation. All in smart contracts. We don't take custody. We don't hold capital. We're live on Solana Devnet today.");
  }

  // ============================================================
  // SLIDE 2 — The Asymmetry
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.darkBg };
    addHeaderMark(s, true);

    // Eyebrow right
    s.addText("01 / THE ASYMMETRY", {
      x: SW - 3.5, y: 0.27, w: 3.0, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealBright,
      align: "right", charSpacing: 6, margin: 0,
    });

    // Title
    s.addText("Asset-rich, credit-trapped — meets capital with nowhere to go.", {
      x: 0.5, y: 0.75, w: SW - 1.0, h: 0.9,
      fontFace: "Georgia", fontSize: 26, bold: true, color: C.cream, margin: 0,
    });

    // ===== LEFT column: 3-tier rate stack =====
    const lX = 0.5, lW = 6.4;
    s.addText("Brazil's credit ladder is broken at every rung.", {
      x: lX, y: 1.85, w: lW, h: 0.4,
      fontFace: "Calibri", fontSize: 14, bold: true, color: C.cream, margin: 0,
    });

    // Persona card
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: lX, y: 2.3, w: lW, h: 0.85,
      fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.06,
    });
    s.addImage({ data: ICO.watchT, x: lX + 0.15, y: 2.45, w: 0.55, h: 0.55 });
    s.addText([
      { text: "Marcelo · São Paulo  ", options: { color: C.cream, bold: true } },
      { text: "·  Rolex Submariner Ref. 116610LN", options: { color: C.creamMute } },
    ], {
      x: lX + 0.85, y: 2.38, w: lW - 0.95, h: 0.3,
      fontFace: "Calibri", fontSize: 11.5, margin: 0,
    });
    s.addText("R$80,000  /  ~$14,000 idle", {
      x: lX + 0.85, y: 2.7, w: lW - 0.95, h: 0.3,
      fontFace: "Consolas", fontSize: 11, color: C.tealBright, margin: 0,
    });

    // 3 tiers worst → best
    const tiers = [
      { label: "PENALTY · WORST CASE", product: "Credit card rotativo (revolving balance)", rate: "~450% APR", rateColor: C.warn },
      { label: "STANDARD CONSUMER CREDIT", product: "General bank lending rate", rate: "~61% APR", rateColor: C.cream },
      { label: "CHEAPEST FORMAL CREDIT", product: "Caixa Federal penhor — only legal pawn institution", rate: "~30% APR  ·  20% LTV", rateColor: C.tealBright },
    ];
    const tY = 3.3, tH = 0.92, tGap = 0.12;
    tiers.forEach((t, i) => {
      const ty = tY + i * (tH + tGap);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: lX, y: ty, w: lW, h: tH,
        fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.06,
      });
      s.addText(t.label, {
        x: lX + 0.25, y: ty + 0.1, w: lW * 0.5 - 0.25, h: 0.28,
        fontFace: "Consolas", fontSize: 9, color: C.tealBright, charSpacing: 4, margin: 0, bold: true,
      });
      s.addText(t.product, {
        x: lX + 0.25, y: ty + 0.4, w: lW * 0.6, h: 0.45,
        fontFace: "Calibri", fontSize: 12, color: C.cream, margin: 0, valign: "top",
      });
      s.addText(t.rate, {
        x: lX + lW * 0.6, y: ty, w: lW * 0.4 - 0.25, h: tH,
        fontFace: "Consolas", fontSize: 14, color: t.rateColor, bold: true,
        align: "right", valign: "middle", margin: 0,
      });
    });

    // Footnotes
    s.addText("Sources: Banco Central do Brasil  ·  Trading Economics  ·  Caixa Federal published rates.\nRotativo applies to credit-card balances carried past the 30-day grace period — the rate that hits ~50M Brazilians.", {
      x: lX, y: 6.5, w: lW, h: 0.6,
      fontFace: "Consolas", fontSize: 9, color: C.mute, italic: true, margin: 0, lineSpacing: 12,
    });

    // ===== Center vertical "NO RAIL" =====
    s.addText("NO  RAIL.", {
      x: 6.95, y: 3.5, w: 0.5, h: 2.2,
      fontFace: "Consolas", fontSize: 14, color: C.tealBright,
      bold: true, align: "center", valign: "middle", margin: 0, charSpacing: 4, rotate: 270,
    });

    // ===== RIGHT column =====
    const rX = 7.55, rW = SW - rX - 0.5;
    s.addText("Onchain institutional capital is the cheapest in the world.\nHe can't reach it.", {
      x: rX, y: 1.85, w: rW, h: 0.65,
      fontFace: "Calibri", fontSize: 14, bold: true, color: C.cream, margin: 0, lineSpacing: 18,
    });

    // Big yield card
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: rX, y: 2.7, w: rW, h: 2.25,
      fill: { color: C.darkCard }, line: { color: C.tealDeep, width: 1.0 }, rectRadius: 0.08,
    });
    s.addText("ONCHAIN USDC CAPITAL  ·  CHEAP  ·  PATIENT  ·  INSTITUTIONAL", {
      x: rX, y: 2.85, w: rW, h: 0.35,
      fontFace: "Consolas", fontSize: 10, color: C.tealBright, charSpacing: 4,
      align: "center", margin: 0,
    });
    s.addText("8–10% APR", {
      x: rX, y: 3.25, w: rW, h: 1.05,
      fontFace: "Georgia", fontSize: 56, bold: true, color: C.cream,
      align: "center", margin: 0,
    });
    s.addText("institutional onchain yield", {
      x: rX, y: 4.3, w: rW, h: 0.3,
      fontFace: "Calibri", fontSize: 12, italic: true, color: C.creamMute,
      align: "center", margin: 0,
    });
    s.addText("Global liquidity offered at single-digit APR.\nNo trustable rail to Marcelo's Rolex.", {
      x: rX, y: 4.55, w: rW, h: 0.5,
      fontFace: "Calibri", fontSize: 11, color: C.creamMute,
      align: "center", margin: 0, italic: true, lineSpacing: 14,
    });

    s.addText("(BTC/ETH-as-collateral exists. Not the use case.)", {
      x: rX, y: 5.1, w: rW, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.mute, align: "center", margin: 0, italic: true,
    });

    // Bottom punchline
    s.addText("Until now.", {
      x: rX, y: 6.0, w: rW, h: 0.55,
      fontFace: "Georgia", fontSize: 28, bold: true, italic: true, color: C.tealBright,
      align: "center", margin: 0,
    });

    s.addNotes("Marcelo lives in São Paulo. He owns a fourteen-thousand-dollar Rolex, but he needs short-term liquidity. His options are fundamentally broken. If his credit card balance revolves, the rotativo penalty rate hits four hundred and fifty percent APR. A standard consumer loan: roughly sixty. The cheapest formal credit option is Caixa Federal penhor — Brazil's only legal pawn institution — at thirty percent APR. But they value his Rolex as literal scrap metal, lending only twenty percent of its value. Meanwhile, on Solana, institutional capital is offered at eight percent — and has no way to reach him. Until now.");
  }

  // ============================================================
  // SLIDE 3 — Protocol Architecture
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.darkBg };
    addHeaderMark(s, true);
    s.addText("02 / ARCHITECTURE", {
      x: SW - 3.5, y: 0.27, w: 3.0, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealBright,
      align: "right", charSpacing: 6, margin: 0,
    });

    s.addText("Modular. Atomic. Composable.", {
      x: 0.5, y: 0.7, w: SW - 1.0, h: 0.6,
      fontFace: "Georgia", fontSize: 30, bold: true, color: C.cream, margin: 0,
    });
    s.addText("Solid blocks ship once. Dashed blocks swap per market. Four Anchor programs in the middle never move.", {
      x: 0.5, y: 1.3, w: SW - 1.0, h: 0.35,
      fontFace: "Calibri", fontSize: 13, italic: true, color: C.creamMute, margin: 0,
    });

    // Off-chain user-side row (3 modules - global)
    const drawModule = (x, y, w, h, num, name, body, isLocal) => {
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x, y, w, h,
        fill: { color: C.darkCard },
        line: { color: isLocal ? C.warn : C.darkBorder, width: 0.75, dashType: isLocal ? "dash" : "solid" },
        rectRadius: 0.06,
      });
      s.addText(num, {
        x: x + 0.15, y: y + 0.1, w: 0.5, h: 0.25,
        fontFace: "Consolas", fontSize: 9, color: isLocal ? C.warn : C.tealBright, bold: true, margin: 0,
      });
      s.addText(isLocal ? "LOCAL" : "GLOBAL", {
        x: x + w - 1.0, y: y + 0.1, w: 0.85, h: 0.25,
        fontFace: "Consolas", fontSize: 8, color: isLocal ? C.warn : C.tealBright,
        align: "right", margin: 0, charSpacing: 3, bold: true,
      });
      s.addText(name, {
        x: x + 0.15, y: y + 0.32, w: w - 0.3, h: 0.32,
        fontFace: "Calibri", fontSize: 12, bold: true, color: C.cream, margin: 0,
      });
      s.addText(body, {
        x: x + 0.15, y: y + 0.62, w: w - 0.3, h: h - 0.7,
        fontFace: "Consolas", fontSize: 9, color: C.creamMute, margin: 0, lineSpacing: 12,
      });
    };

    // Layer 01 user-side
    s.addText("LAYER 01 — OFF-CHAIN · USER-SIDE", {
      x: 0.5, y: 1.78, w: SW - 1.0, h: 0.25,
      fontFace: "Consolas", fontSize: 9, color: C.tealBright, charSpacing: 4, margin: 0, bold: true,
    });
    const userMods = [
      ["A", "Borrower wallet", "Crossmint  ·  1-tap social login\nembedded Solana wallet", false],
      ["B", "KYC self-onboarding", "Sumsub + native SAS (May 2025)\n→ on-chain KycAttestation PDA", false],
      ["C", "Online appraisal", "Vaultik · Chrono24 · WatchCharts\n3-source median  ·  live API", false],
    ];
    const modY1 = 2.05, modH = 1.05;
    const modW = (SW - 1.0 - 0.4) / 3;
    userMods.forEach((m, i) => {
      drawModule(0.5 + i * (modW + 0.2), modY1, modW, modH, m[0], m[1], m[2], m[3]);
    });

    // Layer 01 asset-side
    s.addText("LAYER 01 — OFF-CHAIN · ASSET-SIDE", {
      x: 0.5, y: 3.18, w: SW - 1.0, h: 0.25,
      fontFace: "Consolas", fontSize: 9, color: C.tealBright, charSpacing: 4, margin: 0, bold: true,
    });
    const assetMods = [
      ["D", "Offline appraisal", "Certified appraiser per market\nin-person physical evaluation", true],
      ["E", "Licensed custodian", "Sekuro  ·  Brinks-class /\nLoomis-class network", true],
      ["F", "Global insurance (Lloyd's)", "Lloyd's master policy\ntheft + damage to trustee", false],
    ];
    const modY2 = 3.45;
    assetMods.forEach((m, i) => {
      drawModule(0.5 + i * (modW + 0.2), modY2, modW, modH, m[0], m[1], m[2], m[3]);
    });

    // Anchor band
    const aY = 4.65, aH = 0.85;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.5, y: aY, w: SW - 1.0, h: aH,
      fill: { color: C.tealDeep }, line: { color: C.tealDeep, width: 0 },
    });
    s.addText("ANCHOR PROGRAMS  ·  Solana  ·  4 programs  ·  5 atomic gates  ·  GLOBAL", {
      x: 0.5, y: aY + 0.06, w: SW - 1.0, h: 0.3,
      fontFace: "Consolas", fontSize: 11, color: C.cream, bold: true, charSpacing: 4,
      align: "center", margin: 0,
    });
    s.addText([
      { text: "vault  ·  loan  ·  trdc  ·  auction          ", options: { color: C.cream, bold: true } },
      { text: "G1 Appraisal → G2 Custody → G3 cNFT mint → G4 Borrow → G5 Repay/Default", options: { color: "B7E2DF" } },
    ], {
      x: 0.5, y: aY + 0.4, w: SW - 1.0, h: 0.4,
      fontFace: "Consolas", fontSize: 11, align: "center", margin: 0,
    });

    // Layer 02 on-chain
    s.addText("LAYER 02 — ON-CHAIN  ·  4 modules  ·  ALL GLOBAL", {
      x: 0.5, y: 5.6, w: SW - 1.0, h: 0.25,
      fontFace: "Consolas", fontSize: 9, color: C.tealBright, charSpacing: 4, margin: 0, bold: true,
    });
    const onchainMods = [
      ["G", "cNFT + Oracle", "Bubblegum cNFT  ·  SAS\nPyth + RedStone (multi-oracle)", false],
      ["H", "Curated lending rails", "Kamino V2 + Loopscale USDC\ncomposable curator infra", false],
      ["I", "Vaulx UI + indexer", "Next.js  ·  indexer  ·  bridge\n/admin/demo cockpit", false],
      ["J", "Vaulx Trust (reg co.)", "Regulated counterparty entity\nnoteholder of record", false],
    ];
    const modY3 = 5.88, modW4 = (SW - 1.0 - 3 * 0.18) / 4;
    onchainMods.forEach((m, i) => {
      drawModule(0.5 + i * (modW4 + 0.18), modY3, modW4, 0.95, m[0], m[1], m[2], m[3]);
    });

    // Footer takeaways
    s.addText([
      { text: "▸ 8 of 10 modules ship globally.  ", options: { color: C.tealBright, bold: true } },
      { text: "Only offline appraisal and licensed custodian swap per market — 60–90 days per new country.   ", options: { color: C.creamMute } },
      { text: "▸ Atomic invariant:  ", options: { color: C.tealBright, bold: true } },
      { text: "no USDC disburses until the licensed custodian's keypair signs custody-confirmation atomically. No competitor (Aave · Maple · Centrifuge) ships this on-chain.", options: { color: C.creamMute } },
    ], {
      x: 0.5, y: 6.95, w: SW - 1.0, h: 0.45,
      fontFace: "Consolas", fontSize: 9, margin: 0, lineSpacing: 12,
    });

    s.addNotes("Four Anchor programs — vault, loan, trdc, auction — enforce five atomic gates: appraisal, custody, cNFT mint, borrow, repay or default. The killer line: no USDC disburses until the licensed custodian signs custody-confirmation, atomically, in the same transaction. No competitor has shipped this on-chain. Off-chain: Sumsub KYC with native SAS, online appraisal API, certified offline appraisers, Sekuro plus Brinks-class custody, Lloyd's insurance. On-chain: Kamino and Loopscale curated vaults, Vaulx Trust as noteholder. Eight of ten modules ship globally — only offline appraisal and custody swap per market.");
  }

  // ============================================================
  // SLIDE 4 — Cycle Economics (light)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.lightBg };
    addHeaderMark(s, false);
    s.addText("03 / CYCLE ECONOMICS", {
      x: SW - 4.5, y: 0.27, w: 4.0, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealDeep,
      align: "right", charSpacing: 6, margin: 0,
    });

    s.addText("Vaulx beats every formal credit option in Brazil.", {
      x: 0.5, y: 0.75, w: SW - 1.0, h: 0.7,
      fontFace: "Georgia", fontSize: 30, bold: true, color: C.darkText, margin: 0,
    });
    s.addText("At 24% APR with 50% LTV, Vaulx is cheaper than the cheapest — and lends 2.5× more capital per asset.", {
      x: 0.5, y: 1.45, w: SW - 1.0, h: 0.4,
      fontFace: "Calibri", fontSize: 13, italic: true, color: C.mute, margin: 0,
    });

    // ===== Comparison table =====
    const tableHead = [
      [
        { text: "Option",   options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 12, align: "left",   valign: "middle", fill: { color: C.lightBg }, margin: [0.1, 0.18, 0.1, 0.18] } },
        { text: "APR",      options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 12, align: "center", valign: "middle", fill: { color: C.lightBg }, margin: [0.1, 0.18, 0.1, 0.18] } },
        { text: "LTV",      options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 12, align: "center", valign: "middle", fill: { color: C.lightBg }, margin: [0.1, 0.18, 0.1, 0.18] } },
        { text: "$ borrowable on $14k Rolex", options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 12, align: "center", valign: "middle", fill: { color: C.lightBg }, margin: [0.1, 0.18, 0.1, 0.18] } },
        { text: "12-mo interest cost", options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 12, align: "center", valign: "middle", fill: { color: C.lightBg }, margin: [0.1, 0.18, 0.1, 0.18] } },
      ],
    ];
    const mkCell = (txt, opts = {}) => ({
      text: txt,
      options: {
        fontFace: opts.mono ? "Consolas" : "Calibri",
        fontSize: opts.fontSize || 12,
        color: opts.color || C.mute,
        bold: !!opts.bold,
        align: opts.align || "center",
        valign: "middle",
        fill: { color: opts.fill || C.lightBg },
        margin: [0.1, 0.18, 0.1, 0.18],
      },
    });
    const compRows = [
      [
        mkCell("Credit card rotativo (penalty)", { color: C.darkText, bold: true, align: "left" }),
        mkCell("~450%", { color: C.warn, bold: true, mono: true }),
        mkCell("n/a (unsecured)", { mono: true }),
        mkCell("n/a", { mono: true }),
        mkCell("massive", { color: C.warn, italic: true }),
      ],
      [
        mkCell("General consumer loan", { color: C.darkText, bold: true, align: "left" }),
        mkCell("~61%", { color: C.darkText, bold: true, mono: true }),
        mkCell("n/a (unsecured)", { mono: true }),
        mkCell("n/a", { mono: true }),
        mkCell("~$3,050 on $5k", { mono: true }),
      ],
      [
        mkCell("Caixa penhor (cheapest formal)", { color: C.darkText, bold: true, align: "left" }),
        mkCell("~30%", { color: C.darkText, bold: true, mono: true }),
        mkCell("20% scrap-metal", { mono: true }),
        mkCell("~$2,800", { mono: true }),
        mkCell("~$840 on $2,800", { mono: true }),
      ],
      [
        mkCell("VAULX (2% / month)", { color: C.cream, bold: true, align: "left", fill: C.tealDeep }),
        mkCell("24%", { color: C.cream, bold: true, mono: true, fill: C.tealDeep, fontSize: 14 }),
        mkCell("50% full asset value", { color: C.cream, bold: true, mono: true, fill: C.tealDeep }),
        mkCell("$7,000", { color: C.cream, bold: true, mono: true, fill: C.tealDeep, fontSize: 14 }),
        mkCell("$1,680 on $7,000", { color: C.cream, bold: true, mono: true, fill: C.tealDeep }),
      ],
    ];

    s.addTable([...tableHead, ...compRows], {
      x: 0.5, y: 2.05, w: SW - 1.0,
      colW: [3.4, 1.4, 2.6, 3.0, (SW - 1.0) - 3.4 - 1.4 - 2.6 - 3.0],
      rowH: 0.5,
      border: { type: "solid", pt: 0.5, color: C.lightBorder },
      fontFace: "Calibri",
    });

    // Two headlines
    const hY = 4.7;
    [
      ["Cheaper rate", "than even Caixa penhor (24% vs 30%)"],
      ["2.5× more capital", "per asset (50% LTV vs 20% scrap-metal LTV)"],
    ].forEach((h, i) => {
      const hx = 0.5 + i * ((SW - 1.0) / 2 + 0.1);
      const hw = (SW - 1.0) / 2 - 0.1;
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: hx, y: hY, w: hw, h: 0.55,
        fill: { color: C.lightCard }, line: { color: C.tealDeep, width: 0.75 }, rectRadius: 0.06,
      });
      s.addText([
        { text: "▸  ", options: { color: C.tealDeep } },
        { text: h[0] + "  ", options: { color: C.tealDeep, bold: true } },
        { text: h[1], options: { color: C.darkText } },
      ], {
        x: hx + 0.2, y: hY, w: hw - 0.3, h: 0.55,
        fontFace: "Calibri", fontSize: 12, valign: "middle", margin: 0,
      });
    });

    // Cost-of-credit 3-bucket
    const cY = 5.45;
    s.addText("Cost-of-credit breakdown — 24% all-in", {
      x: 0.5, y: cY, w: SW - 1.0, h: 0.3,
      fontFace: "Calibri", fontSize: 12, bold: true, color: C.tealDeep, margin: 0,
    });
    const cards = [
      { lbl: "COST OF CAPITAL", apr: "8%", body: "LP yield (USDC supplier)" },
      { lbl: "COST OF OPERATIONS", apr: "12%", body: "origination · custody · insurance · servicing · curator" },
      { lbl: "COST OF RISK", apr: "4%", body: "protocol first-loss buffer + risk margin" },
      { lbl: "BORROWER ALL-IN", apr: "24%", body: "2% / month — beats Caixa penhor", highlight: true },
    ];
    const cW = (SW - 1.0 - 0.3) / 4, cH = 1.0;
    cards.forEach((c, i) => {
      const cx = 0.5 + i * (cW + 0.1);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: cY + 0.4, w: cW, h: cH,
        fill: { color: c.highlight ? C.tealDeep : C.lightCard },
        line: { color: c.highlight ? C.tealDeep : C.lightBorder, width: 0.75 },
        rectRadius: 0.06,
      });
      const fg = c.highlight ? C.cream : C.darkText;
      s.addText(c.lbl, {
        x: cx + 0.15, y: cY + 0.5, w: cW - 0.3, h: 0.25,
        fontFace: "Consolas", fontSize: 9, color: c.highlight ? C.cream : C.tealDeep, charSpacing: 4, margin: 0, bold: true,
      });
      s.addText(c.apr, {
        x: cx + 0.15, y: cY + 0.7, w: cW - 0.3, h: 0.45,
        fontFace: "Georgia", fontSize: 26, bold: true, color: fg, margin: 0,
      });
      s.addText(c.body, {
        x: cx + 0.15, y: cY + 1.18, w: cW - 0.3, h: 0.25,
        fontFace: "Calibri", fontSize: 9.5, color: c.highlight ? C.cream : C.mute, margin: 0,
      });
    });

    // Bottom strip - economic summary
    const eY = 6.95;
    s.addText([
      { text: "BORROWER ALL-IN ",   options: { color: C.tealDeep, bold: true } },
      { text: "24% APR     ·     ", options: { color: C.darkText, bold: true } },
      { text: "VAULX REVENUE/ASSET ", options: { color: C.tealDeep, bold: true } },
      { text: "$300–600/yr     ·     ", options: { color: C.darkText, bold: true } },
      { text: "LP NET (POST EL) ",   options: { color: C.tealDeep, bold: true } },
      { text: "~5% APR insured",     options: { color: C.darkText, bold: true } },
    ], {
      x: 0.5, y: eY, w: SW - 1.0, h: 0.4,
      fontFace: "Consolas", fontSize: 9, charSpacing: 1, margin: 0, align: "center", valign: "middle",
    });

    s.addNotes("One year of credit, four options on the table. Brazilian rotativo penalty rate: four hundred and fifty percent. Standard bank lending: sixty-one. Caixa penhor — Brazil's cheapest formal credit — thirty percent at twenty-percent LTV, valuing Marcelo's Rolex as scrap metal. Vaulx: twenty-four percent at fifty-percent LTV against full market value. Cheaper than Brazil's cheapest formal credit, and two-and-a-half times more capital per asset. Three buckets: eight percent cost of capital, twelve percent cost of operations, four percent cost of risk. Vaulx earns three to six hundred dollars per asset per year. Lender nets five percent, collateralized and insured.");
  }

  // ============================================================
  // SLIDE 5 — Risk + LP Tranches (light)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.lightBg };
    addHeaderMark(s, false);
    s.addText("04 / RISK · LIQUIDATION · LP TRANCHES", {
      x: SW - 5.5, y: 0.27, w: 5.0, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealDeep,
      align: "right", charSpacing: 6, margin: 0,
    });

    s.addText("Risk is tiered. Default is choreographed.", {
      x: 0.5, y: 0.75, w: SW - 1.0, h: 0.6,
      fontFace: "Georgia", fontSize: 30, bold: true, color: C.darkText, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 0.5, y: 1.4, w: 0.9, h: 0, line: { color: C.tealDeep, width: 1.5 } });

    // 3 columns
    const colY = 1.6;
    const colW = (SW - 1.0 - 0.4) / 3;
    const cols = [
      { x: 0.5,                     title: "LTV by asset class" },
      { x: 0.5 + colW + 0.2,        title: "14-day Dutch auction" },
      { x: 0.5 + 2 * (colW + 0.2),  title: "LP tranche structure" },
    ];
    cols.forEach(c => {
      s.addText(c.title, {
        x: c.x, y: colY, w: colW, h: 0.4,
        fontFace: "Calibri", fontSize: 14, bold: true, color: C.tealDeep, margin: 0,
      });
    });

    // LEFT: LTV table
    const ltvData = [
      [{ text: "Asset class", options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 10, valign: "middle", fill: { color: C.lightBg }, margin: [0.08, 0.12, 0.08, 0.12] } },
       { text: "Origination", options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 10, align: "center", valign: "middle", fill: { color: C.lightBg }, margin: [0.08, 0.08, 0.08, 0.08] } },
       { text: "Liquidation", options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 10, align: "center", valign: "middle", fill: { color: C.lightBg }, margin: [0.08, 0.08, 0.08, 0.08] } }],
      [{ text: "Steel sport watches", options: { color: C.darkText, fontFace: "Calibri", fontSize: 11, valign: "middle", margin: [0.08, 0.12, 0.08, 0.12] } },
       { text: "50%", options: { color: C.darkText, bold: true, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } },
       { text: "70%", options: { color: C.mute, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } }],
      [{ text: "Gold / precious watches", options: { color: C.darkText, fontFace: "Calibri", fontSize: 11, valign: "middle", margin: [0.08, 0.12, 0.08, 0.12] } },
       { text: "40%", options: { color: C.darkText, bold: true, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } },
       { text: "60%", options: { color: C.mute, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } }],
      [{ text: "Handbags (Hermès, Chanel)", options: { color: C.darkText, fontFace: "Calibri", fontSize: 11, valign: "middle", margin: [0.08, 0.12, 0.08, 0.12] } },
       { text: "35%", options: { color: C.darkText, bold: true, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } },
       { text: "55%", options: { color: C.mute, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } }],
      [{ text: "Art / one-offs (Phase 2)", options: { color: C.mute, italic: true, fontFace: "Calibri", fontSize: 11, valign: "middle", margin: [0.08, 0.12, 0.08, 0.12] } },
       { text: "25%", options: { color: C.mute, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } },
       { text: "45%", options: { color: C.mute, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } }],
    ];
    s.addTable(ltvData, {
      x: cols[0].x, y: colY + 0.4, w: colW,
      colW: [colW * 0.5, colW * 0.25, colW * 0.25],
      rowH: 0.42,
      border: { type: "solid", pt: 0.5, color: C.lightBorder },
    });

    // MIDDLE: Dutch auction timeline
    const aucSteps = [
      ["T+0",  "Margin call", "24h to top up via USDC or Pix"],
      ["T+1",  "Tier 1 — Pool LPs", "Last-appraisal floor"],
      ["T+3",  "Tier 2 — Resellers", "Authorized resellers + governance"],
      ["T+7",  "Tier 3 — Open auction", "Dutch decay onchain"],
      ["T+14", "Tier 4 — Backstop", "Offline auction · 70% reserve"],
    ];
    let aY = colY + 0.45;
    aucSteps.forEach((st, i) => {
      const ax = cols[1].x;
      s.addText(st[0], {
        x: ax, y: aY, w: 0.7, h: 0.4,
        fontFace: "Consolas", fontSize: 11, bold: true, color: C.tealDeep, valign: "middle", margin: 0,
      });
      s.addText(st[1], {
        x: ax + 0.7, y: aY, w: colW - 0.7, h: 0.22,
        fontFace: "Calibri", fontSize: 11, bold: true, color: C.darkText, valign: "top", margin: 0,
      });
      s.addText(st[2], {
        x: ax + 0.7, y: aY + 0.2, w: colW - 0.7, h: 0.22,
        fontFace: "Calibri", fontSize: 9.5, color: C.mute, valign: "top", margin: 0,
      });
      if (i < aucSteps.length - 1) {
        s.addShape(p.shapes.LINE, {
          x: ax, y: aY + 0.45, w: colW, h: 0,
          line: { color: C.lightBorder, width: 0.5 },
        });
      }
      aY += 0.5;
    });

    // RIGHT: LP tranches
    const trancheData = [
      [{ text: "Tranche", options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 10, valign: "middle", fill: { color: C.lightBg }, margin: [0.08, 0.12, 0.08, 0.12] } },
       { text: "Yield", options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 10, align: "center", valign: "middle", fill: { color: C.lightBg }, margin: [0.08, 0.08, 0.08, 0.08] } },
       { text: "Share", options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 10, align: "center", valign: "middle", fill: { color: C.lightBg }, margin: [0.08, 0.08, 0.08, 0.08] } }],
      [{ text: "Senior", options: { color: C.darkText, bold: true, fontFace: "Calibri", fontSize: 11, valign: "middle", margin: [0.08, 0.12, 0.08, 0.12] } },
       { text: "8% APR fixed", options: { color: C.tealDeep, bold: true, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } },
       { text: "~75%", options: { color: C.darkText, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } }],
      [{ text: "Junior", options: { color: C.darkText, bold: true, fontFace: "Calibri", fontSize: 11, valign: "middle", margin: [0.08, 0.12, 0.08, 0.12] } },
       { text: "12% APR fixed", options: { color: C.tealDeep, bold: true, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } },
       { text: "~25%", options: { color: C.darkText, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.08, 0.08, 0.08] } }],
      [{ text: "POL first-loss buffer", options: { color: C.cream, bold: true, fontFace: "Calibri", fontSize: 11, valign: "middle", fill: { color: C.tealDeep }, margin: [0.08, 0.12, 0.08, 0.12] } },
       { text: "protocol-owned", options: { color: C.cream, fontFace: "Consolas", fontSize: 10, align: "center", valign: "middle", fill: { color: C.tealDeep }, margin: [0.08, 0.08, 0.08, 0.08] } },
       { text: "5% / loan", options: { color: C.cream, bold: true, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", fill: { color: C.tealDeep }, margin: [0.08, 0.08, 0.08, 0.08] } }],
    ];
    s.addTable(trancheData, {
      x: cols[2].x, y: colY + 0.4, w: colW,
      colW: [colW * 0.45, colW * 0.32, colW * 0.23],
      rowH: 0.5,
      border: { type: "solid", pt: 0.5, color: C.lightBorder },
    });
    s.addText("Senior beats Maple syrupUSDC (~7%) by 100 bps — backed by physical collateral + insurance + 5% POL.", {
      x: cols[2].x, y: colY + 2.5, w: colW, h: 0.5,
      fontFace: "Calibri", fontSize: 10, italic: true, color: C.mute, margin: 0, lineSpacing: 13,
    });

    // Loss waterfall band
    const wY = 6.05;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y: wY, w: SW - 1.0, h: 1.05,
      fill: { color: C.lightCard }, line: { color: C.tealDeep, width: 1.0 }, rectRadius: 0.08,
    });
    s.addText("LOSS WATERFALL", {
      x: 0.7, y: wY + 0.12, w: 5, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealDeep, charSpacing: 4, bold: true, margin: 0,
    });
    s.addText([
      { text: "Borrower equity", options: { color: C.darkText, bold: true } },
      { text: "  →  ", options: { color: C.tealDeep } },
      { text: "POL first-loss buffer", options: { color: C.darkText, bold: true } },
      { text: "  →  ", options: { color: C.tealDeep } },
      { text: "Junior LP tranche", options: { color: C.darkText, bold: true } },
      { text: "  →  ", options: { color: C.tealDeep } },
      { text: "Senior LP tranche", options: { color: C.darkText, bold: true } },
    ], {
      x: 0.7, y: wY + 0.4, w: SW - 1.4, h: 0.45,
      fontFace: "Calibri", fontSize: 14, valign: "middle", margin: 0,
    });
    s.addText("Insurance covers theft & damage to trustee — never default risk.", {
      x: 0.7, y: wY + 0.78, w: SW - 1.4, h: 0.28,
      fontFace: "Calibri", fontSize: 11, italic: true, color: C.mute, margin: 0,
    });

    s.addNotes("Risk is tiered. Steel sport watches at fifty-percent LTV, lower thresholds for thinner secondary markets, art excluded from launch. On default, the borrower has twenty-four hours to top up. After that, a fourteen-day Dutch auction runs in four tiers — lenders first, authorized resellers, open market, offline auction house backstop at seventy percent reserve. The LP layer is tranched: senior LPs earn eight percent fixed APR, junior LPs earn twelve percent and absorb first losses above our protocol-owned five-percent buffer. Senior beats Maple by a hundred basis points. Insurance covers theft and damage to the trustee — never default risk.");
  }

  // ============================================================
  // SLIDE 6 — Why Solana & Why Now (dark)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.darkBg };
    addHeaderMark(s, true);
    s.addText("05 / WHY SOLANA · WHY NOW", {
      x: SW - 5.0, y: 0.27, w: 4.5, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealBright,
      align: "right", charSpacing: 6, margin: 0,
    });

    s.addText("Three primitives. Four signals. One window.", {
      x: 0.5, y: 0.75, w: SW - 1.0, h: 0.65,
      fontFace: "Georgia", fontSize: 30, bold: true, color: C.cream, margin: 0,
    });
    s.addText("None of this stack existed 18 months ago. Institutional money is moving onchain — on Solana — this quarter.", {
      x: 0.5, y: 1.4, w: SW - 1.0, h: 0.4,
      fontFace: "Calibri", fontSize: 13, italic: true, color: C.creamMute, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 0.5, y: 1.85, w: 1.0, h: 0, line: { color: C.tealBright, width: 1.5 } });

    // Top row — 3 primitives
    s.addText("WHY SOLANA — three primitives", {
      x: 0.5, y: 2.05, w: SW - 1.0, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealBright, charSpacing: 4, margin: 0, bold: true,
    });
    const prims = [
      { icon: ICO.tagD, title: "cNFT (Bubblegum)", num: "~$0.0005",  numLbl: "per mint",            sub: "Luxury class scales globally" },
      { icon: ICO.keyD, title: "SAS",              num: "1×",        numLbl: "verified, read everywhere", sub: "Reusable on-chain KYC" },
      { icon: ICO.layersD, title: "Composability", num: "Anchor CPI", numLbl: "→ Kamino + Loopscale", sub: "We originate. They run lending markets." },
    ];
    const pY = 2.4, pH = 1.7;
    const pW = (SW - 1.0 - 0.4) / 3;
    prims.forEach((pr, i) => {
      const px = 0.5 + i * (pW + 0.2);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: px, y: pY, w: pW, h: pH,
        fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.06,
      });
      s.addText(pr.title, {
        x: px + 0.25, y: pY + 0.18, w: pW - 0.5, h: 0.35,
        fontFace: "Calibri", fontSize: 13, bold: true, color: C.tealBright, margin: 0,
      });
      s.addText(pr.num, {
        x: px + 0.25, y: pY + 0.55, w: pW - 0.5, h: 0.55,
        fontFace: "Georgia", fontSize: 24, bold: true, color: C.cream, margin: 0,
      });
      s.addText(pr.numLbl, {
        x: px + 0.25, y: pY + 1.05, w: pW - 0.5, h: 0.3,
        fontFace: "Consolas", fontSize: 10, color: C.creamMute, margin: 0,
      });
      s.addText(pr.sub, {
        x: px + 0.25, y: pY + 1.32, w: pW - 0.5, h: 0.32,
        fontFace: "Calibri", fontSize: 11, italic: true, color: C.creamMute, margin: 0,
      });
    });

    // Bottom row — 4 signals
    s.addText("WHY NOW — four institutional adoption signals on Solana", {
      x: 0.5, y: 4.25, w: SW - 1.0, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealBright, charSpacing: 4, margin: 0, bold: true,
    });
    const sigs = [
      { lbl: "RWA TVL ON SOLANA",  big: "$1.82B",  ctx: "Mar 2026 · +90% MoM",         body: "3rd-largest RWA chain" },
      { lbl: "WESTERN UNION",      big: "USDPT",   ctx: "Launched May 2026",            body: "Anchorage Digital · 40+ countries" },
      { lbl: "PAYMENTS GIANTS",    big: "Visa · Stripe", ctx: "PayPal · Fiserv",        body: "Production stablecoin workflows" },
      { lbl: "TOKENIZED FUNDS",    big: "BUIDL · FOBXX", ctx: "BlackRock · Franklin",    body: "$2.3B+ AUM live on Solana" },
    ];
    const sY = 4.6, sH = 1.7;
    const sW = (SW - 1.0 - 0.45) / 4;
    sigs.forEach((sg, i) => {
      const sx = 0.5 + i * (sW + 0.15);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: sx, y: sY, w: sW, h: sH,
        fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.06,
      });
      s.addText(sg.lbl, {
        x: sx + 0.18, y: sY + 0.15, w: sW - 0.36, h: 0.3,
        fontFace: "Consolas", fontSize: 9, color: C.tealBright, charSpacing: 3, bold: true, margin: 0,
      });
      s.addText(sg.big, {
        x: sx + 0.18, y: sY + 0.45, w: sW - 0.36, h: 0.55,
        fontFace: "Georgia", fontSize: 22, bold: true, color: C.cream, margin: 0,
      });
      s.addText(sg.ctx, {
        x: sx + 0.18, y: sY + 1.0, w: sW - 0.36, h: 0.3,
        fontFace: "Consolas", fontSize: 10, color: C.creamMute, margin: 0,
      });
      s.addText(sg.body, {
        x: sx + 0.18, y: sY + 1.32, w: sW - 0.36, h: 0.32,
        fontFace: "Calibri", fontSize: 10, italic: true, color: C.creamMute, margin: 0,
      });
    });

    // Footer thesis
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y: 6.5, w: SW - 1.0, h: 0.65,
      fill: { color: C.darkCard }, line: { color: C.tealDeep, width: 1.0 }, rectRadius: 0.06,
    });
    s.addText([
      { text: "Atomic transactions enforce every gate in one signature.  ", options: { color: C.tealBright, bold: true } },
      { text: "Institutional rails moved onto Solana. We move physical luxury onto them.", options: { color: C.cream } },
    ], {
      x: 0.5, y: 6.5, w: SW - 1.0, h: 0.65,
      fontFace: "Calibri", fontSize: 13, italic: true, align: "center", valign: "middle", margin: 0,
    });

    s.addNotes("Why Solana, why now. RWA tokenization on Solana hit one-point-eight-two billion in March — ninety percent month-over-month growth. Western Union launched USDPT on Solana this month. Visa, Stripe, PayPal, Fiserv all running production stablecoin workflows. BlackRock and Franklin Templeton tokenized money funds live. Compressed NFTs at a fraction of a cent. Sumsub's native Solana Attestations Service integration last May. None of this stack existed eighteen months ago. The institutional rails moved onto Solana. We move physical luxury onto them.");
  }

  // ============================================================
  // SLIDE 7 — Market & Addressable (light)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.lightBg };
    addHeaderMark(s, false);
    s.addText("06 / MARKET · ADDRESSABLE", {
      x: SW - 5.0, y: 0.27, w: 4.5, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealDeep,
      align: "right", charSpacing: 6, margin: 0,
    });

    s.addText("Where credit is expensive, luxury collateral is everywhere.", {
      x: 0.5, y: 0.7, w: SW - 1.0, h: 0.8,
      fontFace: "Georgia", fontSize: 26, bold: true, color: C.darkText, margin: 0,
    });

    // Hero funnel band — 3 numbers
    const fY = 1.7, fH = 1.65;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y: fY, w: SW - 1.0, h: fH,
      fill: { color: C.lightCard }, line: { color: C.lightBorder, width: 0.75 }, rectRadius: 0.08,
    });
    const funnel = [
      { num: "$90B",  lbl: "WATCHES IN PRIVATE HANDS",   ctx: "High-credit-cost markets:\nBR · MX · TR · IN · SEA · ZA · NG" },
      { num: "$20B",  lbl: "REALISTICALLY ADDRESSABLE",  ctx: "Owner willingness × asset eligibility,\n5-yr horizon" },
      { num: "$1–3B", lbl: "YEAR-5 ORIGINATION TARGET",  ctx: "1–5% capture of the\naddressable pool" },
    ];
    const fW = (SW - 1.0) / 3;
    funnel.forEach((f, i) => {
      const fx = 0.5 + i * fW;
      if (i > 0) {
        s.addShape(p.shapes.LINE, {
          x: fx, y: fY + 0.2, w: 0, h: fH - 0.4,
          line: { color: C.lightBorder, width: 0.5 },
        });
      }
      s.addText(f.num, {
        x: fx, y: fY + 0.15, w: fW, h: 0.7,
        fontFace: "Georgia", fontSize: 38, bold: true, color: C.tealDeep, align: "center", margin: 0,
      });
      s.addText(f.lbl, {
        x: fx, y: fY + 0.85, w: fW, h: 0.3,
        fontFace: "Consolas", fontSize: 10, color: C.darkText, charSpacing: 3, bold: true, align: "center", margin: 0,
      });
      s.addText(f.ctx, {
        x: fx + 0.2, y: fY + 1.15, w: fW - 0.4, h: 0.45,
        fontFace: "Calibri", fontSize: 10, italic: true, color: C.mute, align: "center", margin: 0, lineSpacing: 13,
      });
    });
    s.addText("Bottom-up.  Source: Bain Luxury Goods Worldwide 2024  ·  Morgan Stanley Watches estimates  ·  Vaulx analysis.", {
      x: 0.5, y: fY + fH + 0.05, w: SW - 1.0, h: 0.3,
      fontFace: "Consolas", fontSize: 9, color: C.mute, italic: true, align: "center", margin: 0,
    });

    // Country table
    const cY = 3.85;
    s.addText("Global markets — one protocol stack", {
      x: 0.5, y: cY, w: SW - 1.0, h: 0.3,
      fontFace: "Calibri", fontSize: 13, bold: true, color: C.tealDeep, margin: 0,
    });

    const ctyRows = [
      ["Brazil",            "~400%",     "Pix"],
      ["Mexico",            "~80%",      "SPEI"],
      ["Turkey",            "~70%",      "FAST"],
      ["India",             "~40%",      "UPI"],
      ["SE Asia (ID/PH/VN)","~30–45%",   "Local rails"],
      ["USA (boutique)",    "credit-invisible HNW", "ACH / wire"],
    ];
    const tdata = [
      [
        { text: "Market",         options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 11, valign: "middle", fill: { color: C.lightBg }, margin: [0.08, 0.15, 0.08, 0.15] } },
        { text: "Credit card APR",options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 11, align: "center", valign: "middle", fill: { color: C.lightBg }, margin: [0.08, 0.15, 0.08, 0.15] } },
        { text: "Local rail",     options: { color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 11, align: "center", valign: "middle", fill: { color: C.lightBg }, margin: [0.08, 0.15, 0.08, 0.15] } },
      ],
      ...ctyRows.map(r => ([
        { text: r[0], options: { color: C.darkText, bold: true, fontFace: "Calibri", fontSize: 11, valign: "middle", margin: [0.08, 0.15, 0.08, 0.15] } },
        { text: r[1], options: { color: r[1].startsWith("~") && parseInt(r[1].replace(/[^\d]/g, "")) > 100 ? C.warn : C.darkText, bold: true, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.15, 0.08, 0.15] } },
        { text: r[2], options: { color: C.mute, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", margin: [0.08, 0.15, 0.08, 0.15] } },
      ])),
    ];
    s.addTable(tdata, {
      x: 0.5, y: cY + 0.35, w: 6.5,
      colW: [3.0, 2.0, 1.5],
      rowH: 0.36,
      border: { type: "solid", pt: 0.5, color: C.lightBorder },
    });
    s.addText("Each market shares the same Solana protocol stack. Local modules swap in 60–90 days.", {
      x: 0.5, y: cY + 3.0, w: 6.5, h: 0.32,
      fontFace: "Calibri", fontSize: 11, italic: true, color: C.mute, margin: 0,
    });

    // Right: partner strip + punchline
    const rX = 7.3, rW = SW - rX - 0.5;
    s.addText("PARTNERS — SIGNED OR IN ACTIVE DISCUSSION", {
      x: rX, y: cY, w: rW, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealDeep, charSpacing: 4, bold: true, margin: 0,
    });
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: rX, y: cY + 0.35, w: rW, h: 1.6,
      fill: { color: C.lightCard }, line: { color: C.lightBorder, width: 0.75 }, rectRadius: 0.06,
    });
    const partners = [
      "Sekuro", "Brinks-class", "Lloyd's",
      "Vaultik", "Sumsub",
      "Kamino V2", "Loopscale",
      "Mercado Bitcoin", "Transfero",
      "Vaulx Trust",
    ];
    s.addText(partners.join("   ·   "), {
      x: rX + 0.2, y: cY + 0.45, w: rW - 0.4, h: 1.4,
      fontFace: "Calibri", fontSize: 12, color: C.darkText, valign: "middle", align: "center", margin: 0, lineSpacing: 22,
    });

    // Punchline block
    const qY = cY + 2.1;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: rX, y: qY, w: rW, h: 1.2,
      fill: { color: C.tealDeep }, line: { color: C.tealDeep, width: 0 }, rectRadius: 0.08,
    });
    s.addText("Caixa values your Patek Philippe as scrap metal.\nWe value it as a Patek Philippe.", {
      x: rX + 0.25, y: qY, w: rW - 0.5, h: 1.2,
      fontFace: "Georgia", fontSize: 16, bold: true, italic: true, color: C.cream,
      align: "center", valign: "middle", margin: 0, lineSpacing: 22,
    });

    s.addNotes("Where credit is expensive, luxury collateral is everywhere. Ninety billion dollars in private-hand luxury watches across high-cost-credit markets — twenty billion realistically addressable, one-to-three billion year-five originations. Each market shares the same Solana stack — only custody swaps per country. Sekuro, Sumsub, Kamino, Loopscale, Mercado Bitcoin, Transfero — in active discussions. Caixa values your Patek as scrap metal. We don't.");
  }

  // ============================================================
  // SLIDE 8 — Competitive Landscape (light)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.lightBg };
    addHeaderMark(s, false);
    s.addText("07 / COMPETITIVE LANDSCAPE", {
      x: SW - 5.0, y: 0.27, w: 4.5, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealDeep,
      align: "right", charSpacing: 6, margin: 0,
    });

    s.addText("We're not first. We're built for a different market.", {
      x: 0.5, y: 0.75, w: SW - 1.0, h: 0.6,
      fontFace: "Georgia", fontSize: 30, bold: true, color: C.darkText, margin: 0,
    });
    s.addText("Where we fit. What we don't do.", {
      x: 0.5, y: 1.35, w: SW - 1.0, h: 0.32,
      fontFace: "Calibri", fontSize: 13, italic: true, color: C.mute, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 0.5, y: 1.7, w: 1.0, h: 0, line: { color: C.tealDeep, width: 1.5 } });

    // Comp matrix
    const headers = ["Player", "Asset class", "Chain", "Custody", "Geography", "Status / traction"];
    const rows = [
      ["Kettle Finance",     "Watches",          "Blast L2",         "Own NYC vault",        "US-first",                          "$4M raised · $20M GMV · $6M loans · live"],
      ["4K Protocol",        "Physical luxury",  "Ethereum / Polygon","Own Guardians",        "Global",                            "Live · Rolex DeFi loans via Arcade"],
      ["Tangible",           "RE + watches",     "Polygon",          "Various SPVs",         "Global",                            "Live · USDR collapsed 2023"],
      ["Arcade.xyz",         "Wrapped NFTs",     "Ethereum",         "n/a (digital)",        "Global",                            "$1B/mo NFT lending"],
      ["Caixa Federal (legacy)", "Anything",     "—",                "Bank vault",           "Brazil",                            "30% APR · scrap-metal pricing"],
    ];

    const tableData = [
      headers.map((h, i) => ({
        text: h, options: {
          color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 11,
          align: i === 0 ? "left" : "center", valign: "middle",
          fill: { color: C.lightBg }, margin: [0.08, 0.15, 0.08, 0.15],
        },
      })),
      ...rows.map((r, ri) => r.map((c, ci) => ({
        text: c, options: {
          color: ri === 4 ? C.mute : (ci === 0 ? C.darkText : C.mute),
          bold: ci === 0 && ri !== 4,
          italic: ri === 4 && ci === 0,
          strike: ri === 4 && ci === 0,
          fontFace: ci >= 1 && ci <= 4 ? "Consolas" : "Calibri",
          fontSize: 10.5,
          align: ci === 0 ? "left" : "center",
          valign: "middle",
          margin: [0.08, 0.12, 0.08, 0.12],
        },
      }))),
      // VAULX row
      [
        { text: "Vaulx", options: { color: C.cream, bold: true, fontFace: "Calibri", fontSize: 12, align: "left", valign: "middle", fill: { color: C.tealDeep }, margin: [0.08, 0.15, 0.08, 0.15] } },
        { text: "Luxury physical", options: { color: C.cream, bold: true, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", fill: { color: C.tealDeep }, margin: [0.08, 0.12, 0.08, 0.12] } },
        { text: "Solana", options: { color: C.cream, bold: true, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", fill: { color: C.tealDeep }, margin: [0.08, 0.12, 0.08, 0.12] } },
        { text: "Independent · licensed", options: { color: C.cream, bold: true, fontFace: "Consolas", fontSize: 10.5, align: "center", valign: "middle", fill: { color: C.tealDeep }, margin: [0.08, 0.12, 0.08, 0.12] } },
        { text: "BR → LATAM-first", options: { color: C.cream, bold: true, fontFace: "Consolas", fontSize: 11, align: "center", valign: "middle", fill: { color: C.tealDeep }, margin: [0.08, 0.12, 0.08, 0.12] } },
        { text: "Devnet live · mainnet Q3 2026 · 50/100 loans", options: { color: C.cream, bold: true, fontFace: "Consolas", fontSize: 10.5, align: "center", valign: "middle", fill: { color: C.tealDeep }, margin: [0.08, 0.12, 0.08, 0.12] } },
      ],
    ];
    s.addTable(tableData, {
      x: 0.5, y: 1.95, w: SW - 1.0,
      colW: [2.0, 2.1, 1.6, 2.3, 2.2, (SW - 1.0) - 2.0 - 2.1 - 1.6 - 2.3 - 2.2],
      rowH: 0.45,
      border: { type: "solid", pt: 0.5, color: C.lightBorder },
    });

    // Unoccupied vertex
    const vY = 5.2;
    s.addText("THE UNOCCUPIED VERTEX", {
      x: 0.5, y: vY, w: SW - 1.0, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealDeep, charSpacing: 4, bold: true, margin: 0,
    });
    const verts = [
      { lbl: "Chain",        body: "Solana — economics, not just narrative" },
      { lbl: "Geography",    body: "LATAM-first — where credit costs 60–400%" },
      { lbl: "Architecture", body: "Composable — not closed marketplace" },
      { lbl: "Issuance",     body: "Joint with regulated local partner" },
    ];
    const vW = (SW - 1.0 - 0.45) / 4, vH = 1.45;
    verts.forEach((v, i) => {
      const vx = 0.5 + i * (vW + 0.15);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: vx, y: vY + 0.4, w: vW, h: vH,
        fill: { color: C.lightCard }, line: { color: C.tealDeep, width: 1.0 }, rectRadius: 0.06,
      });
      s.addText(v.lbl.toUpperCase(), {
        x: vx + 0.18, y: vY + 0.55, w: vW - 0.36, h: 0.3,
        fontFace: "Consolas", fontSize: 9, color: C.tealDeep, charSpacing: 4, bold: true, margin: 0,
      });
      s.addText(v.body, {
        x: vx + 0.18, y: vY + 0.85, w: vW - 0.36, h: 0.85,
        fontFace: "Calibri", fontSize: 12, color: C.darkText, margin: 0, lineSpacing: 18,
      });
    });

    s.addText("Vaulx sits in that vertex.", {
      x: 0.5, y: 7.05, w: SW - 1.0, h: 0.32,
      fontFace: "Georgia", fontSize: 14, italic: true, bold: true, color: C.tealDeep,
      align: "center", margin: 0,
    });

    s.addNotes("We're not first. We're built for a different market. Kettle, 4K, Tangible, Arcade — all live, none on Solana, none LATAM-first, none composable with mature lending markets. Caixa pawns at scrap-metal pricing. The unoccupied vertex: Solana economics, LATAM-first geography, composable architecture, joint regulated-local issuance. Vaulx sits in that vertex.");
  }

  // ============================================================
  // SLIDE 9 — Team (light)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.lightBg };
    addHeaderMark(s, false);
    s.addText("08 / TEAM", {
      x: SW - 3.0, y: 0.27, w: 2.5, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealDeep,
      align: "right", charSpacing: 6, margin: 0,
    });

    s.addText("Five founders. Five non-overlapping axes.", {
      x: 0.5, y: 0.75, w: SW - 1.0, h: 0.6,
      fontFace: "Georgia", fontSize: 30, bold: true, color: C.darkText, margin: 0,
    });
    s.addText("No competitor can assemble this team.", {
      x: 0.5, y: 1.35, w: SW - 1.0, h: 0.32,
      fontFace: "Calibri", fontSize: 13, italic: true, color: C.mute, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 0.5, y: 1.7, w: 1.0, h: 0, line: { color: C.tealDeep, width: 1.5 } });

    const team = [
      {
        icon: ICO.shieldD, name: "George Dimitrov", role: "CEO / CTO", tag: "15+ yrs · Banking",
        body: "Global banking & financial operations · institutional & regulatory affairs.",
        owns: "Vaulx is corporate-grade across business, governance, legal, compliance, tech.",
      },
      {
        icon: ICO.cogD, name: "Marcelo", role: "COO", tag: "38 yrs · Gitel.com.br",
        body: "Runs Gitel — 38 yrs of Brazilian electronic-security infrastructure: CCTV, IoT, access control, NOC.",
        owns: "The exact tech stack behind Vaulx's atomic custody invariant.",
      },
      {
        icon: ICO.handD, name: "Rodrigo", role: "Partnerships & BD", tag: "BR + LATAM",
        body: "Proven networking and BD across Brazil and LATAM.",
        owns: "Mercado Bitcoin and other BR partnerships — local compliance + adoption + growth.",
      },
      {
        icon: ICO.codeD, name: "Edson", role: "Senior Solana Engineer", tag: "Anchor · Pyth",
        body: "All on-chain and protocol-level engineering.",
        owns: "Shipped 4 Anchor programs across Phase 1–3: vault · loan · trdc · auction.",
      },
      {
        icon: ICO.networkD, name: "Felipe", role: "DeFi & Community Advisor", tag: "CEO · 4p.finance",
        body: "Brings 4p.finance: existing crypto-native luxury-watch flow in São Paulo.",
        owns: "Advises on DeFi partnerships and community across US + Brazil.",
      },
    ];
    const tY = 1.95, tH = 3.5;
    const tW = (SW - 1.0 - 4 * 0.18) / 5;
    team.forEach((m, i) => {
      const tx = 0.5 + i * (tW + 0.18);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: tx, y: tY, w: tW, h: tH,
        fill: { color: C.lightCard }, line: { color: C.lightBorder, width: 0.75 }, rectRadius: 0.06,
      });
      // Avatar circle
      s.addShape(p.shapes.OVAL, {
        x: tx + tW/2 - 0.5, y: tY + 0.25, w: 1.0, h: 1.0,
        fill: { color: C.lightBg }, line: { color: C.lightBorder, width: 0.75 },
      });
      s.addImage({ data: m.icon, x: tx + tW/2 - 0.32, y: tY + 0.43, w: 0.64, h: 0.64 });
      s.addText(m.name, {
        x: tx + 0.15, y: tY + 1.4, w: tW - 0.3, h: 0.35,
        fontFace: "Georgia", fontSize: 14, bold: true, color: C.darkText, margin: 0,
      });
      s.addText(m.role, {
        x: tx + 0.15, y: tY + 1.72, w: tW - 0.3, h: 0.3,
        fontFace: "Calibri", fontSize: 11, bold: true, color: C.tealDeep, margin: 0,
      });
      s.addText(m.tag, {
        x: tx + 0.15, y: tY + 2.0, w: tW - 0.3, h: 0.25,
        fontFace: "Consolas", fontSize: 9, color: C.mute, italic: true, margin: 0,
      });
      // separator
      s.addShape(p.shapes.LINE, {
        x: tx + 0.2, y: tY + 2.3, w: tW - 0.4, h: 0,
        line: { color: C.lightBorder, width: 0.5 },
      });
      s.addText(m.body, {
        x: tx + 0.15, y: tY + 2.4, w: tW - 0.3, h: 0.6,
        fontFace: "Calibri", fontSize: 9.5, color: C.darkText, margin: 0, lineSpacing: 13,
      });
      s.addText([
        { text: "Owns: ", options: { color: C.tealDeep, bold: true } },
        { text: m.owns, options: { color: C.mute } },
      ], {
        x: tx + 0.15, y: tY + 3.0, w: tW - 0.3, h: 0.45,
        fontFace: "Calibri", fontSize: 9.5, italic: true, margin: 0, lineSpacing: 13,
      });
    });

    // Pull quote
    const qY = 5.65;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y: qY, w: SW - 1.0, h: 1.0,
      fill: { color: C.lightCard }, line: { color: C.tealDeep, width: 1.0 }, rectRadius: 0.08,
    });
    s.addImage({ data: ICO.shieldD, x: 0.8, y: qY + 0.3, w: 0.4, h: 0.4 });
    s.addText([
      { text: "Gitel", options: { color: C.tealDeep, bold: true } },
      { text: " has been building Brazilian ", options: { color: C.darkText } },
      { text: "electronic-security", options: { color: C.tealDeep, italic: true, bold: true } },
      { text: " infrastructure for ", options: { color: C.darkText } },
      { text: "38 years", options: { color: C.tealDeep, bold: true } },
      { text: " — CCTV, IoT, access control, NOC.\nThat is the exact tech stack behind Vaulx's atomic custody invariant.", options: { color: C.darkText } },
    ], {
      x: 1.4, y: qY + 0.1, w: SW - 1.9, h: 0.85,
      fontFace: "Georgia", fontSize: 13, italic: true, valign: "middle", margin: 0, lineSpacing: 18,
    });

    s.addText([
      { text: "Validation: ", options: { color: C.tealDeep, bold: true } },
      { text: "Active commercial conversations with appraisers, custodians, and curators.", options: { color: C.mute, italic: true } },
    ], {
      x: 0.5, y: 6.85, w: SW - 1.0, h: 0.35,
      fontFace: "Calibri", fontSize: 11, align: "center", margin: 0,
    });

    s.addNotes("Five founders, five non-overlapping axes. I run global banking, corporate, and institutional. Marcelo, CEO of Gitel — thirty-eight years in Brazilian electronic-security — runs custody and operational solidity. That is the exact tech behind Vaulx's atomic custody invariant. Rodrigo runs Brazil and LATAM BD, including Mercado Bitcoin. Edson shipped four Anchor programs. Felipe, CEO of four-p-finance, advises on DeFi and community. Active commercial conversations with appraisers, custodians, and curators are open today. No competitor can assemble this team.");
  }

  // ============================================================
  // SLIDE 10 — Distribution: built-in (light)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.lightBg };
    addHeaderMark(s, false);
    s.addText("09 / DISTRIBUTION", {
      x: SW - 3.5, y: 0.27, w: 3.0, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealDeep,
      align: "right", charSpacing: 6, margin: 0,
    });

    s.addText("Distribution is built-in.", {
      x: 0.5, y: 0.75, w: SW - 1.0, h: 0.6,
      fontFace: "Georgia", fontSize: 30, bold: true, color: C.darkText, margin: 0,
    });
    s.addText("The team's existing networks + reusable Solana identity = low CAC at launch.", {
      x: 0.5, y: 1.35, w: SW - 1.0, h: 0.35,
      fontFace: "Calibri", fontSize: 13, italic: true, color: C.mute, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 0.5, y: 1.72, w: 1.0, h: 0, line: { color: C.tealDeep, width: 1.5 } });

    const channels = [
      {
        num: "01", icon: ICO.userD, title: "Direct (BR + LATAM)", subtitle: "Borrower-side",
        items: [
          ["4p.finance pipeline", "Felipe processes São Paulo's luxury-watch flow on crypto rails today"],
          ["Rodrigo's BD network", "Brazil + LATAM bank, custodian, partner relationships"],
          ["Marcelo + Gitel", "Operational credibility · supplier network · 38 yrs in BR electronic-security"],
        ],
        quote: "Founders bring credibility, network, and the first cohort of customers.",
      },
      {
        num: "02", icon: ICO.chainD, title: "Reusable identity", subtitle: "Onboarding",
        items: [
          ["Sumsub ID Connect", "200+ partner protocols · users who KYC'd anywhere can borrow on Vaulx"],
          ["Native SAS attestations", "Sumsub × Solana Foundation, May 2025 — KYC once, borrow anywhere"],
          ["Crossmint social login", "1-tap onboarding · embedded Solana wallet · no seed phrase"],
        ],
        quote: "The borrower already passed KYC somewhere on Solana. We just read the attestation.",
      },
      {
        num: "03", icon: ICO.bankD, title: "Institutional & LP-side", subtitle: "Lender-side",
        items: [
          ["Mercado Bitcoin · Transfero", "BR institutional anchor lenders · MB ~4M users · regulated CVM exchanges"],
          ["Kamino V2 + Loopscale", "Curated lending vaults reach the existing Solana yield audience"],
          ["LP-side flywheel", "Curated vaults attract pre-qualified institutional liquidity · TVL feeds capacity"],
        ],
        quote: "LPs already exist on Solana. We give them yield backed by physical luxury.",
      },
    ];
    const dY = 2.0, dH = 4.55;
    const dW = (SW - 1.0 - 0.4) / 3;
    channels.forEach((ch, i) => {
      const dx = 0.5 + i * (dW + 0.2);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: dx, y: dY, w: dW, h: dH,
        fill: { color: C.lightCard }, line: { color: C.lightBorder, width: 0.75 }, rectRadius: 0.06,
      });
      s.addText("CHANNEL " + ch.num, {
        x: dx + 0.25, y: dY + 0.18, w: dW - 0.5, h: 0.3,
        fontFace: "Consolas", fontSize: 9, color: C.tealDeep, charSpacing: 4, bold: true, margin: 0,
      });
      s.addImage({ data: ch.icon, x: dx + dW - 0.7, y: dY + 0.18, w: 0.4, h: 0.4 });
      s.addText(ch.title, {
        x: dx + 0.25, y: dY + 0.5, w: dW - 0.5, h: 0.4,
        fontFace: "Georgia", fontSize: 18, bold: true, color: C.darkText, margin: 0,
      });
      s.addText(ch.subtitle, {
        x: dx + 0.25, y: dY + 0.92, w: dW - 0.5, h: 0.3,
        fontFace: "Calibri", fontSize: 11, italic: true, color: C.mute, margin: 0,
      });
      s.addShape(p.shapes.LINE, {
        x: dx + 0.25, y: dY + 1.25, w: dW - 0.5, h: 0,
        line: { color: C.lightBorder, width: 0.5 },
      });
      ch.items.forEach((it, j) => {
        const iy = dY + 1.4 + j * 0.85;
        s.addText("▸", {
          x: dx + 0.25, y: iy, w: 0.2, h: 0.3,
          fontFace: "Calibri", fontSize: 11, color: C.tealDeep, bold: true, margin: 0,
        });
        s.addText(it[0], {
          x: dx + 0.45, y: iy, w: dW - 0.7, h: 0.3,
          fontFace: "Calibri", fontSize: 11, bold: true, color: C.darkText, margin: 0,
        });
        s.addText(it[1], {
          x: dx + 0.45, y: iy + 0.28, w: dW - 0.7, h: 0.5,
          fontFace: "Calibri", fontSize: 9.5, color: C.mute, margin: 0, lineSpacing: 12,
        });
      });
      s.addText("“" + ch.quote + "”", {
        x: dx + 0.25, y: dY + dH - 0.65, w: dW - 0.5, h: 0.55,
        fontFace: "Georgia", fontSize: 10.5, italic: true, color: C.tealDeep, margin: 0, lineSpacing: 14,
      });
    });

    // Bottom bar
    const bY = 6.7;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.5, y: bY, w: SW - 1.0, h: 0.5,
      fill: { color: C.tealDeep }, line: { color: C.tealDeep, width: 0 },
    });
    s.addText([
      { text: "Low CAC at launch.  ", options: { color: C.cream, bold: true } },
      { text: "Growth is partner-network multiplication, not paid acquisition.", options: { color: "B7E2DF", italic: true } },
    ], {
      x: 0.5, y: bY, w: SW - 1.0, h: 0.5,
      fontFace: "Calibri", fontSize: 13, align: "center", valign: "middle", margin: 0,
    });

    s.addNotes("Distribution is built-in. Felipe at four-p-finance already processes São Paulo's luxury-watch flow on crypto rails today. Rodrigo's BR and LATAM BD network gives us direct partnership reach. Sumsub's ID-Connect network has two hundred plus partner protocols — every Solana user who KYC'd elsewhere can borrow on Vaulx with no friction. Lender side: Mercado Bitcoin, Transfero, Kamino, Loopscale. Low customer-acquisition cost at launch — partner-network multiplication, not paid acquisition.");
  }

  // ============================================================
  // SLIDE 11 — Traction · Ask · Close (dark)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.darkBg };

    // Hero band
    s.addText(vaulxRich(C.cream, C.tealBright, 90, true), {
      x: 0, y: 0.4, w: SW, h: 1.3, align: "center", margin: 0,
    });
    s.addText([
      { text: "The rail between physical luxury and onchain capital.  ", options: { color: C.creamMute, italic: true } },
      { text: "Built on Solana.  ", options: { color: C.tealBright, bold: true } },
      { text: "Live on Devnet today.", options: { color: C.tealBright, bold: true } },
    ], {
      x: 0, y: 1.85, w: SW, h: 0.4,
      fontFace: "Calibri", fontSize: 14, align: "center", margin: 0,
    });

    // 3 columns
    const colY = 2.5, colH = 3.7;
    const cgap = 0.25;
    const colW = (SW - 1.0 - 2 * cgap) / 3;

    // Card 1 — Traction
    const c1X = 0.5;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: c1X, y: colY, w: colW, h: colH,
      fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.08,
    });
    s.addText("TRACTION  ·  LIVE TODAY", {
      x: c1X + 0.25, y: colY + 0.2, w: colW - 0.5, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealBright, charSpacing: 4, bold: true, margin: 0,
    });
    s.addText("Built. Tested. Live.", {
      x: c1X + 0.25, y: colY + 0.55, w: colW - 0.5, h: 0.5,
      fontFace: "Georgia", fontSize: 22, bold: true, color: C.cream, margin: 0,
    });
    s.addShape(p.shapes.LINE, {
      x: c1X + 0.25, y: colY + 1.1, w: 1.0, h: 0, line: { color: C.tealBright, width: 1 },
    });
    const tractionItems = [
      "4 Anchor programs on Devnet — vault · loan · trdc · auction",
      "45+ anchor tests · all green · CI gating",
      "vaulx.vercel.app — frontend live · /admin/demo cockpit",
      "Indexer + bridge running · Supabase event log",
    ];
    tractionItems.forEach((it, i) => {
      const iy = colY + 1.3 + i * 0.55;
      s.addText([
        { text: "▸  ", options: { color: C.tealBright } },
        { text: it, options: { color: C.cream } },
      ], {
        x: c1X + 0.25, y: iy, w: colW - 0.5, h: 0.55,
        fontFace: "Calibri", fontSize: 11, valign: "top", margin: 0, lineSpacing: 14,
      });
    });

    // Card 2 — Ask (highlighted)
    const c2X = c1X + colW + cgap;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: c2X, y: colY, w: colW, h: colH,
      fill: { color: C.darkCard }, line: { color: C.tealBright, width: 1.2 }, rectRadius: 0.08,
    });
    s.addText("OUR ASK  ·  COLOSSEUM PRIZE", {
      x: c2X + 0.25, y: colY + 0.2, w: colW - 0.5, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealBright, charSpacing: 4, bold: true, margin: 0,
    });
    s.addText("$250K", {
      x: c2X, y: colY + 0.55, w: colW, h: 1.1,
      fontFace: "Georgia", fontSize: 60, bold: true, color: C.cream, align: "center", margin: 0,
    });
    s.addText("Solana RWA track  ·  pre-seed", {
      x: c2X, y: colY + 1.65, w: colW, h: 0.3,
      fontFace: "Calibri", fontSize: 12, italic: true, color: C.tealBright, align: "center", margin: 0,
    });
    s.addShape(p.shapes.LINE, {
      x: c2X + 0.4, y: colY + 2.05, w: colW - 0.8, h: 0, line: { color: C.darkBorder, width: 0.5 },
    });
    const askItems = [
      "To get to mainnet with audited contracts",
      "To close first custodian + appraiser + curator",
      "Bridge to seed round with traction + revenue",
    ];
    askItems.forEach((it, i) => {
      s.addText([
        { text: "▸  ", options: { color: C.tealBright } },
        { text: it, options: { color: C.cream } },
      ], {
        x: c2X + 0.3, y: colY + 2.25 + i * 0.42, w: colW - 0.6, h: 0.4,
        fontFace: "Calibri", fontSize: 11, margin: 0, valign: "middle",
      });
    });

    // Card 3 — Use of funds milestones
    const c3X = c2X + colW + cgap;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: c3X, y: colY, w: colW, h: colH,
      fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.08,
    });
    s.addText("USE OF FUNDS  ·  MILESTONES", {
      x: c3X + 0.25, y: colY + 0.2, w: colW - 0.5, h: 0.3,
      fontFace: "Consolas", fontSize: 10, color: C.tealBright, charSpacing: 4, bold: true, margin: 0,
    });
    s.addText("Audit → mainnet → 100 customers.", {
      x: c3X + 0.25, y: colY + 0.55, w: colW - 0.5, h: 0.5,
      fontFace: "Georgia", fontSize: 17, bold: true, color: C.cream, margin: 0,
    });
    s.addShape(p.shapes.LINE, {
      x: c3X + 0.25, y: colY + 1.1, w: 1.0, h: 0, line: { color: C.tealBright, width: 1 },
    });
    const milestones = [
      ["Day 0",   "audit kickoff · external review + bug bounty"],
      ["Day 60",  "Sekuro custodian signed · Lloyd's binder confirmed"],
      ["Day 90",  "mainnet launch · first loan originated"],
      ["Q3 2026", "50 customers · senior + junior tranches live"],
      ["Q4 2026", "100 customers · seed close · $1.5–3M to scale"],
    ];
    milestones.forEach((m, i) => {
      const iy = colY + 1.3 + i * 0.5;
      s.addText(m[0], {
        x: c3X + 0.25, y: iy, w: 1.1, h: 0.3,
        fontFace: "Consolas", fontSize: 11, bold: true, color: C.tealBright, margin: 0,
      });
      s.addText(m[1], {
        x: c3X + 1.4, y: iy, w: colW - 1.6, h: 0.45,
        fontFace: "Calibri", fontSize: 10, color: C.cream, margin: 0, lineSpacing: 13,
      });
    });

    // Footer row
    const fY = 6.55;
    s.addShape(p.shapes.LINE, {
      x: 0.5, y: fY, w: SW - 1.0, h: 0,
      line: { color: C.darkBorder, width: 0.5 },
    });
    s.addImage({ data: ICO.githubT, x: 0.5, y: fY + 0.25, w: 0.25, h: 0.25 });
    s.addText("github.com/Vaulxfi   ·   vaulx.vercel.app   ·   Solana Devnet   ·   Mainnet Q3 2026", {
      x: 0.85, y: fY + 0.2, w: 7.0, h: 0.4,
      fontFace: "Consolas", fontSize: 11, color: C.creamMute, valign: "middle", margin: 0,
    });

    // CTA pill
    const btnX = SW - 4.0, btnY = fY + 0.2, btnW = 3.5, btnH = 0.55;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: btnX, y: btnY, w: btnW, h: btnH,
      fill: { color: C.tealDeep }, line: { color: C.tealBright, width: 1.0 }, rectRadius: 0.3,
    });
    s.addText([
      { text: "Come build with ", options: { color: C.cream, bold: true } },
      { text: "us", options: { color: C.cream, bold: true, italic: true } },
      { text: ".   →", options: { color: C.cream, bold: true } },
    ], {
      x: btnX, y: btnY, w: btnW, h: btnH,
      fontFace: "Calibri", fontSize: 14, align: "center", valign: "middle", margin: 0,
    });

    s.addNotes("Vaulx. Built. Tested. Live on Devnet today — four programs, forty-five-plus tests, frontend running, demo cockpit shipped. Our ask: the two-hundred-and-fifty-thousand-dollar Colosseum prize, to take Vaulx from Devnet to mainnet. Audit our four programs, close Sekuro as our first custodian, originate our first fifty mainnet loans by Q3, one hundred by Q4, and bridge to seed. The rail between physical luxury and onchain capital. Built on Solana. Come build with us.");
  }

  await p.writeFile({ fileName: OUT });
  console.log("Wrote:", OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
