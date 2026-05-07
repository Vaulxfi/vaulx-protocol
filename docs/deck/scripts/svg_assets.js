// SVG asset generators for Vaulx deck
// All hairline-stroke editorial illustrations. Render to PNG via sharp.

const sharp = require("sharp");

// ====================================================================
// WATCH — stylized hairline-stroke dive watch silhouette, side angle
// ====================================================================
function watchSvg(strokeColor = "#F5F0E8", strokeWidth = 2.2) {
  const w = 1200, h = 1200;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <style>
      .stroke { fill: none; stroke: ${strokeColor}; stroke-width: ${strokeWidth}; stroke-linecap: round; stroke-linejoin: round; }
      .stroke-thin { fill: none; stroke: ${strokeColor}; stroke-width: ${strokeWidth * 0.6}; stroke-linecap: round; }
      .fill { fill: ${strokeColor}; }
    </style>
  </defs>
  <!-- bracelet upper -->
  <path class="stroke" d="M 480 240 L 470 80 Q 470 60 490 60 L 710 60 Q 730 60 730 80 L 720 240" />
  <path class="stroke-thin" d="M 480 130 L 720 130" />
  <path class="stroke-thin" d="M 480 180 L 720 180" />
  <!-- bracelet lower -->
  <path class="stroke" d="M 480 960 L 470 1120 Q 470 1140 490 1140 L 710 1140 Q 730 1140 730 1120 L 720 960" />
  <path class="stroke-thin" d="M 480 1010 L 720 1010" />
  <path class="stroke-thin" d="M 480 1060 L 720 1060" />
  <!-- case -->
  <circle class="stroke" cx="600" cy="600" r="380" />
  <!-- bezel ring -->
  <circle class="stroke" cx="600" cy="600" r="340" />
  <!-- bezel hour markers (12 ticks) -->
  ${Array.from({length: 12}, (_, i) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    const x1 = 600 + Math.cos(a) * 360, y1 = 600 + Math.sin(a) * 360;
    const x2 = 600 + Math.cos(a) * 340, y2 = 600 + Math.sin(a) * 340;
    return `<line class="stroke" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`;
  }).join("\n  ")}
  <!-- bezel pip at 12 -->
  <circle class="stroke" cx="600" cy="225" r="12" />
  <!-- inner dial -->
  <circle class="stroke-thin" cx="600" cy="600" r="300" />
  <!-- hour indices -->
  ${Array.from({length: 12}, (_, i) => {
    if (i === 0) return ""; // skip 12 (pip already there)
    const a = (i * 30 - 90) * Math.PI / 180;
    const r1 = 270, r2 = 290;
    const x1 = 600 + Math.cos(a) * r1, y1 = 600 + Math.sin(a) * r1;
    const x2 = 600 + Math.cos(a) * r2, y2 = 600 + Math.sin(a) * r2;
    return `<line class="stroke" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${strokeWidth * 1.6}"/>`;
  }).join("\n  ")}
  <!-- hands: hour pointing 10, minute pointing 2 -->
  <line class="stroke" x1="600" y1="600" x2="450" y2="510" stroke-width="${strokeWidth * 2}"/>
  <line class="stroke" x1="600" y1="600" x2="780" y2="490" stroke-width="${strokeWidth * 1.5}"/>
  <!-- center cap -->
  <circle class="fill" cx="600" cy="600" r="14" />
  <!-- crown -->
  <rect class="stroke" x="975" y="585" width="22" height="30" rx="3"/>
  <!-- crown guard -->
  <path class="stroke" d="M 950 580 L 975 580 L 975 620 L 950 620" />
</svg>`;
}

// ====================================================================
// VAULT — minimal vault icon (alternative for slide 2 hero card)
// ====================================================================
function vaultSvg(strokeColor = "#F5F0E8", strokeWidth = 3) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <g fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <rect x="100" y="120" width="600" height="560" rx="20"/>
    <rect x="160" y="180" width="480" height="440" rx="10"/>
    <circle cx="400" cy="400" r="110"/>
    <circle cx="400" cy="400" r="55"/>
    <line x1="400" y1="290" x2="400" y2="330"/>
    <line x1="400" y1="470" x2="400" y2="510"/>
    <line x1="290" y1="400" x2="330" y2="400"/>
    <line x1="470" y1="400" x2="510" y2="400"/>
    <line x1="160" y1="640" x2="160" y2="700"/>
    <line x1="640" y1="640" x2="640" y2="700"/>
  </g>
</svg>`;
}

// ====================================================================
// WORLD MAP — stylized continental silhouettes, hairline stroke
// Coordinates roughly traced from a low-poly mercator outline.
// ====================================================================
function worldMapSvg(strokeColor = "#0E7C7B", pinColor = "#0FB5A6", goldColor = "#C9A86A") {
  const w = 1600, h = 800;
  // very simplified continent outlines; not geographically precise but editorial
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <g fill="none" stroke="${strokeColor}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" opacity="0.55">
    <!-- North America -->
    <path d="M 100 180 Q 130 130 220 130 L 300 145 Q 340 160 360 200 L 380 250 Q 380 290 360 310 L 320 340 L 280 360 Q 230 360 200 340 L 170 300 L 140 270 L 110 220 Z" />
    <!-- Greenland -->
    <path d="M 430 100 Q 470 90 490 110 L 495 145 Q 480 170 450 170 Q 430 160 425 140 Z" />
    <!-- Central / South America -->
    <path d="M 320 380 L 350 400 L 380 440 L 410 500 L 420 580 L 410 640 L 380 690 L 340 720 L 320 700 L 300 640 L 290 560 L 295 480 L 305 420 Z" />
    <!-- Europe -->
    <path d="M 700 180 L 760 170 L 820 180 L 850 220 L 820 260 L 770 270 L 720 250 L 690 220 Z" />
    <!-- Africa -->
    <path d="M 760 300 L 820 290 L 880 320 L 910 380 L 920 460 L 900 540 L 860 600 L 820 620 L 790 600 L 770 540 L 760 460 L 755 380 Z" />
    <!-- Middle East / West Asia -->
    <path d="M 870 250 L 950 240 L 990 280 L 1010 320 L 990 360 L 940 370 L 890 350 L 870 310 Z" />
    <!-- South Asia (India) -->
    <path d="M 1080 320 L 1130 310 L 1180 340 L 1190 400 L 1170 450 L 1140 470 L 1110 450 L 1090 410 Z" />
    <!-- East Asia / China -->
    <path d="M 1150 200 L 1250 190 L 1340 220 L 1380 270 L 1370 320 L 1310 340 L 1240 320 L 1190 290 L 1170 250 Z" />
    <!-- Southeast Asia islands -->
    <path d="M 1280 420 L 1340 410 L 1370 430 L 1360 460 L 1310 470 L 1280 450 Z" />
    <path d="M 1380 470 Q 1410 470 1420 490 Q 1410 510 1380 510 Z" />
    <!-- Australia -->
    <path d="M 1340 580 L 1420 570 L 1480 590 L 1500 620 L 1480 650 L 1420 660 L 1360 640 L 1340 610 Z" />
  </g>
  <!-- Country pins -->
  <!-- Brazil (large) -->
  <g>
    <circle cx="370" cy="540" r="14" fill="${pinColor}" opacity="0.95" />
    <circle cx="370" cy="540" r="22" fill="none" stroke="${pinColor}" stroke-width="1" opacity="0.4" />
    <circle cx="370" cy="540" r="32" fill="none" stroke="${pinColor}" stroke-width="0.6" opacity="0.2" />
    <text x="395" y="545" font-family="Consolas, monospace" font-size="16" fill="${strokeColor}" font-weight="bold">BR · 450%</text>
  </g>
  <!-- Mexico -->
  <g>
    <circle cx="240" cy="360" r="9" fill="${pinColor}" opacity="0.85" />
    <text x="260" y="365" font-family="Consolas, monospace" font-size="13" fill="${strokeColor}">MX · 80%</text>
  </g>
  <!-- Turkey -->
  <g>
    <circle cx="870" cy="265" r="9" fill="${pinColor}" opacity="0.85" />
    <text x="890" y="270" font-family="Consolas, monospace" font-size="13" fill="${strokeColor}">TR · 70%</text>
  </g>
  <!-- India -->
  <g>
    <circle cx="1140" cy="395" r="10" fill="${pinColor}" opacity="0.85" />
    <text x="1160" y="400" font-family="Consolas, monospace" font-size="13" fill="${strokeColor}">IN · 40%</text>
  </g>
  <!-- SE Asia cluster -->
  <g>
    <circle cx="1320" cy="450" r="7" fill="${pinColor}" opacity="0.7" />
    <circle cx="1350" cy="460" r="7" fill="${pinColor}" opacity="0.7" />
    <text x="1370" y="445" font-family="Consolas, monospace" font-size="13" fill="${strokeColor}">SEA · 30–45%</text>
  </g>
  <!-- South Africa -->
  <g>
    <circle cx="850" cy="595" r="8" fill="${pinColor}" opacity="0.8" />
    <text x="870" y="600" font-family="Consolas, monospace" font-size="13" fill="${strokeColor}">ZA · 22%</text>
  </g>
</svg>`;
}

// ====================================================================
// LATAM — small map silhouette focused on South America
// ====================================================================
function latamSvg(strokeColor = "#0E7C7B", pinColor = "#C9A86A") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" width="600" height="700">
  <g fill="none" stroke="${strokeColor}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" opacity="0.8">
    <path d="M 220 80 Q 280 70 340 100 L 380 150 L 410 220 L 430 320 L 410 410 L 380 500 L 320 600 L 270 650 L 230 620 L 200 540 L 180 440 L 175 340 L 190 220 L 200 140 Z"/>
  </g>
  <!-- Brazil pin -->
  <circle cx="340" cy="320" r="20" fill="${pinColor}" opacity="0.95"/>
  <circle cx="340" cy="320" r="34" fill="none" stroke="${pinColor}" stroke-width="1.2" opacity="0.4"/>
  <text x="370" y="328" font-family="Consolas, monospace" font-size="22" font-weight="bold" fill="${strokeColor}">BRAZIL</text>
</svg>`;
}

// ====================================================================
// SUBTLE GRAIN — turbulence noise overlay (very faint)
// ====================================================================
function grainSvg(opacity = 0.05) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 1
                             0 0 0 0 1
                             0 0 0 0 1
                             0 0 0 ${opacity} 0"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" filter="url(#noise)" />
</svg>`;
}

// ====================================================================
// HEX MODULE — hexagonal architecture module shape (for diagrams)
// ====================================================================
function hexModuleSvg(strokeColor = "#0E7C7B", fillColor = "transparent") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="200" height="220">
  <polygon points="100,10 190,60 190,160 100,210 10,160 10,60" fill="${fillColor}" stroke="${strokeColor}" stroke-width="3"/>
</svg>`;
}

// ====================================================================
// Render any SVG to PNG base64 via sharp
// ====================================================================
async function svgToPngB64(svgString, density = 200) {
  const buf = await sharp(Buffer.from(svgString), { density })
    .png()
    .toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

module.exports = { watchSvg, vaultSvg, worldMapSvg, latamSvg, grainSvg, hexModuleSvg, svgToPngB64 };
