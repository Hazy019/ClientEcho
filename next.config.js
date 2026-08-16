/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["isomorphic-dompurify", "jsdom", "postgres"],
  },
};

module.exports = nextConfig;
