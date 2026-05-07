const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const fa6 = require("react-icons/fa6");
const md = require("react-icons/md");
const si = require("react-icons/si");

const OUT = "/Users/gogy/MyCODE/VAULX/.claude/worktrees/recursing-mcnulty-a36d0a/docs/colosseum/Vaulx_Pitch_v8b.pptx";
const SW = 13.333, SH = 7.5;

const C = {
  darkBg: "061418",
  darkCard: "0C1E25",
  darkBorder: "1B3D47",
  darkBorderSoft: "13303A",
  cream: "EDE5D2",
  creamSoft: "D9D2BD",
  tealBright: "2DD4BF",
  tealSoft: "5EEAD4",
  tealMid: "14B8A6",
  tealDeep: "0F766E",
  tealDark: "0E443F",
  lightBg: "F5F1E8",
  lightCard: "FFFFFF",
  lightBorder: "E0DBC9",
  lightCircle: "ECE7D8",
  lightDivider: "D3CDBC",
  darkText: "0B2326",
  mutedDark: "8A9AA1",
  mutedLight: "5B6B71",
  white: "FFFFFF",
};

async function iconPng(Icon, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

function vaulxRich(creamColor, tealColor, fontSize, bold = true) {
  return [
    { text: "Vau", options: { color: creamColor, fontSize, fontFace: "Georgia", bold } },
    { text: "l", options: { color: tealColor, fontSize, fontFace: "Georgia", bold, italic: true } },
    { text: "x", options: { color: creamColor, fontSize, fontFace: "Georgia", bold } },
  ];
}

async function main() {
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE";
  p.title = "Vaulx Pitch v8b (visual mockup)";
  p.author = "Vaulx";

  const ICO = {
    shieldT:    await iconPng(fa.FaShieldAlt, "#2DD4BF"),
    shieldChkT: await iconPng(md.MdVerifiedUser, "#2DD4BF"),
    shieldChkD: await iconPng(md.MdVerifiedUser, "#0F766E"),
    globeT:     await iconPng(fa.FaGlobe, "#2DD4BF"),
    globeD:     await iconPng(fa.FaGlobe, "#0F766E"),
    rocketT:    await iconPng(fa.FaRocket, "#2DD4BF"),
    diamondT:   await iconPng(fa6.FaGem, "#2DD4BF"),
    diamondTbright:await iconPng(fa6.FaGem, "#5EEAD4"),
    bankT:      await iconPng(fa.FaUniversity, "#2DD4BF"),
    bankD:      await iconPng(fa.FaUniversity, "#0F766E"),
    solanaT:    await iconPng(si.SiSolana, "#2DD4BF"),
    solanaD:    await iconPng(si.SiSolana, "#0F766E"),
    dropT:      await iconPng(md.MdWaterDrop, "#2DD4BF"),
    tagT:       await iconPng(fa.FaTag, "#2DD4BF"),
    boltT:      await iconPng(fa.FaBolt, "#2DD4BF"),
    layersT:    await iconPng(fa.FaLayerGroup, "#2DD4BF"),
    chartT:     await iconPng(fa.FaChartLine, "#2DD4BF"),
    chartD:     await iconPng(fa.FaChartLine, "#0F766E"),
    watchT:     await iconPng(md.MdWatch, "#2DD4BF"),
    watchD:     await iconPng(md.MdWatch, "#0F766E"),
    searchD:    await iconPng(fa.FaSearch, "#0F766E"),
    safeD:      await iconPng(md.MdLock, "#0F766E"),
    dollarCircD:await iconPng(fa.FaDollarSign, "#0F766E"),
    scaleD:     await iconPng(fa6.FaScaleBalanced, "#0F766E"),
    userChkD:   await iconPng(fa.FaUserCheck, "#0F766E"),
    clipD:      await iconPng(fa.FaClipboardCheck, "#0F766E"),
    linkD:      await iconPng(fa.FaLink, "#0F766E"),
    syncD:      await iconPng(fa.FaSyncAlt, "#0F766E"),
    handD:      await iconPng(fa.FaHandshake, "#0F766E"),
    codeD:      await iconPng(fa.FaCode, "#0F766E"),
    codeT:      await iconPng(fa.FaCode, "#2DD4BF"),
    shareD:     await iconPng(fa.FaShareAlt, "#0F766E"),
    calendarT:  await iconPng(fa.FaCalendarAlt, "#2DD4BF"),
    userT:      await iconPng(fa.FaUser, "#2DD4BF"),
    githubT:    await iconPng(fa.FaGithub, "#2DD4BF"),
    latamD:     await iconPng(md.MdMap, "#0F766E"),
    chartUpT:   await iconPng(fa6.FaArrowTrendUp, "#2DD4BF"),
  };

  // ============================================================
  // SLIDE 1: Cover (dark)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.darkBg };

    s.addText(vaulxRich(C.cream, C.tealBright, 130, true), {
      x: 0.7, y: 0.4, w: 6.5, h: 1.9, fontFace: "Georgia", margin: 0,
    });
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.75, y: 2.32, w: 0.75, h: 0.04,
      fill: { color: C.tealBright }, line: { color: C.tealBright, width: 0 },
    });
    s.addText("The rail between physical luxury\nand onchain capital.", {
      x: 0.7, y: 2.55, w: 8.5, h: 1.4,
      fontFace: "Georgia", fontSize: 38, color: C.cream,
      paraSpaceAfter: 0, lineSpacing: 44, margin: 0,
    });
    s.addText([
      { text: "A ", options: { color: C.creamSoft } },
      { text: "Solana-native", options: { color: C.tealBright } },
      { text: " protocol for custody-gated loans against\nphysical luxury assets. Brazil is the launch wedge.\nThe architecture is global and modular.", options: { color: C.creamSoft } },
    ], {
      x: 0.7, y: 4.0, w: 7.5, h: 1.3,
      fontFace: "Calibri", fontSize: 14, lineSpacing: 22, margin: 0,
    });

    const cardY = 5.55, cardH = 0.95, cardW = 3.0, gap = 0.18;
    const cards = [
      { icon: ICO.shieldT, title: "Custody-gated", body: "No custody signature,\nno USDC" },
      { icon: ICO.globeT,  title: "Modular",       body: "Global core,\nlocal licensed partners" },
      { icon: ICO.rocketT, title: "Built",         body: "Devnet live today" },
    ];
    cards.forEach((c, i) => {
      const cx = 0.7 + i * (cardW + gap);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: cardY, w: cardW, h: cardH,
        fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.08,
      });
      s.addImage({ data: c.icon, x: cx + 0.18, y: cardY + 0.22, w: 0.5, h: 0.5 });
      s.addText(c.title, {
        x: cx + 0.85, y: cardY + 0.12, w: cardW - 0.95, h: 0.32,
        fontFace: "Georgia", fontSize: 16, bold: true, color: C.cream, margin: 0, valign: "middle",
      });
      s.addText(c.body, {
        x: cx + 0.85, y: cardY + 0.42, w: cardW - 0.95, h: 0.45,
        fontFace: "Calibri", fontSize: 11, color: C.mutedDark, margin: 0, lineSpacing: 14,
      });
    });

    s.addShape(p.shapes.LINE, {
      x: 0.7, y: 6.78, w: SW - 1.4, h: 0,
      line: { color: C.darkBorder, width: 0.75 },
    });
    const tagY = 6.95;
    const tagItems = [
      { icon: ICO.diamondT, text: "PHYSICAL LUXURY" },
      { icon: ICO.bankT,    text: "LICENSED CUSTODY" },
      { icon: ICO.solanaT,  text: "SOLANA-NATIVE" },
      { icon: ICO.dropT,    text: "ONCHAIN LIQUIDITY" },
    ];
    const tagW = (SW - 1.4) / tagItems.length;
    tagItems.forEach((t, i) => {
      const tx = 0.7 + i * tagW;
      s.addImage({ data: t.icon, x: tx + 0.05, y: tagY + 0.03, w: 0.28, h: 0.28 });
      s.addText(t.text, {
        x: tx + 0.4, y: tagY, w: tagW - 0.5, h: 0.34,
        fontFace: "Calibri", fontSize: 10, color: C.creamSoft, bold: true,
        charSpacing: 4, valign: "middle", margin: 0,
      });
      if (i < tagItems.length - 1) {
        s.addShape(p.shapes.OVAL, {
          x: 0.7 + (i + 1) * tagW - 0.06, y: tagY + 0.13, w: 0.07, h: 0.07,
          fill: { color: C.tealBright }, line: { color: C.tealBright, width: 0 },
        });
      }
    });
  }

  // ============================================================
  // SLIDE 2: Problem (dark)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.darkBg };

    s.addText(vaulxRich(C.cream, C.tealBright, 28, true), {
      x: 0.7, y: 0.3, w: 2.0, h: 0.55, fontFace: "Georgia", margin: 0,
    });
    s.addShape(p.shapes.LINE, {
      x: 0.7, y: 0.85, w: 1.5, h: 0,
      line: { color: C.tealDeep, width: 1.5 },
    });
    s.addText("Luxury collateral. Broken credit rails.", {
      x: 0.7, y: 1.0, w: SW - 1.4, h: 1.1,
      fontFace: "Georgia", fontSize: 42, bold: true, color: C.cream, margin: 0,
    });
    s.addText("Asset-rich borrowers face punitive short-term credit. Global onchain capital has no trusted path to physical luxury collateral.", {
      x: 0.7, y: 2.18, w: SW - 1.4, h: 0.5,
      fontFace: "Calibri", fontSize: 14, color: C.creamSoft, margin: 0,
    });

    const colTopY = 2.85;
    s.addText("Borrower pain", {
      x: 0.7, y: colTopY, w: 5.5, h: 0.45,
      fontFace: "Georgia", fontSize: 22, bold: true, color: C.cream, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 0.7, y: colTopY + 0.42, w: 1.0, h: 0, line: { color: C.tealDeep, width: 1.5 } });

    s.addText("Capital side", {
      x: 7.0, y: colTopY, w: 5.5, h: 0.45,
      fontFace: "Georgia", fontSize: 22, bold: true, color: C.cream, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 7.0, y: colTopY + 0.42, w: 0.9, h: 0, line: { color: C.tealDeep, width: 1.5 } });

    const leftX = 0.7, leftW = 5.9;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: leftX, y: 3.5, w: leftW, h: 1.7,
      fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.08,
    });
    s.addImage({ data: ICO.watchT, x: leftX + leftW/2 - 0.5, y: 3.7, w: 1.0, h: 1.0 });
    s.addText("Physical luxury holds value, but credit rails are broken.", {
      x: leftX + 0.2, y: 4.78, w: leftW - 0.4, h: 0.35,
      fontFace: "Calibri", fontSize: 11, color: C.creamSoft, margin: 0,
    });

    const tblY = 5.4, tblH = 1.5, rowH = tblH / 3;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: leftX, y: tblY, w: leftW, h: tblH,
      fill: { color: null, transparency: 100 }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.06,
    });
    const rows = [
      ["Credit card revolving", "punitive APR"],
      ["Consumer loan", "expensive"],
      ["Formal pawn", "low LTV, undervalued asset"],
    ];
    rows.forEach((r, i) => {
      const ry = tblY + i * rowH;
      if (i > 0) {
        s.addShape(p.shapes.LINE, {
          x: leftX, y: ry, w: leftW, h: 0,
          line: { color: C.darkBorderSoft, width: 0.5 },
        });
      }
      s.addText(r[0], {
        x: leftX + 0.25, y: ry, w: leftW * 0.45, h: rowH,
        fontFace: "Calibri", fontSize: 13, color: C.cream, valign: "middle", margin: 0,
      });
      s.addShape(p.shapes.LINE, {
        x: leftX + leftW * 0.5, y: ry + 0.04, w: 0, h: rowH - 0.08,
        line: { color: C.darkBorderSoft, width: 0.5 },
      });
      s.addText(r[1], {
        x: leftX + leftW * 0.52, y: ry, w: leftW * 0.46, h: rowH,
        fontFace: "Calibri", fontSize: 13, color: C.tealBright, valign: "middle", margin: 0,
      });
    });

    const rX = 7.0, rW = 5.6;
    s.addText("✦", {
      x: 6.6, y: 4.2, w: 0.4, h: 0.4,
      fontSize: 18, color: C.tealBright, fontFace: "Calibri", align: "center", valign: "middle", margin: 0,
    });
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: rX, y: 3.5, w: rW, h: 2.5,
      fill: { color: C.darkCard }, line: { color: C.tealDeep, width: 1.0 }, rectRadius: 0.08,
    });
    s.addText("ONCHAIN USDC CAPITAL", {
      x: rX, y: 3.65, w: rW, h: 0.4,
      fontFace: "Calibri", fontSize: 14, color: C.tealBright, align: "center", charSpacing: 6, margin: 0,
    });
    s.addText("8–10% yield", {
      x: rX, y: 4.05, w: rW, h: 1.3,
      fontFace: "Georgia", fontSize: 60, bold: true, color: C.cream, align: "center", margin: 0,
    });
    s.addText("capital exists  ·  trusted rail missing", {
      x: rX, y: 5.45, w: rW, h: 0.4,
      fontFace: "Calibri", fontSize: 14, color: C.tealBright, align: "center", italic: true, margin: 0,
    });
    s.addText([
      { text: "→  ", options: { color: C.tealBright, fontFace: "Calibri" } },
      { text: "The gap is not capital.", options: { color: C.cream, fontFace: "Calibri" } },
    ], {
      x: rX + 0.3, y: 6.2, w: rW - 0.4, h: 0.35, fontSize: 14, margin: 0,
    });
    s.addText([
      { text: "→  ", options: { color: C.tealBright, fontFace: "Calibri" } },
      { text: "The gap is the rail.", options: { color: C.cream, fontFace: "Calibri" } },
    ], {
      x: rX + 0.3, y: 6.6, w: rW - 0.4, h: 0.35, fontSize: 14, margin: 0,
    });
  }

  // ============================================================
  // SLIDE 3: Why Solana (dark)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.darkBg };

    s.addText([
      { text: "Why Solana. Why now", options: { color: C.cream } },
      { text: ".", options: { color: C.tealBright } },
    ], {
      x: 0.7, y: 0.4, w: SW - 1.4, h: 1.0,
      fontFace: "Georgia", fontSize: 40, bold: true, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 0.7, y: 1.3, w: 1.0, h: 0, line: { color: C.tealDeep, width: 1.5 } });
    s.addText("The primitives now exist to make custody-gated physical collateral practical.", {
      x: 0.7, y: 1.45, w: SW - 1.4, h: 0.5,
      fontFace: "Calibri", fontSize: 16, color: C.creamSoft, margin: 0,
    });

    const cells = [
      { icon: ICO.tagT,    h: "cNFTs",                  big: "cheap collateral records",    sub: "cost-efficient at scale" },
      { icon: ICO.boltT,   h: "Fast settlement",        big: "real-time loan UX",            sub: "custody-gated disbursement in seconds" },
      { icon: ICO.layersT, h: "Composable liquidity",   big: "originate here, liquidity there", sub: "open lending rails" },
      { icon: ICO.shieldChkT, h: "Physical collateral", big: "asset-backed, not unsecured",  sub: "" },
      { icon: ICO.globeT,  h: "Modular architecture",   big: "global core, local partners",  sub: "" },
      { icon: ICO.chartUpT,h: "Emerging-market wedge",  big: "pain is highest where\nrates are punitive", sub: "" },
    ];
    const gridX = 0.7, gridY = 2.2, cellW = (SW - 1.4 - 0.4) / 3, cellH = 1.85, gx = 0.2, gy = 0.18;
    cells.forEach((c, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const cx = gridX + col * (cellW + gx);
      const cy = gridY + row * (cellH + gy);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: cy, w: cellW, h: cellH,
        fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.08,
      });
      s.addImage({ data: c.icon, x: cx + 0.25, y: cy + 0.25, w: 0.45, h: 0.45 });
      s.addText(c.h, {
        x: cx + 0.8, y: cy + 0.22, w: cellW - 1.0, h: 0.45,
        fontFace: "Georgia", fontSize: 16, color: C.tealBright, italic: true, valign: "middle", margin: 0, align: "center",
      });
      s.addShape(p.shapes.LINE, {
        x: cx + cellW/2 - 0.25, y: cy + 0.78, w: 0.5, h: 0,
        line: { color: C.tealDeep, width: 1 },
      });
      s.addText(c.big, {
        x: cx + 0.2, y: cy + 0.85, w: cellW - 0.4, h: 0.7,
        fontFace: "Georgia", fontSize: 18, color: C.cream, align: "center", valign: "middle",
        margin: 0, lineSpacing: 22,
      });
      if (c.sub) {
        s.addText(c.sub, {
          x: cx + 0.2, y: cy + 1.5, w: cellW - 0.4, h: 0.3,
          fontFace: "Calibri", fontSize: 11, color: C.mutedDark, align: "center", margin: 0,
        });
      }
    });

    const bX = 0.7, bY = gridY + 2 * (cellH + gy), bW = SW - 1.4, bH = 0.85;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: bX, y: bY, w: bW, h: bH,
      fill: { color: C.darkCard }, line: { color: C.tealDeep, width: 1.0 }, rectRadius: 0.08,
    });
    s.addText("V", {
      x: bX + 0.3, y: bY + 0.1, w: 0.7, h: 0.65,
      fontFace: "Georgia", fontSize: 36, bold: true, color: C.tealBright, align: "center", valign: "middle", margin: 0,
    });
    s.addShape(p.shapes.LINE, {
      x: bX + 1.1, y: bY + 0.18, w: 0, h: bH - 0.36,
      line: { color: C.tealDeep, width: 1 },
    });
    s.addText([
      { text: "Vaulx is ", options: { color: C.cream } },
      { text: "Solana-native", options: { color: C.tealBright } },
      { text: " by design, not a port from another chain.", options: { color: C.cream } },
    ], {
      x: bX + 1.3, y: bY, w: bW - 1.5, h: bH,
      fontFace: "Georgia", fontSize: 18, italic: true, valign: "middle", margin: 0,
    });
  }

  // ============================================================
  // SLIDE 4: No custody signature (light)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.lightBg };

    s.addText([
      { text: "No custody signature. ", options: { color: C.darkText } },
      { text: "No USDC.", options: { color: C.tealDeep } },
    ], {
      x: 0.7, y: 0.4, w: SW - 1.4, h: 1.0,
      fontFace: "Georgia", fontSize: 52, bold: true, margin: 0,
    });
    s.addText("The licensed custodian confirmation is the release trigger.", {
      x: 0.7, y: 1.45, w: SW - 1.4, h: 0.45,
      fontFace: "Calibri", fontSize: 16, color: C.mutedLight, margin: 0,
    });

    const steps = [
      { num: "01", title: "Appraisal",      icon: ICO.searchD,     body: "independent\nvaluation" },
      { num: "02", title: "Custody",        icon: ICO.safeD,       body: "licensed custodian\nvaults the asset" },
      { num: "03", title: "cNFT mint",      icon: null, hexLabel: "cNFT", body: "onchain collateral\nrecord" },
      { num: "04", title: "Borrow",         icon: ICO.dollarCircD, body: "USDC disburses\natomically" },
      { num: "05", title: "Repay / default",icon: ICO.scaleD,      body: "asset released or\nauction triggered" },
    ];
    const sY = 2.15, sH = 3.0;
    const totalW = SW - 1.4;
    const arrowW = 0.45;
    const stepW = (totalW - 4 * arrowW) / 5;
    steps.forEach((st, i) => {
      const sx = 0.7 + i * (stepW + arrowW);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: sx, y: sY, w: stepW, h: sH,
        fill: { color: C.lightCard }, line: { color: C.lightBorder, width: 0.75 }, rectRadius: 0.08,
      });
      s.addText(st.num, {
        x: sx, y: sY + 0.15, w: stepW, h: 0.3,
        fontFace: "Calibri", fontSize: 14, color: C.tealDeep, align: "center", margin: 0, bold: true,
      });
      s.addShape(p.shapes.LINE, {
        x: sx + stepW/2 - 0.18, y: sY + 0.45, w: 0.36, h: 0,
        line: { color: C.tealDeep, width: 1 },
      });
      s.addText(st.title, {
        x: sx, y: sY + 0.5, w: stepW, h: 0.35,
        fontFace: "Georgia", fontSize: 16, bold: true, color: C.darkText, align: "center", margin: 0,
      });
      if (st.icon) {
        s.addImage({ data: st.icon, x: sx + stepW/2 - 0.45, y: sY + 1.0, w: 0.9, h: 0.9 });
      } else if (st.hexLabel) {
        s.addShape(p.shapes.HEXAGON, {
          x: sx + stepW/2 - 0.55, y: sY + 1.0, w: 1.1, h: 0.95,
          fill: { color: null, transparency: 100 }, line: { color: C.tealDeep, width: 1.3 },
        });
        s.addText(st.hexLabel, {
          x: sx + stepW/2 - 0.55, y: sY + 1.0, w: 1.1, h: 0.95,
          fontFace: "Calibri", fontSize: 13, color: C.tealDeep, bold: true, align: "center", valign: "middle", margin: 0,
        });
      }
      s.addShape(p.shapes.LINE, {
        x: sx + 0.2, y: sY + 2.15, w: stepW - 0.4, h: 0,
        line: { color: C.lightDivider, width: 0.75, dashType: "dash" },
      });
      s.addText(st.body, {
        x: sx + 0.1, y: sY + 2.25, w: stepW - 0.2, h: 0.6,
        fontFace: "Calibri", fontSize: 12, color: C.mutedLight, align: "center", margin: 0, lineSpacing: 16,
      });
      if (i < steps.length - 1) {
        s.addText("→", {
          x: sx + stepW, y: sY + sH/2 - 0.25, w: arrowW, h: 0.5,
          fontSize: 22, color: C.tealDeep, fontFace: "Calibri", align: "center", valign: "middle", margin: 0,
        });
      }
    });

    const invY = 5.4, invH = 1.0;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: 0.7, y: invY, w: SW - 1.4, h: invH,
      fill: { color: C.tealDark }, line: { color: C.tealDark, width: 0 }, rectRadius: 0.08,
    });
    s.addImage({ data: ICO.shieldChkT, x: 1.0, y: invY + 0.22, w: 0.55, h: 0.55 });
    s.addText("Invariant: no loan disburses until the licensed custodian\nconfirms physical custody onchain.", {
      x: 1.8, y: invY, w: SW - 2.6, h: invH,
      fontFace: "Consolas", fontSize: 17, color: C.cream, valign: "middle", margin: 0, lineSpacing: 22,
    });

    s.addShape(p.shapes.LINE, {
      x: 0.7, y: 6.65, w: SW - 1.4, h: 0,
      line: { color: C.lightDivider, width: 0.5 },
    });
    s.addText([
      { text: "→  ", options: { color: C.tealDeep } },
      { text: "This is what makes physical collateral usable in an onchain credit system.", options: { color: C.darkText } },
    ], {
      x: 0.7, y: 6.8, w: SW - 1.4, h: 0.5,
      fontFace: "Consolas", fontSize: 13, margin: 0,
    });
  }

  // ============================================================
  // SLIDE 5: Modular protocol (light)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.lightBg };

    s.addText([
      { text: "A ", options: { color: C.darkText } },
      { text: "modular", options: { color: C.tealDeep } },
      { text: " protocol, not a local one-off.", options: { color: C.darkText } },
    ], {
      x: 0.7, y: 0.4, w: SW - 1.4, h: 1.0,
      fontFace: "Georgia", fontSize: 40, bold: true, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 0.7, y: 1.3, w: 1.0, h: 0, line: { color: C.tealDeep, width: 1.5 } });
    s.addText("Vaulx ships the global credit core once, then plugs in licensed local components market by market.", {
      x: 0.7, y: 1.45, w: SW - 1.4, h: 0.45,
      fontFace: "Calibri", fontSize: 14, color: C.mutedLight, margin: 0,
    });

    const steps = [
      { num: "01", icon: ICO.userChkD, title: "Borrower\nonboarding", body: "login · KYC ·\nasset submission" },
      { num: "02", icon: ICO.clipD,    title: "Appraisal",            body: "independent valuation ·\nasset verification" },
      { num: "03", icon: ICO.safeD,    title: "Licensed\ncustody",    body: "intake ·\ninsured vault" },
      { num: "04", icon: ICO.linkD,    title: "Onchain\nproof",       body: "cNFT mint ·\ncustody attestation" },
      { num: "05", icon: ICO.syncD,    title: "Borrow / repay /\nrelease", body: "USDC disbursement ·\nrepay or auction" },
    ];
    const sY = 2.4, sH = 3.0;
    const totalW = SW - 1.4;
    const arrowW = 0.4;
    const stepW = (totalW - 4 * arrowW) / 5;
    steps.forEach((st, i) => {
      const sx = 0.7 + i * (stepW + arrowW);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: sx, y: sY, w: stepW, h: sH,
        fill: { color: C.lightCard }, line: { color: C.lightBorder, width: 0.75 }, rectRadius: 0.08,
      });
      s.addText(st.num, {
        x: sx + 0.18, y: sY + 0.18, w: 0.6, h: 0.3,
        fontFace: "Calibri", fontSize: 14, color: C.tealDeep, margin: 0, bold: true,
      });
      s.addImage({ data: st.icon, x: sx + stepW/2 - 0.4, y: sY + 0.6, w: 0.8, h: 0.8 });
      s.addShape(p.shapes.LINE, {
        x: sx + 0.25, y: sY + 1.6, w: stepW - 0.5, h: 0,
        line: { color: C.lightDivider, width: 0.5 },
      });
      s.addText(st.title, {
        x: sx, y: sY + 1.7, w: stepW, h: 0.7,
        fontFace: "Georgia", fontSize: 16, bold: true, color: C.darkText, align: "center", margin: 0, lineSpacing: 20,
      });
      s.addText(st.body, {
        x: sx + 0.1, y: sY + 2.4, w: stepW - 0.2, h: 0.6,
        fontFace: "Calibri", fontSize: 11, color: C.mutedLight, align: "center", margin: 0, lineSpacing: 14,
      });
      if (i < steps.length - 1) {
        s.addText("→", {
          x: sx + stepW, y: sY + sH/2 - 0.25, w: arrowW, h: 0.5,
          fontSize: 22, color: C.tealDeep, fontFace: "Calibri", align: "center", valign: "middle", margin: 0,
        });
      }
    });

    const bY = 5.7, bH = 1.2;
    const halfW = (SW - 1.4 - 0.2) / 2;
    [
      { x: 0.7, icon: ICO.globeD, title: "Global core",    body: "Solana programs  ·  cNFT logic  ·  lending rails" },
      { x: 0.7 + halfW + 0.2, icon: ICO.bankD, title: "Local adapters", body: "appraisal  ·  custody  ·  legal docs  ·  fiat rails" },
    ].forEach(b => {
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: b.x, y: bY, w: halfW, h: bH,
        fill: { color: null, transparency: 100 }, line: { color: C.lightBorder, width: 0.75 }, rectRadius: 0.08,
      });
      s.addShape(p.shapes.OVAL, {
        x: b.x + 0.3, y: bY + 0.3, w: 0.65, h: 0.65,
        fill: { color: C.lightCircle }, line: { color: C.lightCircle, width: 0 },
      });
      s.addImage({ data: b.icon, x: b.x + 0.4, y: bY + 0.4, w: 0.45, h: 0.45 });
      s.addText(b.title, {
        x: b.x + 1.1, y: bY + 0.2, w: halfW - 1.2, h: 0.5,
        fontFace: "Georgia", fontSize: 22, bold: true, color: C.darkText, valign: "middle", margin: 0,
      });
      s.addText(b.body, {
        x: b.x + 1.1, y: bY + 0.65, w: halfW - 1.2, h: 0.4,
        fontFace: "Calibri", fontSize: 13, color: C.mutedLight, valign: "middle", margin: 0,
      });
    });
  }

  // ============================================================
  // SLIDE 6: Better for borrowers (light)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.lightBg };

    s.addText("Better for borrowers. Focused for capital.", {
      x: 0.7, y: 0.4, w: SW - 1.4, h: 0.9,
      fontFace: "Georgia", fontSize: 38, bold: true, color: C.darkText, margin: 0,
    });
    s.addText("Vaulx offers more usable capital per asset while targeting a differentiated wedge.", {
      x: 0.7, y: 1.32, w: SW - 1.4, h: 0.45,
      fontFace: "Calibri", fontSize: 14, color: C.mutedLight, margin: 0,
    });

    const tHead = ["Option", "Cost", "Capital per asset", "Positioning"];
    const tRows = [
      ["Credit card revolving", "very high", "n/a", "unsecured"],
      ["Consumer loan", "high", "n/a", "unsecured"],
      ["Formal pawn", "lower than unsecured, but low LTV", "limited", "asset-backed"],
    ];
    const vRow = ["VAULX", "more competitive", "higher LTV", "custody-gated onchain"];

    const tableData = [];
    tableData.push(tHead.map((h, i) => ({
      text: h,
      options: {
        color: C.tealDeep, bold: true, fontFace: "Calibri", fontSize: 14,
        align: i === 0 ? "left" : "center", valign: "middle",
        fill: { color: C.lightBg }, margin: [0.15, 0.2, 0.15, 0.2],
      },
    })));
    tRows.forEach((row) => {
      tableData.push(row.map((cell, i) => ({
        text: cell,
        options: {
          color: i === 0 ? C.darkText : C.mutedLight,
          bold: i === 0,
          fontFace: i === 0 ? "Georgia" : "Calibri",
          fontSize: 13,
          align: i === 0 ? "left" : "center",
          valign: "middle",
          fill: { color: C.lightBg },
          margin: [0.15, 0.2, 0.15, 0.2],
        },
      })));
    });
    tableData.push(vRow.map((cell, i) => ({
      text: cell,
      options: {
        color: C.cream, bold: i === 0, fontFace: i === 0 ? "Georgia" : "Calibri",
        fontSize: 13, align: i === 0 ? "left" : "center", valign: "middle",
        fill: { color: C.tealDark }, margin: [0.15, 0.2, 0.15, 0.2],
      },
    })));

    s.addTable(tableData, {
      x: 0.7, y: 1.95, w: SW - 1.4,
      colW: [3.0, 4.5, 2.4, (SW - 1.4) - 3.0 - 4.5 - 2.4],
      rowH: 0.55,
      border: { type: "solid", pt: 0.5, color: C.lightBorder },
      fontFace: "Calibri",
    });

    const cards = [
      { icon: ICO.watchD, title: "Physical luxury focus", body: "Targeting high-quality\nphysical luxury assets with\nstrong global demand." },
      { icon: ICO.solanaD, title: "Solana-native",        body: "Built on Solana for speed,\nlow cost, and seamless\nonchain experiences." },
      { icon: ICO.latamD,  title: "Emerging-market first",body: "Focused on high-rate\nemerging markets with large,\nunderserved demand." },
      { icon: ICO.bankD,   title: "Licensed-partner model",body:"Working with licensed\npartners to ensure compliant,\nscalable market entry." },
    ];
    const cY = 5.2, cH = 1.65;
    const cW = (SW - 1.4 - 0.6) / 4;
    cards.forEach((c, i) => {
      const cx = 0.7 + i * (cW + 0.2);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: cY, w: cW, h: cH,
        fill: { color: null, transparency: 100 }, line: { color: C.tealDeep, width: 0.75 }, rectRadius: 0.08,
      });
      s.addShape(p.shapes.OVAL, {
        x: cx + 0.2, y: cY + 0.2, w: 0.55, h: 0.55,
        fill: { color: C.lightCircle }, line: { color: C.lightCircle, width: 0 },
      });
      s.addImage({ data: c.icon, x: cx + 0.27, y: cY + 0.27, w: 0.4, h: 0.4 });
      s.addText(c.title, {
        x: cx + 0.85, y: cY + 0.18, w: cW - 0.95, h: 0.45,
        fontFace: "Georgia", fontSize: 14, bold: true, italic: true, color: C.darkText, valign: "middle", margin: 0,
      });
      s.addText(c.body, {
        x: cx + 0.2, y: cY + 0.85, w: cW - 0.4, h: 0.75,
        fontFace: "Calibri", fontSize: 11, color: C.mutedLight, margin: 0, lineSpacing: 14,
      });
    });

    s.addText("Other protocols touch collateralized lending, but not with Vaulx's focused Solana-native approach to physical luxury in high-rate emerging markets.", {
      x: 0.7, y: 7.05, w: SW - 1.4, h: 0.35,
      fontFace: "Calibri", fontSize: 12, color: C.mutedLight, italic: true, margin: 0,
    });
  }

  // ============================================================
  // SLIDE 7: Team "07" (light)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.lightBg };

    s.addText("07", {
      x: 0.7, y: 0.3, w: 1.0, h: 0.4,
      fontFace: "Calibri", fontSize: 14, color: C.tealDeep, margin: 0, bold: true,
    });
    s.addText("Operators, builders, and market access.", {
      x: 0.7, y: 0.7, w: SW - 1.4, h: 0.95,
      fontFace: "Georgia", fontSize: 42, bold: true, color: C.darkText, margin: 0,
    });
    s.addText("The team combines banking, operational execution, security infrastructure, Solana engineering, and live DeFi distribution.", {
      x: 0.7, y: 1.65, w: SW - 1.4, h: 0.4,
      fontFace: "Calibri", fontSize: 13, color: C.mutedLight, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 0.7, y: 2.05, w: 0.8, h: 0, line: { color: C.tealDeep, width: 1.5 } });

    const team = [
      { icon: ICO.shieldChkD, name: "George Dimitrov", role: "CEO",                   body: "corporate execution ·\nglobal banking operations ·\nregulatory fluency" },
      { icon: ICO.globeD,     name: "Marcelo",         role: "COO",                   body: "operational execution ·\nphysical and electronic\nsecurity · business network" },
      { icon: ICO.handD,      name: "Rodrigo",         role: "Partnerships & BD",     body: "institutional relationships ·\nmarket entry ·\ncommercial development" },
      { icon: ICO.codeD,      name: "Edson",           role: "Senior Solana Engineer",body: "protocol delivery ·\nAnchor stack ·\ntechnical solidity" },
      { icon: ICO.watchD,     name: "Felipe",          role: "DeFi & Market Access",  body: "crypto network ·\ncommunity ·\nluxury-watch reseller flow" },
    ];
    const tY = 2.3, tH = 3.0;
    const tW = (SW - 1.4 - 4 * 0.18) / 5;
    team.forEach((m, i) => {
      const tx = 0.7 + i * (tW + 0.18);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, {
        x: tx, y: tY, w: tW, h: tH,
        fill: { color: C.lightCard }, line: { color: C.lightBorder, width: 0.75 }, rectRadius: 0.08,
      });
      s.addShape(p.shapes.OVAL, {
        x: tx + tW/2 - 0.5, y: tY + 0.3, w: 1.0, h: 1.0,
        fill: { color: C.lightCircle }, line: { color: C.lightCircle, width: 0 },
      });
      s.addImage({ data: m.icon, x: tx + tW/2 - 0.32, y: tY + 0.48, w: 0.64, h: 0.64 });
      s.addText(m.name, {
        x: tx + 0.1, y: tY + 1.4, w: tW - 0.2, h: 0.4,
        fontFace: "Georgia", fontSize: 16, bold: true, color: C.darkText, align: "left", margin: 0,
      });
      s.addText(m.role, {
        x: tx + 0.1, y: tY + 1.78, w: tW - 0.2, h: 0.32,
        fontFace: "Calibri", fontSize: 12, color: C.tealDeep, margin: 0, bold: true,
      });
      s.addText(m.body, {
        x: tx + 0.1, y: tY + 2.18, w: tW - 0.2, h: 0.8,
        fontFace: "Calibri", fontSize: 11, color: C.mutedLight, margin: 0, lineSpacing: 14,
      });
    });

    const pY = 5.5, pH = 1.0;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: 0.7, y: pY, w: SW - 1.4, h: pH,
      fill: { color: null, transparency: 100 }, line: { color: C.tealDeep, width: 0.75 }, rectRadius: 0.08,
    });
    const stats = [
      { icon: ICO.shieldChkD, big: "4", lbl: "Anchor programs" },
      { icon: ICO.codeD,      big: "45+", lbl: "tests green" },
      { icon: ICO.shareD,     big: "",    lbl: "Devnet live", lblBig: true },
      { icon: ICO.chartD,     big: "",    lbl: "frontend +\nindexer running", lblBig: true },
    ];
    const stW = (SW - 1.4) / 4;
    stats.forEach((st, i) => {
      const sx = 0.7 + i * stW;
      s.addShape(p.shapes.OVAL, {
        x: sx + 0.4, y: pY + 0.22, w: 0.55, h: 0.55,
        fill: { color: C.lightCircle }, line: { color: C.lightCircle, width: 0 },
      });
      s.addImage({ data: st.icon, x: sx + 0.47, y: pY + 0.29, w: 0.4, h: 0.4 });
      if (st.big) {
        s.addText(st.big, {
          x: sx + 1.05, y: pY + 0.12, w: 1.4, h: 0.5,
          fontFace: "Georgia", fontSize: 26, bold: true, color: C.darkText, margin: 0,
        });
        s.addText(st.lbl, {
          x: sx + 1.05, y: pY + 0.55, w: stW - 1.2, h: 0.4,
          fontFace: "Georgia", fontSize: 14, italic: true, color: C.darkText, margin: 0,
        });
      } else {
        s.addText(st.lbl, {
          x: sx + 1.05, y: pY, w: stW - 1.2, h: pH,
          fontFace: "Georgia", fontSize: 16, italic: true, color: C.darkText, valign: "middle", margin: 0, lineSpacing: 18,
        });
      }
    });

    const tagY = 6.8, tagH = 0.45;
    s.addShape(p.shapes.RECTANGLE, {
      x: 0.7, y: tagY, w: SW - 1.4, h: tagH,
      fill: { color: C.tealDark }, line: { color: C.tealDark, width: 0 },
    });
    s.addText("BANKING   ·   SECURITY   ·   BD   ·   SOLANA   ·   DEFI", {
      x: 0.7, y: tagY, w: SW - 1.4, h: tagH,
      fontFace: "Calibri", fontSize: 13, color: C.cream, bold: true, charSpacing: 6,
      align: "center", valign: "middle", margin: 0,
    });
  }

  // ============================================================
  // SLIDE 8: Built today / Ask / Roadmap (dark)
  // ============================================================
  {
    const s = p.addSlide();
    s.background = { color: C.darkBg };

    s.addText([
      { text: "Built ", options: { color: C.cream } },
      { text: "today", options: { color: C.tealBright } },
      { text: ". Clear ", options: { color: C.cream } },
      { text: "ask", options: { color: C.tealBright } },
      { text: ". Next ", options: { color: C.cream } },
      { text: "milestones", options: { color: C.tealBright } },
      { text: ".", options: { color: C.cream } },
    ], {
      x: 0.7, y: 0.35, w: SW - 1.4, h: 0.9,
      fontFace: "Georgia", fontSize: 36, bold: true, margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: 0.7, y: 1.2, w: 1.0, h: 0, line: { color: C.tealDeep, width: 1.5 } });

    const colY = 1.45, colH = 4.6;
    const gap = 0.25;
    const colW = (SW - 1.4 - 2 * gap) / 3;

    const b1X = 0.7;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: b1X, y: colY, w: colW, h: colH,
      fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.08,
    });
    s.addImage({ data: ICO.shieldT, x: b1X + 0.3, y: colY + 0.3, w: 0.5, h: 0.5 });
    s.addText("Built today", {
      x: b1X + 0.95, y: colY + 0.28, w: colW - 1.05, h: 0.5,
      fontFace: "Georgia", fontSize: 22, bold: true, color: C.cream, valign: "middle", margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: b1X + 0.95, y: colY + 0.85, w: 0.5, h: 0, line: { color: C.tealDeep, width: 1.2 } });

    const builtItems = [
      "4 Anchor programs on Devnet",
      "45+ tests green",
      "frontend live",
      "Indexer + bridge running",
    ];
    builtItems.forEach((it, i) => {
      const iy = colY + 1.15 + i * 0.5;
      s.addText([
        { text: "→  ", options: { color: C.tealBright } },
        { text: it, options: { color: C.cream } },
      ], {
        x: b1X + 0.3, y: iy, w: colW - 0.6, h: 0.4,
        fontFace: "Calibri", fontSize: 13, valign: "middle", margin: 0,
      });
      if (i < builtItems.length - 1) {
        s.addShape(p.shapes.LINE, {
          x: b1X + 0.3, y: iy + 0.45, w: colW - 0.6, h: 0,
          line: { color: C.darkBorderSoft, width: 0.5 },
        });
      }
    });
    s.addImage({ data: ICO.codeT, x: b1X + colW/2 - 0.35, y: colY + colH - 0.95, w: 0.7, h: 0.7 });

    const b2X = b1X + colW + gap;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: b2X, y: colY, w: colW, h: colH,
      fill: { color: C.darkCard }, line: { color: C.tealBright, width: 1.0 }, rectRadius: 0.08,
    });
    s.addImage({ data: ICO.globeT, x: b2X + 0.3, y: colY + 0.3, w: 0.5, h: 0.5 });
    s.addText("Our ask", {
      x: b2X + 0.95, y: colY + 0.28, w: colW - 1.05, h: 0.5,
      fontFace: "Georgia", fontSize: 22, bold: true, italic: true, color: C.tealBright, valign: "middle", margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: b2X + 0.95, y: colY + 0.85, w: 0.5, h: 0, line: { color: C.tealBright, width: 1.2 } });

    s.addText("$250K", {
      x: b2X, y: colY + 1.05, w: colW, h: 1.0,
      fontFace: "Georgia", fontSize: 56, bold: true, color: C.cream, align: "center", margin: 0,
    });
    s.addText("Colosseum RWA track  ·  pre-seed bridge", {
      x: b2X, y: colY + 2.05, w: colW, h: 0.35,
      fontFace: "Calibri", fontSize: 12, italic: true, color: C.tealBright, align: "center", margin: 0,
    });
    s.addShape(p.shapes.LINE, {
      x: b2X + 0.4, y: colY + 2.5, w: colW - 0.8, h: 0,
      line: { color: C.darkBorder, width: 0.5 },
    });
    const askItems = [
      "contract audit",
      "legal and regulatory-proof structuring",
      "first licensed appraisal + custody partners",
      "mainnet launch",
    ];
    askItems.forEach((it, i) => {
      s.addText([
        { text: "→  ", options: { color: C.tealBright } },
        { text: it, options: { color: C.cream } },
      ], {
        x: b2X + 0.3, y: colY + 2.62 + i * 0.32, w: colW - 0.6, h: 0.32,
        fontFace: "Calibri", fontSize: 11.5, valign: "middle", margin: 0,
      });
    });
    s.addImage({ data: ICO.bankT, x: b2X + colW/2 - 0.3, y: colY + colH - 0.85, w: 0.6, h: 0.6 });

    const b3X = b2X + colW + gap;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: b3X, y: colY, w: colW, h: colH,
      fill: { color: C.darkCard }, line: { color: C.darkBorder, width: 0.75 }, rectRadius: 0.08,
    });
    s.addImage({ data: ICO.calendarT, x: b3X + 0.3, y: colY + 0.3, w: 0.5, h: 0.5 });
    s.addText("90-day roadmap", {
      x: b3X + 0.95, y: colY + 0.28, w: colW - 1.05, h: 0.5,
      fontFace: "Georgia", fontSize: 22, bold: true, color: C.cream, valign: "middle", margin: 0,
    });
    s.addShape(p.shapes.LINE, { x: b3X + 0.95, y: colY + 0.85, w: 0.5, h: 0, line: { color: C.tealDeep, width: 1.2 } });

    const road = [
      { icon: ICO.shieldChkT, day: "Day 0",   body: "audit + legal kickoff" },
      { icon: ICO.userT,      day: "Day 60",  body: "first partner stack signed" },
      { icon: ICO.rocketT,    day: "Day 90",  body: "mainnet + first real loan" },
      { icon: ICO.chartT,     day: "Q3/Q4",   body: "traction toward seed" },
    ];
    road.forEach((r, i) => {
      const iy = colY + 1.2 + i * 0.78;
      s.addImage({ data: r.icon, x: b3X + 0.3, y: iy + 0.06, w: 0.4, h: 0.4 });
      s.addText(r.day, {
        x: b3X + 0.85, y: iy, w: colW - 0.95, h: 0.32,
        fontFace: "Calibri", fontSize: 13, italic: true, color: C.tealBright, margin: 0, bold: true,
      });
      s.addText(r.body, {
        x: b3X + 0.85, y: iy + 0.32, w: colW - 0.95, h: 0.3,
        fontFace: "Calibri", fontSize: 12, color: C.cream, margin: 0,
      });
    });

    const fY = 6.25;
    s.addShape(p.shapes.LINE, {
      x: 0.7, y: fY, w: SW - 1.4, h: 0,
      line: { color: C.darkBorder, width: 0.5 },
    });
    s.addImage({ data: ICO.diamondTbright, x: 0.7, y: fY + 0.18, w: 0.4, h: 0.4 });
    s.addText([
      { text: "Vau", options: { color: C.cream, fontFace: "Georgia", bold: true } },
      { text: "l", options: { color: C.tealBright, fontFace: "Georgia", bold: true, italic: true } },
      { text: "x", options: { color: C.cream, fontFace: "Georgia", bold: true } },
      { text: " is the rail between physical luxury and onchain capital.", options: { color: C.cream, fontFace: "Georgia", bold: false } },
    ], {
      x: 1.18, y: fY + 0.1, w: 7.5, h: 0.5,
      fontSize: 16, valign: "middle", margin: 0,
    });

    s.addImage({ data: ICO.githubT, x: 0.7, y: fY + 0.78, w: 0.25, h: 0.25 });
    s.addText("github.com/Vaulxfi", {
      x: 1.0, y: fY + 0.76, w: 2.0, h: 0.3,
      fontFace: "Calibri", fontSize: 11, color: C.mutedDark, margin: 0,
    });
    s.addText("·", {
      x: 3.0, y: fY + 0.76, w: 0.2, h: 0.3,
      fontFace: "Calibri", fontSize: 14, color: C.tealBright, align: "center", margin: 0,
    });
    s.addImage({ data: ICO.globeT, x: 3.25, y: fY + 0.78, w: 0.25, h: 0.25 });
    s.addText("vaulx.vercel.app", {
      x: 3.55, y: fY + 0.76, w: 2.0, h: 0.3,
      fontFace: "Calibri", fontSize: 11, color: C.mutedDark, margin: 0,
    });

    const btnX = SW - 4.0, btnY = fY + 0.45, btnW = 3.3, btnH = 0.55;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, {
      x: btnX, y: btnY, w: btnW, h: btnH,
      fill: { color: null, transparency: 100 }, line: { color: C.tealBright, width: 1.0 }, rectRadius: 0.3,
    });
    s.addText([
      { text: "Come build with us.   ", options: { color: C.tealBright } },
      { text: "→", options: { color: C.tealBright } },
    ], {
      x: btnX, y: btnY, w: btnW, h: btnH,
      fontFace: "Calibri", fontSize: 14, bold: true, italic: true, align: "center", valign: "middle", margin: 0,
    });
  }

  await p.writeFile({ fileName: OUT });
  console.log("Wrote:", OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
