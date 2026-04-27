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
  webpack: (config) => {
    // Privy's optional Farcaster Solana mini-app is declared as an optional
    // peer but still bundled by webpack; stub it out at resolve time.
    // See @privy-io/react-auth peerDependenciesMeta.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@farcaster/mini-app-solana": false,
    };
    return config;
  }
};

export default nextConfig;
