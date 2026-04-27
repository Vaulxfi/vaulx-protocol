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
    // @farcaster/mini-app-solana is an OPTIONAL Privy peer that's eagerly imported
    // at module load time. We don't have it installed (no Farcaster mini-app in
    // this project). Aliasing to `false` makes any import resolve to an empty
    // module — Privy's module-load completes; if a Farcaster code path is ever
    // invoked at runtime it will throw `undefined is not a function`. Demo flows
    // never hit it; remove this stub if Vaulx ever supports Farcaster.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@farcaster/mini-app-solana": false,
    };
    return config;
  }
};

export default nextConfig;
