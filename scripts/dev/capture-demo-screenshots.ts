// Reproducible capture of the 8 canonical demo screenshots used in README.
// Run with: BASE_URL=https://vaulx.vercel.app pnpm tsx scripts/dev/capture-demo-screenshots.ts
// Requires `playwright` to be installed; if it isn't, the live MCP playwright
// tools were used to capture the originals committed under
// apps/web/public/demo/screenshots/.
import { chromium } from "playwright";
import path from "node:path";

const ROUTES = [
  ["/demo", "landing"],
  ["/demo/borrow/onboard", "borrow-onboard"],
  ["/demo/borrow/disburse", "borrow-disburse"],
  ["/demo/borrow/dashboard", "borrow-dashboard"],
  ["/demo/lend", "lend"],
  ["/demo/lend/liquidity", "lend-liquidity"],
  ["/demo/auction/VX-7A2F", "auction-detail"],
  ["/demo/architecture", "architecture"],
] as const;

const BASE = process.env.BASE_URL ?? "https://vaulx.vercel.app";
const OUT = path.resolve("apps/web/public/demo/screenshots");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await ctx.newPage();
  for (const [route, slug] of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(OUT, `${slug}.png`),
      fullPage: false,
    });
    // eslint-disable-next-line no-console
    console.log("captured", slug);
  }
  await browser.close();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
