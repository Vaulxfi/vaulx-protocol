/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@vaulx/types",
    "@vaulx/terms",
    "@vaulx/ccb",
    "@vaulx/anchor-client",
    "@vaulx/idls"
  ]
};

export default nextConfig;
