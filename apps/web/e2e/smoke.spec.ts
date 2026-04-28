import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke coverage for every public route walked during the audit.
 * Each test:
 *   - listens for console errors (excluding the known favicon 404)
 *   - asserts page title matches the Vaulx shell
 *   - asserts a known piece of body copy renders
 *   - fails on any 5xx network response
 */

type RouteCase = {
  path: string;
  expectedTitle: RegExp;
  expectText: string | RegExp;
  // Some borrow/* routes redirect to /demo/borrow/onboard when there is no
  // session state. We assert the rendered page rather than the URL when this
  // is set.
  expectedFinalUrl?: RegExp;
};

const ROUTES: RouteCase[] = [
  {
    path: "/",
    expectedTitle: /Vaulx/,
    expectText: /Lend against the/i,
  },
  {
    path: "/demo",
    expectedTitle: /Vaulx/,
    expectText: /Borrow against your watch/i,
  },
  {
    path: "/demo/lend",
    expectedTitle: /Vaulx/,
    expectText: /Pick a tranche/i,
  },
  {
    path: "/demo/lend/vaults/retail-usdc",
    expectedTitle: /Vaulx/,
    expectText: /Retail FIDC · USDC/,
  },
  {
    path: "/demo/lend/vaults/inst-usdc",
    expectedTitle: /Vaulx/,
    expectText: /Institutional/,
  },
  {
    path: "/demo/lend/vaults/inst-brl",
    expectedTitle: /Vaulx/,
    expectText: /Institutional/,
  },
  {
    path: "/demo/lend/vaults/retail-brl",
    expectedTitle: /Vaulx/,
    expectText: /Retail/,
  },
  {
    path: "/demo/lend/onboard",
    expectedTitle: /Vaulx/,
    expectText: /Accredited LP application/i,
  },
  {
    path: "/demo/lend/liquidity",
    expectedTitle: /Vaulx/,
    expectText: /Liquidity does not come from protocols/i,
  },
  {
    path: "/demo/borrow/onboard",
    expectedTitle: /Vaulx/,
    expectText: /Sign in\. Browse\. Verify when ready/i,
  },
  {
    path: "/demo/borrow/wallet",
    expectedTitle: /Vaulx/,
    expectText: /Solana smart wallet provisioned/i,
  },
  {
    path: "/demo/borrow/register",
    expectedTitle: /Vaulx/,
    expectText: /Register your watch/i,
  },
  // The following bounce to /demo/borrow/{onboard,register} when no session
  // exists. We accept the bounce target's copy as healthy — the assertion
  // here is just "page rendered without erroring".
  {
    path: "/demo/borrow/custody",
    expectedTitle: /Vaulx/,
    expectText: /Sign in\. Browse|custody|Register your watch/i,
  },
  {
    path: "/demo/borrow/disburse",
    expectedTitle: /Vaulx/,
    expectText: /Sign in\. Browse|Disburse|Register your watch/i,
  },
  {
    path: "/demo/borrow/funds",
    expectedTitle: /Vaulx/,
    expectText: /Sign in\. Browse|funds|Register your watch/i,
  },
  {
    path: "/demo/borrow/dashboard",
    expectedTitle: /Vaulx/,
    expectText: /Sign in\. Browse|dashboard|Register your watch/i,
  },
  {
    path: "/demo/borrow/verify-id",
    expectedTitle: /Vaulx/,
    expectText: /Verify your Brazilian identity/i,
  },
  // Sampled routes
  {
    path: "/demo/architecture",
    expectedTitle: /Vaulx/,
    expectText: /./,
  },
  {
    path: "/demo/auction",
    expectedTitle: /Vaulx/,
    expectText: /./,
  },
  {
    path: "/demo/dev/bezel",
    expectedTitle: /Vaulx/,
    expectText: /./,
  },
];

function attachConsoleAndNetwork(page: Page) {
  const consoleErrors: string[] = [];
  const serverErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    // Known + acceptable: favicon 404
    if (text.includes("favicon.ico")) return;
    consoleErrors.push(text);
  });

  page.on("response", (resp) => {
    const status = resp.status();
    if (status >= 500) {
      serverErrors.push(`${status} ${resp.url()}`);
    }
  });

  return { consoleErrors, serverErrors };
}

for (const route of ROUTES) {
  test(`smoke: ${route.path}`, async ({ page }) => {
    const { consoleErrors, serverErrors } = attachConsoleAndNetwork(page);

    const resp = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    expect(resp, `no response for ${route.path}`).not.toBeNull();
    expect(resp!.status(), `bad status for ${route.path}`).toBeLessThan(400);

    await expect(page).toHaveTitle(route.expectedTitle);

    // Body should contain a known piece of copy somewhere.
    await expect(page.locator("body")).toContainText(route.expectText);

    // Catch console + 5xx surprises.
    expect(consoleErrors, `console errors on ${route.path}`).toEqual([]);
    expect(serverErrors, `5xx on ${route.path}`).toEqual([]);
  });
}

test("legacy aliases redirect into the demo shell", async ({ page }) => {
  for (const [from, to] of [
    ["/lend", "/demo/lend"],
    ["/borrow/new/asset", "/demo/borrow/onboard"],
    ["/custodian/intake", "/demo/borrow/custody"],
  ] as const) {
    const resp = await page.goto(from, { waitUntil: "domcontentloaded" });
    expect(resp!.status(), `bad status for ${from}`).toBeLessThan(400);
    expect(page.url(), `expected ${from} to land on ${to}`).toContain(to);
  }
});
