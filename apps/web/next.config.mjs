/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@vaulx/types",
    "@vaulx/terms",
    "@vaulx/ccb",
    "@vaulx/anchor-client",
    "@vaulx/idls"
  ],
  async redirects() {
    // Top-level marketing/stub routes redirect to the canonical /demo
    // walkthrough. The /demo tree is the working end-to-end flow; the
    // top-level routes are styled stubs that were never wired.
    return [
      { source: "/lend", destination: "/demo/lend", permanent: false },
      { source: "/lend/vaults", destination: "/demo/lend", permanent: false },
      { source: "/lend/auctions", destination: "/demo/auction", permanent: false },
      { source: "/borrow", destination: "/demo/borrow/onboard", permanent: false },
      { source: "/borrow/new/asset", destination: "/demo/borrow/onboard", permanent: false },
      { source: "/borrow/verify-id", destination: "/demo/borrow/verify-id", permanent: false },
      { source: "/borrow/verify-id/govbr-login", destination: "/demo/borrow/verify-id", permanent: false },
      { source: "/borrow/verify-id/redirecting", destination: "/demo/borrow/verify-id", permanent: false },
      { source: "/borrow/verify-id/callback", destination: "/demo/borrow/onboard", permanent: false },
      // Custodian: top-level /custodian/intake (no trdc param) was a hard 404.
      // Redirect to the demo's custodian flow page.
      { source: "/custodian", destination: "/demo/borrow/custody", permanent: false },
      { source: "/custodian/intake", destination: "/demo/borrow/custody", permanent: false },
    ];
  },
};

export default nextConfig;
