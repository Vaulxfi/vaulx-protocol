// Convert SVG/PNG logos to standardized PNGs for pptxgenjs embedding
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "/Users/gogy/MyCODE/VAULX/.claude/worktrees/recursing-mcnulty-a36d0a/docs/colosseum/partner_logos";
const OUT = "/tmp/vaulx_pptx/logo_pngs";

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const files = fs.readdirSync(SRC);
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    const base = path.basename(f, ext);
    const inPath = path.join(SRC, f);
    const outPath = path.join(OUT, `${base}.png`);
    try {
      if (ext === ".svg") {
        await sharp(inPath, { density: 300 })
          .resize({ height: 200, fit: "inside", withoutEnlargement: false, background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toFile(outPath);
      } else if (ext === ".png") {
        await sharp(inPath)
          .resize({ height: 200, fit: "inside", withoutEnlargement: false })
          .png()
          .toFile(outPath);
      } else continue;
      console.log("→", base);
    } catch (e) {
      console.log("✗ SKIP", base, ":", e.message.split("\n")[0].slice(0, 80));
    }
  }
  console.log("Done.");
})();
